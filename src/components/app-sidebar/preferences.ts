import { useCallback, useSyncExternalStore } from "react";
import type { SidebarLayout } from "@/components/sidebar-threads";

export const sidebarLayoutKey = "capy-web:sidebar-layout";
export const pagesAtTopKey = "capy-web:pages-at-top";

export const sidebarLayouts = ["hybrid", "split"] as const;

export const isSidebarLayout = (value: unknown): value is SidebarLayout =>
  typeof value === "string" &&
  (sidebarLayouts as ReadonlyArray<string>).includes(value);

const isBoolean = (value: unknown): value is boolean =>
  typeof value === "boolean";

const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
};

function write(key: string, value: unknown) {
  window.localStorage.setItem(key, JSON.stringify(value));
  for (const listener of listeners) listener();
}

function parse<T>(raw: string | null, isValid: (value: unknown) => value is T) {
  if (raw === null) return null;
  try {
    const stored: unknown = JSON.parse(raw);
    return isValid(stored) ? stored : null;
  } catch {
    return null;
  }
}

const serverSnapshot = () => null;

/** The sidebar's Hybrid/Split choice, written by Settings → General. */
export function useSidebarLayout() {
  const raw = useSyncExternalStore(
    subscribe,
    () => window.localStorage.getItem(sidebarLayoutKey),
    serverSnapshot,
  );
  const layout = parse(raw, isSidebarLayout) ?? "hybrid";
  const setLayout = useCallback(
    (next: SidebarLayout) => write(sidebarLayoutKey, next),
    [],
  );
  return [layout, setLayout] as const;
}

/** Whether the page bar sits above Captains and threads instead of in the footer. */
export function usePagesAtTop() {
  const raw = useSyncExternalStore(
    subscribe,
    () => window.localStorage.getItem(pagesAtTopKey),
    serverSnapshot,
  );
  const pagesAtTop = parse(raw, isBoolean) ?? false;
  const setPagesAtTop = useCallback(
    (next: boolean) => write(pagesAtTopKey, next),
    [],
  );
  return [pagesAtTop, setPagesAtTop] as const;
}
