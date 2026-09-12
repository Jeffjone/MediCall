import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { analyseCase, gatewayMessage, readReceipt, signReceipt } from './analysis.server';
export const analysePatient = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ patientId: z.string(), recallNumber: z.string(), ndc: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: profile } = await context.supabase.from('profiles').select('approval_status').eq('id', context.userId).single();
    if (profile?.approval_status !== 'approved') return { ok: false as const, message: 'An approved pharmacy account is required.' };
    try { return { ok: true as const, result: await analyseCase(data.patientId, data.recallNumber, data.ndc, context.userId) }; }
    catch (error) { return { ok: false as const, message: gatewayMessage(error) }; }
  });
export const approveAlternative = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ receipt: z.string(), index: z.number().int().min(0).max(2) }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: profile } = await context.supabase.from('profiles').select('approval_status').eq('id', context.userId).single();
    if (profile?.approval_status !== 'approved') throw new Error('An approved pharmacy account is required.');
    const receipt = readReceipt(data.receipt, context.userId);
    const alternative = receipt.alternatives[data.index];
    if (!alternative) throw new Error('Select an available alternative.');
    const script = `After confirming identity, explain the recall facts. The pharmacy has reviewed ${alternative.name} as an option to discuss with the prescriber, NOT an instruction to switch. Estimated monthly cash cost: ${alternative.monthlyCost === null ? 'unknown' : '$' + alternative.monthlyCost}. Estimated monthly savings against a simulated current cost: ${alternative.monthlySavings === null ? 'unknown' : '$' + alternative.monthlySavings}. State that prices and savings are estimates, subject to insurance and pharmacy verification. Never promise suitability, prescribe a dose, or direct medication changes. Ask the patient to contact the pharmacy or prescriber to confirm next steps. Supporting review: ${alternative.rationale}`;
    return { approval: signReceipt({ ...receipt, approvedName: alternative.name, script }), name: alternative.name, script };
  });
