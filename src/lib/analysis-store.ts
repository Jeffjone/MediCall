import { useSyncExternalStore } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import type { ReviewState } from './analysis-types';
import type { MatchedPatient, FlaggedPrescription } from './recall-matching';
export type SavedReview = ReviewState & { match?: MatchedPatient; flagged?: FlaggedPrescription; savedAt?: string };
let state: Record<string, SavedReview> = {};
const empty: Record<string, SavedReview> = {};
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());
let generation = 0;
export async function loadReviews() {
  const current = generation;
  const { data, error } = await supabase.from('saved_analyses').select('case_key,snapshot');
  if (error) throw new Error('Saved analyses could not be loaded.');
  if (current !== generation) return;
  const loaded = Object.fromEntries((data ?? []).map(row => [row.case_key, row.snapshot as unknown as SavedReview]));
  state = { ...loaded, ...state }; emit();
}
export function setReview(key: string, value: SavedReview) {
  const snapshot = { ...state[key], ...value, savedAt: new Date().toISOString() };
  if (!value.approval) delete snapshot.approval;
  if (!value.approvedName) delete snapshot.approvedName;
  if (!value.rejected) delete snapshot.rejected;
  state = { ...state, [key]: snapshot }; emit();
  void supabase.from('saved_analyses').upsert({ case_key: key, snapshot: JSON.parse(JSON.stringify(snapshot)) as Json, updated_at: snapshot.savedAt }, { onConflict: 'user_id,case_key' }).then(({ error }) => { if (error) toast.error('Analysis could not be saved. Keep this page open and try again.'); });
}
export function clearReviews() { generation++; state = {}; emit(); }
export function useReviews() { return useSyncExternalStore((l) => { listeners.add(l); return () => { listeners.delete(l); }; }, () => state, () => empty); }
