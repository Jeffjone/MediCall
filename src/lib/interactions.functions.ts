import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { patients } from './recall-matching';
import { regimenFingerprint, type InteractionResult } from './interaction-types';
import { interactionCheck, explainInteractions } from './interactions.server';
import { gatewayMessage } from './analysis.server';
import type { Json } from '@/integrations/supabase/types';

export const checkInteractions = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
 .inputValidator((data: unknown) => z.object({ patientId: z.string(), explain: z.boolean().default(false) }).parse(data))
 .handler(async ({data,context}) => {
  const {data:profile}=await context.supabase.from('profiles').select('approval_status').eq('id',context.userId).single();
  if(profile?.approval_status!=='approved') throw new Error('An approved pharmacy account is required.');
  const patient=patients.find(p=>p.id===data.patientId); if(!patient) throw new Error('Patient not found.');
  try {
   const {data:stored,error:readError}=await context.supabase.from('patient_interaction_checks').select('result').eq('patient_id',patient.id).maybeSingle();
   if(readError) throw new Error('Interaction history could not be loaded.');
   const old=stored?.result as unknown as InteractionResult | undefined;
   let result=old && old.fingerprint===regimenFingerprint(patient) && Date.now()-Date.parse(old.checkedAt)<86400000 ? old : await interactionCheck(patient);
   if(data.explain && !result.summary) result=await explainInteractions(result);
   const {error}=await context.supabase.from('patient_interaction_checks').upsert({patient_id:patient.id,user_id:context.userId,fingerprint:result.fingerprint,result:JSON.parse(JSON.stringify(result)) as Json,updated_at:new Date().toISOString()});
   if(error) throw new Error('Interaction graph could not be saved.');
   return {ok:true as const,result};
  } catch(error) { return {ok:false as const,message:gatewayMessage(error)}; }
 });