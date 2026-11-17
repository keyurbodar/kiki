import { useState } from "react";

export type FilesFilter = "all" | "thread";

export type FilesTabState = {
  open: readonly string[];
  folders: Readonly<Record<string, readonly string[]>>;
  filter?: FilesFilter;
  threadClosed?: readonly string[];
};

export type FilesBrowserState = {
  isOpen: (key: string) => boolean;
  foldersOf: (key: string) => readonly string[];
  setOpen: (key: string, open: boolean) => void;
  setFolders: (key: string, folders: readonly string[]) => void;
  filter: FilesFilter | undefined;
  setFilter: (filter: FilesFilter) => void;
  showAll: (key?: string) => void;
  reveal: (key: string, folders: readonly string[]) => void;
  isThreadOpen: (key: string) => boolean;
  setThreadOpen: (key: string, open: boolean) => void;
};

const none: readonly string[] = [];

export const emptyFilesTabState: FilesTabState = { open: [], folders: {} };

export const filesTabStorageKey = (userId: string, rootJamId: string) =>
  `capy-web:files-tab-v1:${userId}:${rootJamId}`;

const sameMembers = (a: readonly string[], b: readonly string[]) => {
  if (a.length !== b.length) return false;
  const set = new Set(b);
  return a.every((item) => set.has(item));
};

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

export function parseFilesTabState(raw: string | null): FilesTabState {
  if (raw === null) return emptyFilesTabState;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null) return emptyFilesTabState;
    const { open, folders, filter, threadClosed } = value as Record<
      string,
      unknown
    >;
    if (!isStringArray(open)) return emptyFilesTabState;
    if (typeof folders !== "object" || folders === null)
      return emptyFilesTabState;
    const entries = Object.entries(folders);
    if (!entries.every(([, list]) => isStringArray(list)))
      return emptyFilesTabState;
    return {
      open,
      folders: Object.fromEntries(entries) as Record<string, string[]>,
      ...(filter === "all" || filter === "thread" ? { filter } : {}),
      ...(isStringArray(threadClosed) ? { threadClosed } : {}),
    };
  } catch {
    return emptyFilesTabState;
  }
}

export const filesTabTransitions = {
  setOpen(state: FilesTabState, key: string, open: boolean): FilesTabState {
    if (state.open.includes(key) === open) return state;
    return {
      ...state,
      open: open
        ? [...state.open, key]
        : state.open.filter((item) => item !== key),
    };
  },
  setFolders(
    state: FilesTabState,
    key: string,
    folders: readonly string[],
  ): FilesTabState {
    if (sameMembers(state.folders[key] ?? none, folders)) return state;
    return {
      ...state,
      folders: { ...state.folders, [key]: [...folders].sort() },
    };
  },
  setFilter(state: FilesTabState, filter: FilesFilter): FilesTabState {
    return state.filter === filter ? state : { ...state, filter };
  },
  showAll(state: FilesTabState, key?: string): FilesTabState {
    return {
      ...state,
      filter: "all",
      open:
        key === undefined || state.open.includes(key)
          ? state.open
          : [...state.open, key],
    };
  },
  reveal(
    state: FilesTabState,
    key: string,
    folders: readonly string[],
  ): FilesTabState {
    const current = state.folders[key] ?? none;
    if (
      state.filter === "all" &&
      state.open.includes(key) &&
      folders.every((folder) => current.includes(folder))
    )
      return state;
    return {
      ...state,
      filter: "all",
      open: state.open.includes(key) ? state.open : [...state.open, key],
      folders: {
        ...state.folders,
        [key]: [...new Set([...current, ...folders])].sort(),
      },
    };
  },
  setThreadOpen(
    state: FilesTabState,
    key: string,
    open: boolean,
  ): FilesTabState {
    const closed = state.threadClosed ?? none;
    if (closed.includes(key) !== open) return state;
    return {
      ...state,
      threadClosed: open
        ? closed.filter((item) => item !== key)
        : [...closed, key],
    };
  },
};

const readStored = (storageKey: string | undefined) =>
  storageKey === undefined
    ? emptyFilesTabState
    : parseFilesTabState(globalThis.localStorage?.getItem(storageKey) ?? null);

export function useFilesBrowserState(
  rootJamId: string,
  userId?: string,
): FilesBrowserState {
  const storageKey =
    userId === undefined ? undefined : filesTabStorageKey(userId, rootJamId);
  const [stored, setStored] = useState(() => ({
    key: storageKey,
    state: readStored(storageKey),
  }));
  const state =
    stored.key === storageKey ? stored.state : readStored(storageKey);

  const update = (next: FilesTabState) => {
    if (next === state) return;
    setStored({ key: storageKey, state: next });
    if (storageKey !== undefined)
      globalThis.localStorage?.setItem(storageKey, JSON.stringify(next));
  };
  const closed = state.threadClosed ?? none;

  return {
    isOpen: (key) => state.open.includes(key),
    foldersOf: (key) => state.folders[key] ?? none,
    setOpen: (key, open) =>
      update(filesTabTransitions.setOpen(state, key, open)),
    setFolders: (key, folders) =>
      update(filesTabTransitions.setFolders(state, key, folders)),
    filter: state.filter,
    setFilter: (filter) => update(filesTabTransitions.setFilter(state, filter)),
    showAll: (key) => update(filesTabTransitions.showAll(state, key)),
    reveal: (key, folders) =>
      update(filesTabTransitions.reveal(state, key, folders)),
    isThreadOpen: (key) => !closed.includes(key),
    setThreadOpen: (key, open) =>
      update(filesTabTransitions.setThreadOpen(state, key, open)),
  };
}
