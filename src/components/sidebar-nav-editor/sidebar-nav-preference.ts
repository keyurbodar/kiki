import { useCallback, useMemo, useSyncExternalStore } from "react";
import {
  normalizeSidebarNav,
  type SidebarNavEntry,
  toSidebarNavPreference,
} from "./sidebar-nav";

const SIDEBAR_NAV_KEY = "capy-web:sidebar-nav";

const listeners = new Set<() => void>();

const notify = () => {
  for (const listener of listeners) listener();
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
};

const getSnapshot = () => window.localStorage.getItem(SIDEBAR_NAV_KEY);

const parse = (raw: string | null): SidebarNavEntry[] => {
  if (raw === null) return normalizeSidebarNav(null);
  try {
    const saved: unknown = JSON.parse(raw);
    return normalizeSidebarNav(
      Array.isArray(saved)
        ? (saved as ReadonlyArray<{ item: string; hidden?: boolean }>)
        : null,
    );
  } catch {
    return normalizeSidebarNav(null);
  }
};

export function readSidebarNavPreference(): SidebarNavEntry[] {
  return parse(getSnapshot());
}

export function writeSidebarNavPreference(entries: SidebarNavEntry[]) {
  window.localStorage.setItem(
    SIDEBAR_NAV_KEY,
    JSON.stringify(toSidebarNavPreference(entries)),
  );
  notify();
}

/** The sidebar's page choice, shared by the sidebar and the settings menu. */
export function useSidebarNavPreference(): [
  SidebarNavEntry[],
  (entries: SidebarNavEntry[]) => void,
] {
  const raw = useSyncExternalStore(subscribe, getSnapshot, () => null);
  const entries = useMemo(() => parse(raw), [raw]);
  const save = useCallback((next: SidebarNavEntry[]) => {
    writeSidebarNavPreference(next);
  }, []);
  return [entries, save];
}
