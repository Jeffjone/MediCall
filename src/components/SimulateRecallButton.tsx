import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { FlaskConical, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { simulateRecall } from "@/lib/simulate-recall.functions";

export function SimulateRecallButton() {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function simulate() {
    if (busy) return;
    setBusy(true);
    try {
      const result = await simulateRecall();
      const url = URL.createObjectURL(new Blob([result.json], { type: "application/json" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = result.filename;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      await router.invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not simulate a recall.");
    } finally { setBusy(false); }
  }
  return <Button variant="secondary" className="w-full justify-start gap-2" disabled={busy} onClick={simulate}>
    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
    {busy ? "Creating recall…" : "Simulate New Recall"}
  </Button>;
}