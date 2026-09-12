import type { FinancialProfile } from './analysis-types';
/** Replace this provider with consented Nessie account aggregation when connected.
 * These summary fields are app-owned, not a claim to mirror Nessie's raw API schema.
 */
export function getFinancialProfile(patientId: string): FinancialProfile {
  const seed = [...patientId].reduce((sum, c) => sum + c.charCodeAt(0), 0);
  const availableBalance = 350 + (seed % 10) * 85;
  const recurringPrescriptions = 180 + (seed % 8) * 35;
  return { monthlySpending: 2200 + (seed % 12) * 110, healthcareSpending: 320 + (seed % 8) * 30, availableBalance, recurringPrescriptions, currentMedicationCost: 95 + (seed % 6) * 25, risk: recurringPrescriptions / availableBalance > 0.35 ? 'High' : 'Moderate', source: 'Simulated financial profile — not a connected bank account' };
}
