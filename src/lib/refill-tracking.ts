import type { Patient, Prescription } from "@/lib/recall-matching";

export type RefillEvent = {
  /** ISO date (yyyy-mm-dd) the fill was dispensed. */
  date: string;
  /** Quantity actually dispensed. */
  quantity: number;
  /** Days between this fill and the previous one (null for the first fill). */
  intervalDays: number | null;
  /** Days the refill was picked up ahead of schedule (0 when on time or late). */
  daysEarly: number;
  /** Pills dispensed above the prescribed quantity on this fill. */
  extraPills: number;
};

export type PrescriptionRefillHistory = {
  prescription: Prescription;
  events: RefillEvent[];
  /** Fills in the generated 12-month window. */
  fillCount: number;
  /** Average days between fills (null with fewer than two fills). */
  averageIntervalDays: number | null;
  /** Expected days between fills, i.e. the days supply. */
  expectedIntervalDays: number;
  earlyRefillCount: number;
  /** Total pills dispensed beyond the prescribed quantity. */
  extraPillsRequested: number;
  /** Early refills or extra pills suggest the regimen is running hot. */
  isOverutilized: boolean;
};

export type PatientRefillSummary = {
  histories: PrescriptionRefillHistory[];
  totalFills: number;
  earlyRefillCount: number;
  extraPillsRequested: number;
  overutilizedCount: number;
  /** True when any prescription shows early refills or extra pills. */
  hasOverutilization: boolean;
};

/** Deterministic 32-bit hash so demo refill history is stable across renders. */
function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: string) {
  let state = hash(seed) || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / 4294967296;
  };
}

function toIso(date: Date): string {
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

/** Normalize loosely formatted demo dates (e.g. 2026-5-9) to yyyy-mm-dd. */
function normalizeIso(iso: string): string {
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(String(iso ?? "").trim());
  if (!m) return "";
  return `${m[1]}-${m[2]!.padStart(2, "0")}-${m[3]!.padStart(2, "0")}`;
}

function addDays(iso: string, days: number): string {
  const base = normalizeIso(iso);
  if (!base) return "";
  const d = new Date(`${base}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return "";
  d.setUTCDate(d.getUTCDate() + days);
  return toIso(d);
}

function daysBetween(earlier: string, later: string): number {
  const a = new Date(`${normalizeIso(earlier)}T00:00:00Z`).getTime();
  const b = new Date(`${normalizeIso(later)}T00:00:00Z`).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.round((b - a) / 86_400_000);
}


/**
 * Build a deterministic refill history ending on the prescription's most
 * recent fill date. Demo data only — real pharmacies would read dispensing
 * records instead.
 */
export function refillHistory(
  patientId: string,
  prescription: Prescription,
): PrescriptionRefillHistory {
  const random = rng(`${patientId}:${prescription.ndc}:${prescription.fillDate}`);
  const supply = Math.max(prescription.daysSupply, 7);
  const maxFills = Math.max(2, Math.min(8, Math.floor(365 / supply) + 1));
  const fillCount = 2 + Math.floor(random() * (maxFills - 1));
  const latestFill = normalizeIso(prescription.fillDate) || toIso(new Date());

  // Walk backwards from the latest fill, then reverse to chronological order.
  const dates: string[] = [latestFill];

  const earlyBy: number[] = [0];
  for (let i = 1; i < fillCount; i += 1) {
    const early = random() < 0.3 ? 3 + Math.floor(random() * 10) : 0;
    const late = early === 0 && random() < 0.25 ? 1 + Math.floor(random() * 6) : 0;
    const gap = Math.max(5, supply - early + late);
    dates.push(addDays(dates[i - 1]!, -gap));
    earlyBy.push(early);
  }
  dates.reverse();
  earlyBy.reverse();

  const events: RefillEvent[] = dates.map((date, i) => {
    const extra = random() < 0.22 ? [5, 10, 14, 30][Math.floor(random() * 4)]! : 0;
    return {
      date,
      quantity: prescription.quantity + extra,
      intervalDays: i === 0 ? null : daysBetween(dates[i - 1]!, date),
      daysEarly: i === 0 ? 0 : (earlyBy[i] ?? 0),
      extraPills: extra,
    };
  });

  const intervals = events
    .map((e) => e.intervalDays)
    .filter((v): v is number => v !== null);
  const averageIntervalDays = intervals.length
    ? Math.round(intervals.reduce((sum, v) => sum + v, 0) / intervals.length)
    : null;
  const earlyRefillCount = events.filter((e) => e.daysEarly > 0).length;
  const extraPillsRequested = events.reduce((sum, e) => sum + e.extraPills, 0);

  return {
    prescription,
    events,
    fillCount: events.length,
    averageIntervalDays,
    expectedIntervalDays: prescription.daysSupply,
    earlyRefillCount,
    extraPillsRequested,
    isOverutilized: earlyRefillCount > 1 || extraPillsRequested > 0,
  };
}

export function patientRefillSummary(patient: Patient): PatientRefillSummary {
  const histories = patient.prescriptions.map((p) => refillHistory(patient.id, p));
  return {
    histories,
    totalFills: histories.reduce((sum, h) => sum + h.fillCount, 0),
    earlyRefillCount: histories.reduce((sum, h) => sum + h.earlyRefillCount, 0),
    extraPillsRequested: histories.reduce((sum, h) => sum + h.extraPillsRequested, 0),
    overutilizedCount: histories.filter((h) => h.isOverutilized).length,
    hasOverutilization: histories.some((h) => h.isOverutilized),
  };
}
