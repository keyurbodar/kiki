import { useEffect, useState, useSyncExternalStore } from "react";

export type EmojiEntry = { readonly emoji: string; readonly name: string };

export type EmojiGroup = {
  readonly name: string;
  readonly emojis: ReadonlyArray<EmojiEntry>;
};

export type CustomEmoji = {
  readonly name: string;
  readonly aliases: ReadonlyArray<string>;
  readonly url: string;
};

type RawGroup = {
  readonly name: string;
  readonly emojis: ReadonlyArray<ReadonlyArray<string>>;
};

let groupsPromise: Promise<ReadonlyArray<EmojiGroup>> | undefined;

/** Unicode's emoji, by group, loaded once on first use as Capy does. */
export function loadEmojiGroups(): Promise<ReadonlyArray<EmojiGroup>> {
  groupsPromise ??= import("./data-by-group.json").then((module) =>
    (module.default as ReadonlyArray<RawGroup>).map((group) => ({
      name: group.name,
      emojis: group.emojis.map(([emoji = "", name = ""]) => ({ emoji, name })),
    })),
  );
  return groupsPromise;
}

export function useEmojiGroups(enabled: boolean) {
  const [groups, setGroups] = useState<ReadonlyArray<EmojiGroup> | null>(null);
  useEffect(() => {
    if (!enabled || groups !== null) return;
    let live = true;
    loadEmojiGroups().then((loaded) => {
      if (live) setGroups(loaded);
    });
    return () => {
      live = false;
    };
  }, [enabled, groups]);
  return groups;
}

export const groupTitle = (name: string) =>
  name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

export function filterEmojiGroups(
  groups: ReadonlyArray<EmojiGroup>,
  query: string,
  include?: (emoji: string) => boolean,
): ReadonlyArray<EmojiGroup> {
  const needle = query.trim().toLowerCase();
  return groups
    .map((group) => ({
      name: group.name,
      emojis: group.emojis.filter(
        (entry) =>
          (include === undefined || include(entry.emoji)) &&
          (needle === "" || entry.name.includes(needle)),
      ),
    }))
    .filter((group) => group.emojis.length > 0);
}

export function matchCustomEmoji(
  entries: ReadonlyArray<CustomEmoji>,
  query: string,
): ReadonlyArray<CustomEmoji> {
  const needle = query.trim().toLowerCase();
  if (needle === "") return entries;
  return entries.filter((entry) =>
    [entry.name, ...entry.aliases].some((name) =>
      name.toLowerCase().includes(needle),
    ),
  );
}

export const frequentEmojiLimit = 21;

export const FREQUENT_EMOJI_KEY = "capy-web:frequent-emoji";

export const withFrequent = (frequent: ReadonlyArray<string>, emoji: string) =>
  [emoji, ...frequent.filter((entry) => entry !== emoji)].slice(
    0,
    frequentEmojiLimit,
  );

const listeners = new Set<() => void>();
const empty: ReadonlyArray<string> = [];
let cache: { raw: string | null; value: ReadonlyArray<string> } = {
  raw: null,
  value: empty,
};

function readFrequent(): ReadonlyArray<string> {
  let raw: string | null = null;
  try {
    raw = globalThis.localStorage?.getItem(FREQUENT_EMOJI_KEY) ?? null;
  } catch {}
  if (raw === cache.raw) return cache.value;
  let value = empty;
  try {
    const parsed: unknown = raw === null ? [] : JSON.parse(raw);
    value = Array.isArray(parsed)
      ? parsed.filter((entry): entry is string => typeof entry === "string")
      : empty;
  } catch {}
  cache = { raw, value };
  return value;
}

export function setFrequentEmoji(value: ReadonlyArray<string>) {
  try {
    globalThis.localStorage?.setItem(FREQUENT_EMOJI_KEY, JSON.stringify(value));
  } catch {}
  for (const listener of listeners) listener();
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === FREQUENT_EMOJI_KEY) listener();
  };
  globalThis.addEventListener?.("storage", onStorage);
  return () => {
    listeners.delete(listener);
    globalThis.removeEventListener?.("storage", onStorage);
  };
};

/** Capy's recently picked emoji, most recent first, kept in localStorage. */
export function useFrequentEmoji() {
  const frequent = useSyncExternalStore(subscribe, readFrequent, () => empty);
  return {
    frequent,
    remember: (emoji: string) =>
      setFrequentEmoji(withFrequent(readFrequent(), emoji)),
  };
}
