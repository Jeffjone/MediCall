import { createFileRoute } from "@tanstack/react-router";

import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

/**
 * Scheduled openFDA recall sync. Called twice a day by pg_cron.
 * Requires the platform cron secret so the endpoint cannot be driven externally.
 */
export const Route = createFileRoute("/api/public/hooks/sync-recalls")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = await authenticateCronRequest(request);
        if (denied) return denied;

        try {
          const { syncRecalls } = await import("@/lib/recall-sync.server");
          const { newRecallNumbers, source } = await syncRecalls();
          return Response.json({
            ok: true,
            source,
            newRecalls: newRecallNumbers.length,
            recallNumbers: newRecallNumbers,
            syncedAt: new Date().toISOString(),
          });
        } catch (error) {
          return new Response(
            JSON.stringify({ ok: false, error: (error as Error).message }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
