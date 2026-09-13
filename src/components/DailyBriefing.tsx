import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getDailyBriefing } from "@/lib/briefing.functions";
import type { Briefing } from "@/lib/briefing.server";

export function DailyBriefing() {
  const load = useServerFn(getDailyBriefing);
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [loading, setLoading] = useState(true);

  const run = (refresh: boolean) => {
    setLoading(true);
    load({ data: { refresh } })
      .then((r) => setBriefing(r.briefing))
      .catch(() => setBriefing(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let active = true;
    load({ data: { refresh: false } })
      .then((r) => { if (active) setBriefing(r.briefing); })
      .catch(() => { if (active) setBriefing(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading && !briefing) {
    return (
      <Card>
        <CardContent className="space-y-2 py-5">
          <div className="h-4 w-48 animate-pulse rounded bg-muted" />
          <div className="h-3 w-full animate-pulse rounded bg-muted" />
          <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    );
  }

  if (!briefing) return null;

  return (
    <Card className="border-primary/25 bg-primary/5">
      <CardContent className="py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">{briefing.headline}</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => run(true)}
            disabled={loading}
            aria-label="Refresh briefing"
          >
            <RefreshCw className={`mr-2 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <p className="mt-2 text-sm text-muted-foreground">{briefing.body}</p>

        {briefing.priorities.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm">
            {briefing.priorities.map((p, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-primary">{i + 1}.</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-3 text-xs text-muted-foreground">
          AI-generated from current recall matches · {new Date(briefing.generatedAt).toLocaleString()}
        </p>
      </CardContent>
    </Card>
  );
}
