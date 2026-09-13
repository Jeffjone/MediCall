import { useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { FlaskConical, Loader2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { analysePatient, approveAlternative } from '@/lib/analysis.functions';
import { analysisKey } from '@/lib/analysis-types';
import { setReview, useReviews } from '@/lib/analysis-store';
import type { MatchedPatient, FlaggedPrescription } from '@/lib/recall-matching';
const money = (value: number | null) => value === null ? 'Unknown' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value);
export function AnalysisReview({ match, flagged }: { match: MatchedPatient; flagged: FlaggedPrescription }) {
  const key = analysisKey(match.patient.id, flagged.recall.recallNumber, flagged.prescription.ndc);
  const review = useReviews()[key];
  const analyse = useServerFn(analysePatient); const approve = useServerFn(approveAlternative);
  const [open, setOpen] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function run() {
    setBusy(true); setError('');
    try { const response = await analyse({ data: { patientId: match.patient.id, recallNumber: flagged.recall.recallNumber, ndc: flagged.prescription.ndc } });
      if (response.ok) setReview(key, { result: response.result, match, flagged }); else setError(response.message);
    } catch (e) { setError(e instanceof Error ? e.message : 'Analysis failed.'); } finally { setBusy(false); }
  }
  async function approveIndex(index: number) {
    if (!review) return; setBusy(true); setError('');
    try { const response = await approve({ data: { receipt: review.result.receipt, index } }); setReview(key, { result: review.result, approval: response.approval, approvedName: response.name }); }
    catch (e) { setError(e instanceof Error ? e.message : 'Approval failed.'); } finally { setBusy(false); }
  }
  const result = review?.result;
  return <>
    <Button size="sm" variant="outline" onClick={() => setOpen(true)}><FlaskConical className="h-4 w-4" />{review?.approval ? 'Approved plan' : result ? 'Review analysis' : 'Analyse'}</Button>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl">
      <DialogHeader><DialogTitle>Pharmacy review · {match.fullName}</DialogTitle><DialogDescription>{flagged.prescription.drugName} · {flagged.recall.recallNumber} · Exact NDC match; verify affected lot</DialogDescription></DialogHeader>
      <dl className="grid grid-cols-2 gap-4 rounded-md bg-muted/40 p-4 text-sm sm:grid-cols-3">
        <div><dt className="text-xs text-muted-foreground">Patient / date of birth</dt><dd className="font-medium">{match.fullName}</dd><dd>{match.patient.dateOfBirth}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Medication / NDC</dt><dd className="font-medium">{flagged.prescription.drugName} {flagged.prescription.strength}</dd><dd className="font-mono text-xs">{flagged.prescription.ndc}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Prescriber</dt><dd>{flagged.prescription.prescriber}</dd></div>
      </dl>
      <section className="space-y-2 border-l-4 border-destructive bg-destructive/5 p-4 text-sm"><div className="flex flex-wrap gap-2"><Badge variant="destructive">{flagged.recall.classification}</Badge><Badge variant="outline">{flagged.recall.status}</Badge></div><p className="font-medium">{flagged.recall.reasonForRecall}</p><p className="text-muted-foreground">Affected lots: {flagged.recall.lotNumbers || 'Not specified — confirm with supplier'}</p><p className="text-xs">NDC match indicates potential exposure; verify the dispensed lot before confirming recall involvement.</p></section>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-wrap items-center gap-3"><Button disabled={busy} onClick={run}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}{busy ? 'Working…' : result ? 'Analyse again' : 'Start analysis'}</Button><Badge variant="outline">{review?.approval ? 'Alternative approved' : review?.rejected ? 'Rejected' : result ? 'Awaiting review' : 'Not analysed'}</Badge></div>
      {result && <div className="space-y-6 text-sm">
        <section className="space-y-3 border-t pt-4"><h3 className="font-semibold">Next steps for pharmacy staff</h3><ol className="space-y-2">{result.clinical.actions.map((action, i) => <li key={i} className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{i + 1}</span><span>{action}</span></li>)}</ol><p className="text-xs text-muted-foreground">AI-assisted review. A pharmacist must verify clinical recommendations; medication changes require prescriber authorization.</p></section>
        <section className="space-y-2 border-t pt-4"><h3 className="font-semibold">Clinical assessment</h3><p>{result.clinical.urgency}</p><p>{result.clinical.risk}</p><p className="text-muted-foreground">{result.identity.status}{result.identity.rxcui && ` · RxCUI ${result.identity.rxcui} · ${result.identity.name ?? ''}`}</p><ul className="list-disc space-y-1 pl-5">{result.clinical.uncertainties.map((text, i) => <li key={i}>{text}</li>)}</ul></section>
        <section className="space-y-3 border-t pt-4"><h3 className="font-semibold">Replacement options · prescriber discussion</h3><p className="text-muted-foreground">AI price estimates, not quotes. Savings use a simulated current medication cost of {money(result.financial.currentMedicationCost)}/month. Verify coverage and clinical suitability before discussing a switch.</p>
          {result.alternatives.length === 0 && <p>No supported alternative identified. Contact the prescriber.</p>}
          {result.alternatives.map((a, index) => <div key={index} className="space-y-2 border-b pb-4"><div className="flex flex-wrap items-center justify-between gap-2"><h4 className="font-medium">{a.name}</h4>{result.clinical.recommendedIndex === index && <Badge variant="secondary">Suggested for review</Badge>}</div><p>{a.rationale}</p><div className="grid grid-cols-2 gap-2 sm:grid-cols-4"><p>Estimated cost<br /><strong>{money(a.monthlyCost)}/mo</strong></p><p>Estimated savings<br /><strong>{money(a.monthlySavings)}/mo</strong></p><p>Annual savings<br /><strong>{money(a.annualSavings)}</strong></p><p>Accessibility<br /><strong>{a.accessibility}</strong></p></div><Button size="sm" variant={review?.approvedName === a.name ? 'secondary' : 'outline'} disabled={busy || review?.approvedName === a.name} onClick={() => approveIndex(index)}><Check className="h-4 w-4" />{review?.approvedName === a.name ? 'Approved for discussion' : 'Approve for discussion'}</Button></div>)}
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => setReview(key, { result, rejected: true })}><X className="h-4 w-4" />Reject alternatives</Button>
        </section>
        <section className="space-y-2"><h3 className="font-semibold">Sources</h3>{result.sources.length ? result.sources.map((source, i) => <a key={i} className="block break-words text-primary underline" href={source.url} target="_blank" rel="noreferrer">{source.title}</a>) : <p className="text-muted-foreground">No search citations returned. Independently verify clinical claims.</p>}</section>
      </div>}
    </DialogContent></Dialog>
  </>;
}
