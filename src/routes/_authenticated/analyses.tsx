import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { ClipboardList, Search } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { AnalysisReview } from '@/components/AnalysisReview';
import { Badge } from '@/components/ui/badge';
import { useReviews } from '@/lib/analysis-store';
import { useRouteContext } from './route';

export const Route = createFileRoute('/_authenticated/analyses')({
  head: () => ({ meta: [
    { title: 'Saved Analyses — MediCall' },
    { name: 'description', content: 'Review saved patient recall assessments, pharmacy action plans and replacement options.' },
    { property: 'og:title', content: 'Saved Analyses — MediCall' },
    { property: 'og:description', content: 'Patient recall reviews and pharmacist decisions in one place.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
  ] }), component: AnalysesPage,
});
function AnalysesPage() {
  const { session } = useRouteContext();
  const reviews = useReviews();
  const [search, setSearch] = useState('');
  const entries = Object.entries(reviews).filter(([, r]) => r.match && r.flagged).sort(([, a], [, b]) => (b.savedAt ?? '').localeCompare(a.savedAt ?? ''));
  const filtered = entries.filter(([, r]) => `${r.match?.fullName} ${r.flagged?.prescription.drugName} ${r.flagged?.recall.recallNumber}`.toLowerCase().includes(search.toLowerCase()));
  return <AppShell title="Analyses" subtitle="Saved patient recall reviews and pharmacy decisions" session={session}>
    <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4"><p className="text-sm text-muted-foreground">{entries.length} saved review{entries.length === 1 ? '' : 's'}</p><label className="flex w-full items-center gap-2 rounded-md border bg-card px-3 sm:w-80"><Search className="h-4 w-4 text-muted-foreground" /><input aria-label="Search analyses" placeholder="Search patient, medication or recall" className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none" value={search} onChange={e => setSearch(e.target.value)} /></label></div>
    {!filtered.length && <div className="py-16 text-center"><ClipboardList className="mx-auto mb-4 h-9 w-9 text-muted-foreground" /><h2 className="font-semibold">{entries.length ? 'No matching analyses' : 'No saved analyses yet'}</h2></div>}
    <div className="divide-y">{filtered.map(([key, r]) => {
      if (!r.match || !r.flagged) return null;
      return <article key={key} className="flex flex-col justify-between gap-4 py-5 sm:flex-row sm:items-center"><div className="min-w-0 space-y-2"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{r.match.fullName}</h2><Badge variant={r.approval ? 'secondary' : 'outline'}>{r.approval ? 'Approved for discussion' : r.rejected ? 'Alternatives rejected' : 'Awaiting pharmacist review'}</Badge></div><p className="text-sm">{r.flagged.prescription.drugName} · {r.flagged.recall.classification}</p><p className="text-xs text-muted-foreground">{r.flagged.recall.recallNumber} · {r.savedAt ? new Date(r.savedAt).toLocaleString() : 'Current session'}</p>{r.approvedName && <p className="text-sm text-primary">Discussion option: {r.approvedName}</p>}</div><div className="shrink-0"><AnalysisReview match={r.match} flagged={r.flagged} /></div></article>;
    })}</div>
  </AppShell>;
}
