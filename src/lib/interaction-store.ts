import { useSyncExternalStore } from 'react';
import type { InteractionResult } from './interaction-types';
let state: Record<string,InteractionResult> = {};
const empty: typeof state = {};
const listeners=new Set<()=>void>();
export function storeInteraction(result:InteractionResult) {state={...state,[result.patientId]:result};listeners.forEach(l=>l());}
export function clearInteractions(){state={};listeners.forEach(l=>l());}
export function useInteractions(){return useSyncExternalStore(l=>{listeners.add(l);return()=>{listeners.delete(l);};},()=>state,()=>empty);}