import { useSyncExternalStore } from "react";

export type CallStatus = "idle" | "dialing" | "called" | "failed";

export type CallRecord = {
  id: string;
  patientId: string;
  patientName: string;
  drugName: string;
  recallNumber: string;
  status: CallStatus;
  startedAt: string;
  detail: string;
  conversationId?: string;
  /** Audit trail details */
  completedAt?: string;
  dialedNumber?: string;
  reason?: string;
  approvedAlternative?: string;
  patient?: {
    dateOfBirth: string;
    phone: string;
    email: string;
    preferredLanguage: string;
  };
  prescription?: {
    strength: string;
    ndc: string;
    prescriber: string;
    fillDate: string;
    quantity: number;
    daysSupply: number;
  };
  recall?: {
    classification: string;
    reasonForRecall: string;
    recallingFirm: string;
    lotNumbers: string;
    recallInitiationDate: string;
    status: string;
    productDescription: string;
  };
};

type State = {
  byPatient: Record<string, CallStatus>;
  log: CallRecord[];
};

let state: State = { byPatient: {}, log: [] };
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

export function startCall(record: Omit<CallRecord, "status">) {
  state = {
    byPatient: { ...state.byPatient, [record.patientId]: "dialing" },
    log: [{ ...record, status: "dialing" }, ...state.log],
  };
  emit();
}

export function finishCall(
  id: string,
  patientId: string,
  status: Exclude<CallStatus, "idle" | "dialing">,
  detail: string,
  conversationId?: string,
  dialedNumber?: string,
) {
  state = {
    byPatient: { ...state.byPatient, [patientId]: status },
    log: state.log.map((entry) =>
      entry.id === id
        ? {
            ...entry,
            status,
            detail,
            completedAt: new Date().toISOString(),
            ...(conversationId ? { conversationId } : {}),
            ...(dialedNumber ? { dialedNumber } : {}),
          }
        : entry,
    ),
  };
  emit();
}

export function useCallStore(): State {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
