import { createFileRoute } from "@tanstack/react-router";

/**
 * Scheduled openFDA recall sync. Called twice a day by pg_cron.
 * Requires the shared cron secret so the endpoint cannot be driven externally.
 */
export const Route = createFileRoute("/api/public/hooks/sync-recalls")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env["LOVABLE_CRON_SECRET"];
        const provided =
          request.headers.get("x-cron-secret") ??
          request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
          "";

        if (!expected || provided !== expected) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

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
