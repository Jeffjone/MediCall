import { useEffect } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { toast } from 'sonner';
import { patients } from '@/lib/recall-matching';
import { checkInteractions } from '@/lib/interactions.functions';
import { clearInteractions, storeInteraction } from '@/lib/interaction-store';
export function InteractionMonitor({userId}:{userId:string}) {
 const check=useServerFn(checkInteractions);
 useEffect(()=>{let cancelled=false; const run=async()=>{for(const patient of patients){if(cancelled)return;try{const response=await check({data:{patientId:patient.id,explain:false}});if(cancelled)return;if(response.ok)storeInteraction(response.result);else {toast.error(response.message);break;}}catch{if(!cancelled)toast.error('Interaction checks could not finish.');break;}}};void run();return()=>{cancelled=true;clearInteractions();};},[userId,check]);
 return null;
}