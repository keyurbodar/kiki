import { useSyncExternalStore } from "react";

/** Capy's persisted "wrap lines" preference for code blocks. */
export const CODE_WRAP_KEY = "capy-web:code-wrap";

const listeners = new Set<() => void>();

const read = () => {
  try {
    return globalThis.localStorage?.getItem(CODE_WRAP_KEY) === "true";
  } catch {
    return false;
  }
};

export function setCodeWrap(value: boolean) {
  try {
    globalThis.localStorage?.setItem(CODE_WRAP_KEY, JSON.stringify(value));
  } catch {}
  for (const listener of listeners) listener();
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === CODE_WRAP_KEY) listener();
  };
  globalThis.addEventListener?.("storage", onStorage);
  return () => {
    listeners.delete(listener);
    globalThis.removeEventListener?.("storage", onStorage);
  };
};

export function useCodeWrap(): [boolean, (value: boolean) => void] {
  return [useSyncExternalStore(subscribe, read, () => false), setCodeWrap];
}
