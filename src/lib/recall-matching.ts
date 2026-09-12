import recallsData from "@/data/fda-recalls.json";
import patientsData from "@/data/patients.json";

export type Recall = {
  recallNumber: string;
  productDescription: string;
  drugName: string;
  ndcCodes: string[];
  lotNumbers: string;
  reasonForRecall: string;
  classification: string;
  recallingFirm: string;
  recallInitiationDate: string;
  reportDate: string;
  status: string;
  distributionPattern: string;
  city: string;
  state: string;
};

export type Prescription = {
  drugName: string;
  strength: string;
  ndc: string;
  prescriber: string;
  fillDate: string;
  daysSupply: number;
  quantity: number;
};

export type Patient = {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  preferredLanguage: string;
  prescriptions: Prescription[];
};

export type FlaggedPrescription = {
  prescription: Prescription;
  recall: Recall;
};

export type MatchedPatient = {
  patient: Patient;
  fullName: string;
  flagged: FlaggedPrescription[];
  isFlagged: boolean;
};

export const recalls = recallsData as Recall[];
export const patients = patientsData as Patient[];

/**
 * Normalise an NDC to the 11-digit (5-4-2) form so codes written in the
 * 4-4-2, 5-3-2 or 5-4-1 package formats still compare equal.
 */
export function normalizeNdc(raw: string): string {
  const trimmed = raw.trim();
  const segments = trimmed.split("-");

  if (segments.length === 3) {
    const [labeler = "", product = "", pkg = ""] = segments;
    return (
      labeler.padStart(5, "0") + product.padStart(4, "0") + pkg.padStart(2, "0")
    );
  }

  const digits = trimmed.replace(/\D/g, "");
  return digits.padStart(11, "0");
}

/** Map of normalised recall NDC -> recall record. */
export function buildRecallIndex(source: Recall[] = recalls): Map<string, Recall> {
  const index = new Map<string, Recall>();
  for (const recall of source) {
    for (const ndc of recall.ndcCodes) {
      index.set(normalizeNdc(ndc), recall);
    }
  }
  return index;
}

export function matchPatients(
  patientList: Patient[] = patients,
  recallList: Recall[] = recalls,
): MatchedPatient[] {
  const index = buildRecallIndex(recallList);

  return patientList.map((patient) => {
    const flagged: FlaggedPrescription[] = [];

    for (const prescription of patient.prescriptions) {
      const recall = index.get(normalizeNdc(prescription.ndc));
      if (recall) flagged.push({ prescription, recall });
    }

    return {
      patient,
      fullName: `${patient.firstName} ${patient.lastName}`,
      flagged,
      isFlagged: flagged.length > 0,
    };
  });
}

export type DashboardStats = {
  totalPatients: number;
  totalRecalls: number;
  affectedPatients: number;
  affectedPrescriptions: number;
  classOneRecalls: number;
};

export function getStats(matched: MatchedPatient[]): DashboardStats {
  const affected = matched.filter((m) => m.isFlagged);
  return {
    totalPatients: matched.length,
    totalRecalls: recalls.length,
    affectedPatients: affected.length,
    affectedPrescriptions: affected.reduce((sum, m) => sum + m.flagged.length, 0),
    classOneRecalls: recalls.filter((r) => r.classification === "Class I").length,
  };
}

/** How many patients are affected by each recall. */
export function affectedCountByRecall(matched: MatchedPatient[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const m of matched) {
    for (const f of m.flagged) {
      counts.set(f.recall.recallNumber, (counts.get(f.recall.recallNumber) ?? 0) + 1);
    }
  }
  return counts;
}

export function formatFdaDate(value: string): string {
  if (!/^\d{8}$/.test(value)) return value;
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
}

export function classificationRank(classification: string): number {
  if (classification === "Class I") return 0;
  if (classification === "Class II") return 1;
  return 2;
}
