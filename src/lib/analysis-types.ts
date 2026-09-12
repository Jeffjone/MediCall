import { z } from 'zod';
export const analysisSchema = z.object({
  risk: z.string(),
  urgency: z.string(),
  uncertainties: z.array(z.string()),
  alternatives: z.array(z.object({ name: z.string(), rationale: z.string(), monthlyCost: z.number().nullable(), popularity: z.string() })),
  recommendedIndex: z.number().nullable(),
  actions: z.array(z.string()),
});
export type ClinicalAnalysis = z.infer<typeof analysisSchema>;
export type FinancialProfile = { monthlySpending: number; healthcareSpending: number; availableBalance: number; recurringPrescriptions: number; currentMedicationCost: number; risk: string; source: string };
export type AnalysisResult = {
  clinical: ClinicalAnalysis;
  financial: FinancialProfile;
  identity: { rxcui: string | null; name: string | null; status: string };
  alternatives: { name: string; rationale: string; monthlyCost: number | null; popularity: string; monthlySavings: number | null; annualSavings: number | null; accessibility: string }[];
  receipt: string;
  sources: { title: string; url: string }[];
};
export type ReviewState = { result: AnalysisResult; approval?: string; approvedName?: string; rejected?: boolean };
export function analysisKey(patientId: string, recallNumber: string, ndc: string) { return `${patientId}:${recallNumber}:${ndc}`; }
