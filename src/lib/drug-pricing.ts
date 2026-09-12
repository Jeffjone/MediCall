import type { ClinicalAnalysis, FinancialProfile } from './analysis-types';
/** Replace this boundary with a verified pricing API. Never treat estimates as quotes. */
export function estimatePrices(candidates: ClinicalAnalysis['alternatives'], financial: FinancialProfile) {
  return candidates.slice(0, 3).map(candidate => {
    const cost = candidate.monthlyCost;
    const monthlyCost = cost !== null && Number.isFinite(cost) && cost >= 0 ? Math.round(cost * 100) / 100 : null;
    const monthlySavings = monthlyCost === null ? null : Math.round((financial.currentMedicationCost - monthlyCost) * 100) / 100;
    return { ...candidate, popularity: 'Not verified', monthlyCost, monthlySavings, annualSavings: monthlySavings === null ? null : Math.round(monthlySavings * 12 * 100) / 100, accessibility: monthlyCost === null ? 'Unknown' : monthlyCost <= financial.availableBalance * 0.1 ? 'Higher' : monthlyCost <= financial.availableBalance * 0.25 ? 'Moderate' : 'Lower' };
  });
}
