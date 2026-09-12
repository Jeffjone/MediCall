import type { MatchedPatient } from "@/lib/recall-matching";

/** Loads live openFDA recalls (with bundled fallback) and matches them to patients. */
export async function loadMatched(): Promise<{
  matched: MatchedPatient[];
  source: "openfda" | "fallback";
}> {
  const { fetchRecalls } = await import("@/lib/recalls.server");
  const { matchPatients, patients } = await import("@/lib/recall-matching");
  const { recalls, source } = await fetchRecalls();
  return { matched: matchPatients(patients, recalls), source };
}

export function patientSummary(m: MatchedPatient) {
  return {
    id: m.patient.id,
    name: m.fullName,
    dateOfBirth: m.patient.dateOfBirth,
    flagged: m.isFlagged,
    prescriptions: m.patient.prescriptions.map((p) => ({
      drugName: p.drugName,
      strength: p.strength,
      ndc: p.ndc,
      fillDate: p.fillDate,
    })),
    recallHits: m.flagged.map((f) => ({
      drugName: f.prescription.drugName,
      ndc: f.prescription.ndc,
      recallNumber: f.recall.recallNumber,
      classification: f.recall.classification,
      reasonForRecall: f.recall.reasonForRecall,
      recallingFirm: f.recall.recallingFirm,
    })),
  };
}
