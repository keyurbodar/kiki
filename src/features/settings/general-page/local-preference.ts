import { useCallback, useSyncExternalStore } from "react";

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function readPreference<T>(
  key: string,
  fallback: T,
  isValid: (value: unknown) => value is T,
): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed: unknown = JSON.parse(raw);
    return isValid(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function writePreference<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value));
  for (const listener of listeners) listener();
}

export function useLocalPreference<T>(
  key: string,
  fallback: T,
  isValid: (value: unknown) => value is T,
): [T, (value: T) => void] {
  const snapshot = useSyncExternalStore(
    subscribe,
    () => window.localStorage.getItem(key),
    () => null,
  );
  let value = fallback;
  if (snapshot !== null) {
    try {
      const parsed: unknown = JSON.parse(snapshot);
      if (isValid(parsed)) value = parsed;
    } catch {}
  }
  const set = useCallback((next: T) => writePreference(key, next), [key]);
  return [value, set];
}

export const oneOf =
  <const T extends string>(values: readonly T[]) =>
  (value: unknown): value is T =>
    typeof value === "string" && (values as readonly string[]).includes(value);

export const isBoolean = (value: unknown): value is boolean =>
  typeof value === "boolean";
