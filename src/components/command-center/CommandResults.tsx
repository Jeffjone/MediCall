import { useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { InitiateCallButton } from '@/components/InitiateCallButton';
import { CallDoctorButton } from '@/components/CallDoctorButton';
import { InteractionGraph } from '@/components/InteractionGraph';
import { Badge } from '@/components/ui/badge';
import { setReview } from '@/lib/analysis-store';
import { storeInteraction } from '@/lib/interaction-store';
import { useCallStore } from '@/lib/call-store';
import { analysisKey, type AnalysisResult } from '@/lib/analysis-types';
import type { InteractionResult } from '@/lib/interaction-types';
import type { MatchedPatient, FlaggedPrescription } from '@/lib/recall-matching';

type Case = { match: MatchedPatient; flagged: FlaggedPrescription };
type Output = { result?: AnalysisResult; match?: MatchedPatient; flagged?: FlaggedPrescription; cases?: Case[]; destination?: string; source?: string; audience?: 'patient' | 'doctor' | 'both'; interaction?: InteractionResult; patientName?: string; view?: string };

function CallLog() {
  const { log } = useCallStore();
  if (!log.length) return <p className="text-sm text-muted-foreground">No calls have been placed in this session yet. The full log is on the <Link to="/outreach" className="text-primary underline">Outreach page</Link>.</p>;
  return <ul className="space-y-2">
    {log.map(entry => <li key={entry.id} className="border-t py-2 text-sm">
      <div className="flex flex-wrap items-center gap-2"><span className="font-semibold">{entry.patientName}</span><Badge variant={entry.status === 'called' ? 'secondary' : entry.status === 'failed' ? 'destructive' : 'outline'}>{entry.audience === 'doctor' ? 'Prescriber' : 'Patient'} · {entry.status}</Badge></div>
      <p className="text-xs text-muted-foreground">{entry.drugName} · {entry.recallNumber} · {new Date(entry.startedAt).toLocaleString()}</p>
      {entry.reason && <p className="text-xs text-muted-foreground">Reason: {entry.reason}</p>}
    </li>)}
    <li className="pt-1 text-xs text-muted-foreground">Full audit detail is on the <Link to="/outreach" className="text-primary underline">Outreach page</Link>.</li>
  </ul>;
}

export function CommandResults({ output }: { output: unknown }) {
  const value = output as Output;
  useEffect(() => {
    if (value.result && value.match && value.flagged) setReview(analysisKey(value.match.patient.id, value.flagged.recall.recallNumber, value.flagged.prescription.ndc), { result: value.result, match: value.match, flagged: value.flagged });
    if (value.interaction) storeInteraction(value.interaction);
  }, [output]);
  const cases = value.cases ?? (value.match && value.flagged ? [{ match: value.match, flagged: value.flagged }] : []);
  const audience = value.audience ?? 'patient';
  return <div className="space-y-3">
    {value.source && <p className="mt-2 text-xs text-muted-foreground">{value.source === 'openfda' ? 'Source: live openFDA feed (includes historical recalls)' : value.source === 'database' ? 'Source: stored FDA recall history' : 'Source: bundled fallback FDA snapshot'}</p>}
    {value.destination && <p className="text-xs text-muted-foreground">Demo call destination: {value.destination}</p>}
    {value.view === 'call-log' && <CallLog />}
    {value.interaction && <div className="flex flex-wrap items-center gap-3 border-t pt-3"><p className="text-sm font-semibold">{value.patientName}</p><InteractionGraph patientId={value.interaction.patientId} name={value.patientName ?? value.interaction.patientId} /></div>}
    {cases.map(({ match, flagged }) => <div key={`${match.patient.id}-${flagged.recall.recallNumber}`} className="flex flex-wrap items-center justify-between gap-3 border-t py-3">
      <div><p className="text-sm font-semibold">{match.fullName}</p><p className="text-xs text-muted-foreground">{flagged.prescription.drugName} · {flagged.recall.recallNumber}</p></div>
      <div className="flex flex-wrap gap-2">
        {audience !== 'doctor' && <InitiateCallButton match={match} flagged={flagged} />}
        {audience !== 'patient' && <CallDoctorButton match={match} flagged={flagged} />}
      </div>
    </div>)}
  </div>;
}
