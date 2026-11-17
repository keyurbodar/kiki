import { useCallback, useState } from "react";
import { defaultPrefs, type PullsPagePrefs } from "./model";

export const prefsKey = "capy-web:pulls-page";

export const readPrefs = (storage: Pick<Storage, "getItem"> | undefined) => {
  try {
    const raw = storage?.getItem(prefsKey);
    if (raw == null) return defaultPrefs;
    const parsed = JSON.parse(raw) as Partial<PullsPagePrefs>;
    return {
      ...defaultPrefs,
      ...parsed,
      filters: { ...defaultPrefs.filters, ...parsed.filters },
    };
  } catch {
    return defaultPrefs;
  }
};

const browserStorage = () =>
  typeof window === "undefined" ? undefined : window.localStorage;

/** Page preferences kept in local storage, like Capy's `capy-web:pulls-page`. */
export function usePullsPagePrefs() {
  const [prefs, setPrefs] = useState(() => readPrefs(browserStorage()));
  const update = useCallback(
    (change: (current: PullsPagePrefs) => PullsPagePrefs) =>
      setPrefs((current) => {
        const next = change(current);
        try {
          browserStorage()?.setItem(prefsKey, JSON.stringify(next));
        } catch {}
        return next;
      }),
    [],
  );
  return [prefs, update] as const;
}
