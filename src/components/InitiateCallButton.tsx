import { useServerFn } from "@tanstack/react-start";
import { ChevronRight, Loader2, PhoneCall } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AnalysisReview } from "@/components/AnalysisReview";
import { useReviews } from "@/lib/analysis-store";
import { analysisKey } from "@/lib/analysis-types";
import { Button } from "@/components/ui/button";
import { finishCall, startCall, useCallStore } from "@/lib/call-store";
import { placeOutreachCall } from "@/lib/outreach.functions";
import type { FlaggedPrescription, MatchedPatient } from "@/lib/recall-matching";

export function InitiateCallButton({
  match,
  flagged,
  size = "sm",
}: {
  match: MatchedPatient;
  flagged: FlaggedPrescription;
  size?: "sm" | "default";
}) {
  const [open, setOpen] = useState(false);
  const review = useReviews()[analysisKey(match.patient.id, flagged.recall.recallNumber, flagged.prescription.ndc)];
  const { byPatient } = useCallStore();
  const call = useServerFn(placeOutreachCall);
  const status = byPatient[match.patient.id] ?? "idle";
  const dialing = status === "dialing";

  async function confirm() {
    setOpen(false);
    const id = `${match.patient.id}-${Date.now()}`;

    startCall({
      id,
      patientId: match.patient.id,
      patientName: match.fullName,
      drugName: flagged.prescription.drugName,
      recallNumber: flagged.recall.recallNumber,
      startedAt: new Date().toISOString(),
      detail: "Dialing the demo number…",
    });

    try {
    const result = await call({
      data: {
        patientName: match.fullName,
        patientId: match.patient.id,
        drugName: flagged.prescription.drugName,
        strength: flagged.prescription.strength,
        ndc: flagged.prescription.ndc,
        recallNumber: flagged.recall.recallNumber,
        recallReason: flagged.recall.reasonForRecall,
        classification: flagged.recall.classification,
        pharmacyName: "Riverside Pharmacy",
        approval: review?.approval,
      },
    });

    if (result.ok) {
      finishCall(id, match.patient.id, "called", result.message, result.conversationId);
      toast.success("Call placed", { description: result.message });
    } else {
      finishCall(id, match.patient.id, "failed", result.message);
      toast.error("Call could not be placed", { description: result.message });
    }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Call failed.";
      finishCall(id, match.patient.id, "failed", message);
      toast.error(message);
    }
  }

  return (
    <>
      <AnalysisReview match={match} flagged={flagged} />
      <Button
        size={size}
        className="gap-1"
        disabled={dialing}
        onClick={() => setOpen(true)}
      >
        {dialing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <PhoneCall className="h-4 w-4" />
        )}
        {dialing ? "Dialing…" : status === "called" ? "Call again" : "Initiate Call"}
        <ChevronRight className="h-3 w-3" />
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Place an AI outreach call?</AlertDialogTitle>
            <AlertDialogDescription>
              The AI agent will explain the {flagged.recall.classification} recall of{" "}
              {flagged.prescription.drugName} {flagged.prescription.strength} to{" "}
              {match.fullName}. In demo mode the call dials your verified test number,
              not the patient. {review?.approvedName ? `The call will discuss the approved option: ${review.approvedName}.` : "No alternative medication will be recommended."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirm}>Place call</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
