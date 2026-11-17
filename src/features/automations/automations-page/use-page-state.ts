import { useEffect, useState } from "react";
import {
  type AutomationsPageState,
  decodePageState,
  pageStateStorageKey,
} from "./filters";

const read = () => {
  try {
    return decodePageState(
      globalThis.localStorage?.getItem(pageStateStorageKey) ?? null,
    );
  } catch {
    return decodePageState(null);
  }
};

/** Filters, saved views and ordering, persisted like Capy's automations page atom. */
export function useAutomationsPageState() {
  const [state, setState] = useState<AutomationsPageState>(read);
  useEffect(() => {
    try {
      globalThis.localStorage?.setItem(
        pageStateStorageKey,
        JSON.stringify(state),
      );
    } catch {}
  }, [state]);
  return [state, setState] as const;
}
