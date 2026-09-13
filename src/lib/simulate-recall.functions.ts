import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const simulateRecall = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("approval_status")
      .eq("id", context.userId)
      .single();
    if (profile?.approval_status !== "approved") throw new Error("An approved pharmacy account is required.");
    const { createSimulatedRecall } = await import("./simulate-recall.server");
    return await createSimulatedRecall();
  });

/** Remove every simulated (DEMO-) recall so the feed returns to the real FDA set. */
export const clearSimulatedRecalls = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { removeSimulatedRecalls } = await import("./simulate-recall.server");
    return await removeSimulatedRecalls();
  });
