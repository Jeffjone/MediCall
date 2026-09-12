import { useEffect } from 'react';
import { InitiateCallButton } from '@/components/InitiateCallButton';
import { setReview } from '@/lib/analysis-store';
import { analysisKey, type AnalysisResult } from '@/lib/analysis-types';
import type { MatchedPatient, FlaggedPrescription } from '@/lib/recall-matching';

type Case = { match: MatchedPatient; flagged: FlaggedPrescription };
export function CommandResults({ output }: { output: unknown }) {
  const value = output as { result?: AnalysisResult; match?: MatchedPatient; flagged?: FlaggedPrescription; cases?: Case[]; destination?: string; source?: string };
  useEffect(() => {
    if (value.result && value.match && value.flagged) setReview(analysisKey(value.match.patient.id, value.flagged.recall.recallNumber, value.flagged.prescription.ndc), { result: value.result });
  }, [output]);
  const cases = value.cases ?? (value.match && value.flagged ? [{ match: value.match, flagged: value.flagged }] : []);
  return <div className="space-y-3">
    {value.source && <p className="mt-2 text-xs text-muted-foreground">{value.source === "openfda" ? "Source: live openFDA feed (includes historical recalls)" : "Source: bundled fallback FDA snapshot"}</p>}
    {value.destination && <p className="text-xs text-muted-foreground">Demo call destination: {value.destination}</p>}
    {cases.map(({ match, flagged }) => <div key={`${match.patient.id}-${flagged.recall.recallNumber}`} className="flex flex-wrap items-center justify-between gap-3 border-t py-3">
      <div><p className="text-sm font-semibold">{match.fullName}</p><p className="text-xs text-muted-foreground">{flagged.prescription.drugName} · {flagged.recall.recallNumber}</p></div>
      <div className="flex flex-wrap gap-2"><InitiateCallButton match={match} flagged={flagged} /></div>
    </div>)}
  </div>;
}
