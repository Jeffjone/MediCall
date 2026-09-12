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
) {
  state = {
    byPatient: { ...state.byPatient, [patientId]: status },
    log: state.log.map((entry) =>
      entry.id === id
        ? { ...entry, status, detail, ...(conversationId ? { conversationId } : {}) }
        : entry,
    ),
  };
  emit();
}

export function useCallStore(): State {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
