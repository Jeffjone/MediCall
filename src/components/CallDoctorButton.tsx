import { useServerFn } from "@tanstack/react-start";
import { Loader2, Stethoscope } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { finishCall, startCall, useCallStore } from "@/lib/call-store";
import { placeDoctorCall } from "@/lib/outreach.functions";
import type { FlaggedPrescription, MatchedPatient } from "@/lib/recall-matching";

export function CallDoctorButton({
  match,
  flagged,
  size = "sm",
}: {
  match: MatchedPatient;
  flagged: FlaggedPrescription;
  size?: "sm" | "default";
}) {
  const [open, setOpen] = useState(false);
  const { byDoctor } = useCallStore();
  const call = useServerFn(placeDoctorCall);
  const status = byDoctor[match.patient.id] ?? "idle";
  const dialing = status === "dialing";
  const doctorName = flagged.prescription.prescriber || "the prescriber";

  async function confirm() {
    setOpen(false);
    const id = `${match.patient.id}-doctor-${Date.now()}`;

    startCall({
      id,
      audience: "doctor",
      doctorName,
      patientId: match.patient.id,
      patientName: match.fullName,
      drugName: flagged.prescription.drugName,
      recallNumber: flagged.recall.recallNumber,
      startedAt: new Date().toISOString(),
      detail: "Dialing the demo number…",
      reason: `Prescriber notification to Dr. ${doctorName} — ${flagged.recall.classification} recall of ${flagged.prescription.drugName} ${flagged.prescription.strength} (NDC ${flagged.prescription.ndc}); patient already contacted.`,
      patient: {
        dateOfBirth: match.patient.dateOfBirth,
        phone: match.patient.phone,
        email: match.patient.email,
        preferredLanguage: match.patient.preferredLanguage,
      },
      prescription: {
        strength: flagged.prescription.strength,
        ndc: flagged.prescription.ndc,
        prescriber: flagged.prescription.prescriber,
        fillDate: flagged.prescription.fillDate,
        quantity: flagged.prescription.quantity,
        daysSupply: flagged.prescription.daysSupply,
      },
      recall: {
        classification: flagged.recall.classification,
        reasonForRecall: flagged.recall.reasonForRecall,
        recallingFirm: flagged.recall.recallingFirm,
        lotNumbers: flagged.recall.lotNumbers,
        recallInitiationDate: flagged.recall.recallInitiationDate,
        status: flagged.recall.status,
        productDescription: flagged.recall.productDescription,
      },
    });

    try {
      const result = await call({
        data: {
          patientId: match.patient.id,
          recallNumber: flagged.recall.recallNumber,
          ndc: flagged.prescription.ndc,
        },
      });
      if (result.ok) {
        finishCall(id, match.patient.id, "called", result.message, result.conversationId, result.dialed);
        toast.success("Prescriber call placed", { description: result.message });
      } else {
        finishCall(id, match.patient.id, "failed", result.message);
        toast.error("Prescriber call could not be placed", { description: result.message });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Call failed.";
      finishCall(id, match.patient.id, "failed", message);
      toast.error(message);
    }
  }

  return (
    <>
      <Button
        size={size}
        variant="secondary"
        className="gap-1 whitespace-nowrap"
        disabled={dialing}
        onClick={() => setOpen(true)}
      >
        {dialing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Stethoscope className="h-4 w-4" />
        )}
        {dialing ? "Dialing…" : status === "called" ? "Call doctor again" : "Call doctor"}
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Notify the prescriber?</AlertDialogTitle>
            <AlertDialogDescription>
              The AI agent will inform Dr. {doctorName} about the{" "}
              {flagged.recall.classification} recall of {flagged.prescription.drugName}{" "}
              {flagged.prescription.strength} affecting {match.fullName}, and confirm that
              the patient has already been contacted. In demo mode this dials the same
              verified test number as patient calls.
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
