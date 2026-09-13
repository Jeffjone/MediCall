import type { Patient, Prescription } from './recall-matching';
export type InteractionNode = { id: string; label: string; kind: 'medication' | 'allergy' };
export type InteractionEdge = { id: string; source: string; target: string; kind: 'interaction' | 'allergy'; quote: string; url: string; explanation?: string };
export type InteractionResult = { patientId: string; fingerprint: string; checkedAt: string; nodes: InteractionNode[]; edges: InteractionEdge[]; pairsChecked: number; gaps: string[]; summary?: string };
export function activePrescriptions(patient: Patient, now = new Date()) {
 return patient.prescriptions.filter(p => {
  if (p.active !== undefined) return p.active;
  const start = Date.parse(`${p.fillDate}T00:00:00Z`);
  return Number.isFinite(start) && start <= now.getTime() && now.getTime() < start + p.daysSupply * 86400000;
 });
}
export function regimenFingerprint(patient: Patient, now = new Date()) { return JSON.stringify({ version: 1, active: activePrescriptions(patient, now), allergies: patient.allergies ?? null }); }
export function medicationName(p: Prescription) { return p.drugName.replace(/\b(tablets?|capsules?|delayed-release|extended-release|oral|solution|injection|sodium|hydrochloride)\b/gi, '').replace(/\s+/g, ' ').trim(); }
export function uniquePairs<T>(values: T[]): [T,T][] { return values.flatMap((v,i) => values.slice(i+1).map(w => [v,w] as [T,T])); }
