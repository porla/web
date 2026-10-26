import { useSyncExternalStore } from "react";

export type Toast = { id: number; message: string };

const TOAST_MS = 6000;

let toasts: Toast[] = [];
let nextId = 0;

const listeners = new Set<() => void>();
const timers = new Map<number, number>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function dismissToast(id: number) {
  clearTimeout(timers.get(id));
  timers.delete(id);
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

// Shows a message for a few seconds. A message that is already showing isn't
// added again, its timer restarts instead: polling queries fail every interval.
export function toast(message: string) {
  let t = toasts.find((t) => t.message === message);

  if (!t) {
    t = { id: ++nextId, message };
    toasts = [...toasts, t];
    emit();
  }

  const id = t.id;
  clearTimeout(timers.get(id));
  timers.set(
    id,
    window.setTimeout(() => dismissToast(id), TOAST_MS),
  );
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useToasts() {
  return useSyncExternalStore(subscribe, () => toasts);
}
