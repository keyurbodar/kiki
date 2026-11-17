import { useEffect, useState } from "react";
import {
  defaultThreadsPageState,
  type ThreadsPageState,
  threadsPageStorageKey,
} from "./model";

const read = (): ThreadsPageState => {
  try {
    const raw = globalThis.localStorage?.getItem(threadsPageStorageKey);
    if (raw == null) return defaultThreadsPageState;
    const parsed = JSON.parse(raw) as Partial<ThreadsPageState>;
    return {
      ...defaultThreadsPageState,
      ...parsed,
      filters: { ...defaultThreadsPageState.filters, ...parsed.filters },
    };
  } catch {
    return defaultThreadsPageState;
  }
};

/** Page state kept in localStorage under Capy's key, so views and display choices survive reloads. */
export const useStoredPageState = () => {
  const [state, setState] = useState(read);
  useEffect(() => {
    globalThis.localStorage?.setItem(
      threadsPageStorageKey,
      JSON.stringify(state),
    );
  }, [state]);
  return [state, setState] as const;
};
