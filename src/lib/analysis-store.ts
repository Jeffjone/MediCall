import { useSyncExternalStore } from 'react';
import type { ReviewState } from './analysis-types';
let state: Record<string, ReviewState> = {};
const empty: Record<string, ReviewState> = {};
const listeners = new Set<() => void>();
export function setReview(key: string, value: ReviewState) { state = { ...state, [key]: value }; listeners.forEach(l => l()); }
export function clearReviews() { state = {}; listeners.forEach(l => l()); }
export function useReviews() { return useSyncExternalStore((l) => { listeners.add(l); return () => { listeners.delete(l); }; }, () => state, () => empty); }
