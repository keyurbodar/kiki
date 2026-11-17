import { useState } from "react";

const none: readonly string[] = [];

export const recentCollapsedStorageKey = "capy-web:drive-recent-collapsed";

export const treeStorageKey = (userId: string, locationKey: string) =>
  `capy-web:drive-tree-v1:${userId}:${locationKey}`;

const sameMembers = (a: readonly string[], b: readonly string[]) => {
  if (a.length !== b.length) return false;
  const set = new Set(b);
  return a.every((item) => set.has(item));
};

export function parseCollapsedPaths(raw: string | null): readonly string[] {
  if (raw === null) return none;
  try {
    const value: unknown = JSON.parse(raw);
    if (
      !Array.isArray(value) ||
      !value.every((item) => typeof item === "string")
    )
      return none;
    return value.length === 0 ? none : [...value].sort();
  } catch {
    return none;
  }
}

export function parseRecentCollapsed(raw: string | null): boolean {
  if (raw === null) return false;
  try {
    return JSON.parse(raw) === true;
  } catch {
    return false;
  }
}

const readStorage = (key: string | undefined) =>
  key === undefined ? null : (globalThis.localStorage?.getItem(key) ?? null);

export type TreeCollapsedState = {
  collapsed: readonly string[];
  onCollapsedChange: (paths: readonly string[]) => void;
};

export function useTreeCollapsed(
  locationKey: string,
  userId: string | undefined,
): TreeCollapsedState {
  const key =
    userId === undefined ? undefined : treeStorageKey(userId, locationKey);
  const [stored, setStored] = useState(() => ({
    key,
    collapsed: parseCollapsedPaths(readStorage(key)),
  }));
  const collapsed =
    stored.key === key
      ? stored.collapsed
      : parseCollapsedPaths(readStorage(key));
  return {
    collapsed,
    onCollapsedChange: (paths) => {
      if (key === undefined) return;
      const next = paths.length === 0 ? none : [...paths].sort();
      if (sameMembers(collapsed, next)) return;
      setStored({ key, collapsed: next });
      globalThis.localStorage?.setItem(key, JSON.stringify(next));
    },
  };
}

export type RecentCollapsedState = {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
};

export function useRecentCollapsed(): RecentCollapsedState {
  const [collapsed, setCollapsed] = useState(() =>
    parseRecentCollapsed(readStorage(recentCollapsedStorageKey)),
  );
  return {
    collapsed,
    onCollapsedChange: (next) => {
      if (next === collapsed) return;
      setCollapsed(next);
      globalThis.localStorage?.setItem(
        recentCollapsedStorageKey,
        JSON.stringify(next),
      );
    },
  };
}
