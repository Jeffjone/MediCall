import { tool } from 'ai';
import { z } from 'zod';
import { readStoredFeed as fetchRecalls } from './recall-sync.server';
import { matchPatients, patients, normalizeNdc } from './recall-matching';
import { analyseCase } from './analysis.server';

export function commandTools(userId: string, signal: AbortSignal) {
  const load = async () => { signal.throwIfAborted(); const feed = await fetchRecalls(); return { feed, matched: matchPatients(patients, feed.recalls) }; };
  return {
    check_recalls: tool({
      description: 'Read current FDA feed and match all demo patients by NDC. Includes historical records; verify status and lots.',
      inputSchema: z.object({}),
      execute: async () => { const { feed, matched } = await load(); return { source: feed.source, totalPatients: matched.length, recalls: feed.recalls, affected: matched.filter(p => p.isFlagged).map(p => ({ patientId: p.patient.id, name: p.fullName, cases: p.flagged.map(f => ({ recallNumber: f.recall.recallNumber, ndc: f.prescription.ndc, drug: f.prescription.drugName, classification: f.recall.classification })) })) }; },
    }),
    find_patients: tool({
      description: 'Search demo patients by name, ID, drug or NDC. Empty query returns all. Use flaggedOnly for affected patients.',
      inputSchema: z.object({ query: z.string(), flaggedOnly: z.boolean() }),
      execute: async ({ query, flaggedOnly }) => { const { matched, feed } = await load(); const q = query.toLowerCase(); return { source: feed.source, patients: matched.filter(p => (!flaggedOnly || p.isFlagged) && JSON.stringify(p).toLowerCase().includes(q)) }; },
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
    prepare_outreach: tool({
      description: 'Prepare inline review and call confirmation for matching flagged patients. Empty patientIds selects all flagged patients. Does NOT dial or approve anything.',
      inputSchema: z.object({ patientIds: z.array(z.string()) }),
      execute: async ({ patientIds }) => { const { matched, feed } = await load(); return { source: feed.source, destination: process.env['DEMO_CALL_NUMBER'] ?? 'Not configured', cases: matched.filter(p => p.isFlagged && (!patientIds.length || patientIds.includes(p.patient.id))).flatMap(match => match.flagged.map(flagged => ({ match, flagged }))), status: 'Calls require individual confirmation. No calls placed.' }; },
    }),
  };
}
