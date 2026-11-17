import { useSyncExternalStore } from "react";

const second = 1000;
const minute = 60 * second;
const hour = 60 * minute;
const day = 24 * hour;
const week = 7 * day;
const year = 365 * day;

export function formatRelativeTime(
  value: number | Date,
  options?: { now?: number; minified?: boolean },
) {
  const delta =
    (options?.now ?? Date.now()) -
    (typeof value === "number" ? value : value.getTime());
  const minified = options?.minified === true;
  const size = Math.abs(delta);
  if (size < 5 * second) return minified ? "now" : "just now";
  const amount =
    size < minute
      ? `${Math.floor(size / second)}s`
      : size < hour
        ? `${Math.floor(size / minute)}m`
        : size < day
          ? `${Math.floor(size / hour)}h`
          : size < week
            ? `${Math.floor(size / day)}d`
            : size < year
              ? `${Math.floor(size / week)}w`
              : `${Math.floor(size / year)}y`;
  if (minified) return amount;
  return delta < 0 ? `in ${amount}` : `${amount} ago`;
}

const listeners = new Set<() => void>();
let currentMinute = Math.floor(Date.now() / minute);
let timer: ReturnType<typeof setInterval> | undefined;

const tick = () => {
  const next = Math.floor(Date.now() / minute);
  if (next === currentMinute) return;
  currentMinute = next;
  for (const listener of listeners) listener();
};

const subscribe = (listener: () => void) => {
  if (listeners.size === 0) {
    currentMinute = Math.floor(Date.now() / minute);
    timer = setInterval(tick, second);
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) clearInterval(timer);
  };
};

const snapshot = () => {
  if (listeners.size === 0) currentMinute = Math.floor(Date.now() / minute);
  return currentMinute;
};

export function useNow() {
  return useSyncExternalStore(subscribe, snapshot, snapshot) * minute;
}
