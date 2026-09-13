import { tool } from 'ai';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { readStoredFeed as fetchRecalls } from './recall-sync.server';
import { matchPatients, patients, normalizeNdc, getStats, affectedCountByRecall, classificationRank } from './recall-matching';
import { analyseCase } from './analysis.server';
import { patientRefillSummary } from './refill-tracking';
import { regimenFingerprint, type InteractionResult } from './interaction-types';
import { interactionCheck, explainInteractions } from './interactions.server';
import { activePrescriptions } from './interaction-types';

export function commandTools(userId: string, signal: AbortSignal, db: SupabaseClient) {
  const load = async () => { signal.throwIfAborted(); const feed = await fetchRecalls(); return { feed, matched: matchPatients(patients, feed.recalls) }; };
  return {
    check_recalls: tool({
      description: 'Read current FDA feed and match all demo patients by NDC. Includes historical records; verify status and lots.',
      inputSchema: z.object({}),
      execute: async () => { const { feed, matched } = await load(); return { source: feed.source, totalPatients: matched.length, recalls: feed.recalls, affected: matched.filter(p => p.isFlagged).map(p => ({ patientId: p.patient.id, name: p.fullName, cases: p.flagged.map(f => ({ recallNumber: f.recall.recallNumber, ndc: f.prescription.ndc, drug: f.prescription.drugName, classification: f.recall.classification })) })) }; },
    }),
    dashboard_overview: tool({
      description: 'Dashboard figures: patient/recall totals, flagged patients, Class I count, new recalls since last sync, polypharmacy and refill-overuse counts.',
      inputSchema: z.object({}),
      execute: async () => {
        const { feed, matched } = await load();
        const stats = getStats(matched, feed.recalls);
        return { source: feed.source, lastSyncedAt: feed.lastSyncedAt, newRecallNumbers: feed.newRecallNumbers, simulatedRecalls: feed.recalls.filter(r => r.recallNumber.startsWith('DEMO-')).length, ...stats,
          polypharmacyPatients: matched.filter(m => activePrescriptions(m.patient).length > 1).length,
          refillOverusePatients: matched.filter(m => patientRefillSummary(m.patient).hasOverutilization).length,
          topRecalls: [...feed.recalls].sort((a, b) => classificationRank(a.classification) - classificationRank(b.classification)).slice(0, 5).map(r => ({ recallNumber: r.recallNumber, drugName: r.drugName, classification: r.classification, affectedPatients: affectedCountByRecall(matched).get(r.recallNumber) ?? 0 })) };
      },
    }),
    find_patients: tool({
      description: 'Search demo patients by name, ID, drug or NDC. Empty query returns all. Use flaggedOnly for affected patients.',
      inputSchema: z.object({ query: z.string(), flaggedOnly: z.boolean() }),
      execute: async ({ query, flaggedOnly }) => { const { matched, feed } = await load(); const q = query.toLowerCase(); return { source: feed.source, patients: matched.filter(p => (!flaggedOnly || p.isFlagged) && JSON.stringify(p).toLowerCase().includes(q)) }; },
    }),
    recall_details: tool({
      description: 'Full record for one recall number, including every demo patient it affects.',
      inputSchema: z.object({ recallNumber: z.string() }),
      execute: async ({ recallNumber }) => {
        const { feed, matched } = await load();
        const recall = feed.recalls.find(r => r.recallNumber.toLowerCase() === recallNumber.trim().toLowerCase());
        if (!recall) throw new Error(`No recall ${recallNumber} in the stored feed.`);
        return { source: feed.source, recall, simulated: recall.recallNumber.startsWith('DEMO-'),
          fdaRecord: recall.recallNumber.startsWith('DEMO-') ? null : `https://api.fda.gov/drug/enforcement.json?search=recall_number:%22${encodeURIComponent(recall.recallNumber)}%22`,
          affected: matched.filter(m => m.flagged.some(f => f.recall.recallNumber === recall.recallNumber)).map(m => ({ patientId: m.patient.id, name: m.fullName })) };
      },
    }),
    refill_tracking: tool({
      description: 'Demo dispensing history for one patient: fill counts, intervals, early pickups and pills above the prescribed quantity.',
      inputSchema: z.object({ patientId: z.string() }),
      execute: async ({ patientId }) => {
        const patient = patients.find(p => p.id.toLowerCase() === patientId.trim().toLowerCase());
        if (!patient) throw new Error(`No patient ${patientId}.`);
        const summary = patientRefillSummary(patient);
        return { patientId: patient.id, name: `${patient.firstName} ${patient.lastName}`, note: 'Simulated dispensing history for demo purposes.', totalFills: summary.totalFills, earlyRefillCount: summary.earlyRefillCount, extraPillsRequested: summary.extraPillsRequested, hasOverutilization: summary.hasOverutilization,
          prescriptions: summary.histories.map(h => ({ drug: `${h.prescription.drugName} ${h.prescription.strength}`, ndc: h.prescription.ndc, fills: h.fillCount, averageIntervalDays: h.averageIntervalDays, expectedIntervalDays: h.expectedIntervalDays, earlyRefills: h.earlyRefillCount, extraPills: h.extraPillsRequested, overutilized: h.isOverutilized })) };
      },
    }),
    check_interactions: tool({
      description: 'Screen one patient’s active medications and allergies against FDA labels and build the interaction graph with explanations. Evidence only; never a safety clearance.',
      inputSchema: z.object({ patientId: z.string() }),
      execute: async ({ patientId }) => {
        signal.throwIfAborted();
        const patient = patients.find(p => p.id.toLowerCase() === patientId.trim().toLowerCase());
        if (!patient) throw new Error(`No patient ${patientId}.`);
        const { data: stored } = await db.from('patient_interaction_checks').select('result').eq('patient_id', patient.id).maybeSingle();
        const old = stored?.result as unknown as InteractionResult | undefined;
        let result = old && old.fingerprint === regimenFingerprint(patient) && Date.now() - Date.parse(old.checkedAt) < 86400000 ? old : await interactionCheck(patient);
        if (!result.summary) result = await explainInteractions(result);
        await db.from('patient_interaction_checks').upsert({ patient_id: patient.id, user_id: userId, fingerprint: result.fingerprint, result: JSON.parse(JSON.stringify(result)), updated_at: new Date().toISOString() });
        return { interaction: result, patientName: `${patient.firstName} ${patient.lastName}`, status: 'Pharmacist review required' };
      },
      toModelOutput: ({ output }) => ({ type: 'json', value: { patient: output.patientName, summary: output.interaction.summary, pairsChecked: output.interaction.pairsChecked, edges: output.interaction.edges.map(e => ({ source: e.source, target: e.target, kind: e.kind, explanation: e.explanation })), gaps: output.interaction.gaps } }),
    }),
    analyse_patient: tool({
      description: 'Run clinical and affordability analysis for one exact recalled prescription. Produces an inline pharmacist review. Never approves alternatives. Run sequentially.',
      inputSchema: z.object({ patientId: z.string(), recallNumber: z.string(), ndc: z.string() }),
      execute: async ({ patientId, recallNumber, ndc }) => {
        signal.throwIfAborted();
        const { matched, feed } = await load();
        const match = matched.find(p => p.patient.id === patientId);
        const flagged = match?.flagged.find(f => f.recall.recallNumber === recallNumber && normalizeNdc(f.prescription.ndc) === normalizeNdc(ndc));
        if (!match || !flagged) throw new Error('No matching recalled prescription.');
        const result = await analyseCase(patientId, recallNumber, ndc, userId, feed.recalls);
        return { match, flagged, result, status: 'Awaiting pharmacist review' };
      },
      toModelOutput: ({ output }) => ({ type: 'json', value: { status: output.status, patient: output.match.fullName, clinical: output.result.clinical, alternatives: output.result.alternatives } }),
    }),
    saved_analyses: tool({
      description: 'List analyses this pharmacy has saved, with review status and any approved discussion option.',
      inputSchema: z.object({}),
      execute: async () => {
        const { data, error } = await db.from('saved_analyses').select('case_key,snapshot,updated_at').order('updated_at', { ascending: false });
        if (error) throw new Error('Saved analyses could not be loaded.');
        return { count: data?.length ?? 0, analyses: (data ?? []).map(row => { const s = row.snapshot as { match?: { fullName?: string }; flagged?: { prescription?: { drugName?: string }; recall?: { recallNumber?: string; classification?: string } }; approvedName?: string; rejected?: boolean };
          return { caseKey: row.case_key, savedAt: row.updated_at, patient: s.match?.fullName, drug: s.flagged?.prescription?.drugName, recallNumber: s.flagged?.recall?.recallNumber, classification: s.flagged?.recall?.classification, status: s.approvedName ? 'Approved for discussion' : s.rejected ? 'Alternatives rejected' : 'Awaiting pharmacist review', approvedName: s.approvedName ?? null }; }) };
      },
    }),
    prepare_outreach: tool({
      description: 'Prepare inline review and call confirmation controls for matching flagged patients. Empty patientIds selects all flagged patients. Set audience to "doctor" to offer prescriber notification (only usable after the patient has been called in this session). Does NOT dial or approve anything.',
      inputSchema: z.object({ patientIds: z.array(z.string()), audience: z.enum(['patient', 'doctor', 'both']) }),
      execute: async ({ patientIds, audience }) => { const { matched, feed } = await load(); return { source: feed.source, audience, destination: process.env['DEMO_CALL_NUMBER'] ?? 'Not configured', cases: matched.filter(p => p.isFlagged && (!patientIds.length || patientIds.includes(p.patient.id))).flatMap(match => match.flagged.map(flagged => ({ match, flagged }))), status: 'Calls require individual confirmation. No calls placed.' }; },
    }),
    call_log: tool({
      description: 'Show the outreach audit log for this session (patient and prescriber calls, reasons, recall details, status). Rendered inline from the pharmacist’s live session.',
      inputSchema: z.object({}),
      execute: async () => ({ view: 'call-log' as const, note: 'The audit log is rendered inline below; it covers calls made in this browser session and also lives on the Outreach page.' }),
    }),
    pharmacy_profile: tool({
      description: 'Read this pharmacy account’s profile and approval status.',
      inputSchema: z.object({}),
      execute: async () => {
        const { data, error } = await db.from('profiles').select('*').eq('id', userId).single();
        if (error) throw new Error('Pharmacy profile could not be loaded.');
        return { profile: data };
      },
    }),
    sync_recalls: tool({
      description: 'Force a refresh of the stored FDA recall feed from openFDA and report any newly added recalls.',
      inputSchema: z.object({}),
      execute: async () => {
        const { syncRecalls } = await import('./recall-sync.server');
        const result = await syncRecalls();
        const { feed, matched } = await load();
        return { source: result.source, newRecallNumbers: result.newRecallNumbers, totalRecalls: feed.recalls.length, flaggedPatients: matched.filter(m => m.isFlagged).length };
      },
    }),
    simulate_recall: tool({
      description: 'Create one fictional DEMO- recall against an unaffected demo prescription, exactly like the "Simulate New Recall" button. Clearly fictional, not an FDA recall.',
      inputSchema: z.object({}),
      execute: async () => {
        const { createSimulatedRecall } = await import('./simulate-recall.server');
        const { recall } = await createSimulatedRecall();
        const { matched } = await load();
        return { simulated: true, recall, newlyFlagged: matched.filter(m => m.flagged.some(f => f.recall.recallNumber === recall.recallNumber)).map(m => ({ patientId: m.patient.id, name: m.fullName })), note: 'Fictional demo recall. Refresh the Recalls, Patients or Dashboard page to see it.' };
      },
    }),
    clear_simulated_recalls: tool({
      description: 'Delete every fictional DEMO- recall so the feed returns to real FDA records only.',
      inputSchema: z.object({}),
      execute: async () => {
        const { removeSimulatedRecalls } = await import('./simulate-recall.server');
        await removeSimulatedRecalls();
        const { feed, matched } = await load();
        return { cleared: true, totalRecalls: feed.recalls.length, flaggedPatients: matched.filter(m => m.isFlagged).length };
      },
    }),
  };
}
