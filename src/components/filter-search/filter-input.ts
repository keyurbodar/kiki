export const filterKeys = [
  "author",
  "captain",
  "repo",
  "status",
  "label",
  "since",
] as const;

export type FilterKey = (typeof filterKeys)[number];

export const filterKeyLabels: Record<FilterKey, string> = {
  author: "Author",
  captain: "Captain",
  repo: "Repository",
  status: "Status",
  label: "Label",
  since: "Since",
};

export type FilterToken = {
  readonly key: FilterKey;
  readonly values: ReadonlyArray<string>;
};

export type FilterTokenSpan = FilterToken & {
  readonly start: number;
  readonly end: number;
};

export type ActiveFilterToken =
  | {
      readonly kind: "key";
      readonly prefix: string;
      readonly start: number;
      readonly end: number;
    }
  | {
      readonly kind: "value";
      readonly key: FilterKey;
      readonly values: ReadonlyArray<string>;
      readonly partial: string;
      readonly start: number;
      readonly end: number;
    };

export type ParsedFilterQuery = {
  readonly tokens: ReadonlyArray<FilterTokenSpan>;
  readonly text: string;
  readonly active: ActiveFilterToken | undefined;
};

const words = (input: string) => {
  const spans: Array<{ raw: string; start: number; end: number }> = [];
  let start = -1;
  let quoted = false;
  for (let index = 0; index <= input.length; index++) {
    const char = input[index];
    if (char === undefined || (!quoted && /\s/.test(char))) {
      if (start !== -1)
        spans.push({ raw: input.slice(start, index), start, end: index });
      start = -1;
    } else {
      if (start === -1) start = index;
      if (char === '"') quoted = !quoted;
    }
  }
  return spans;
};

const splitValues = (input: string) => {
  const values: string[] = [];
  let current = "";
  let quoted = false;
  for (const char of input) {
    if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) {
      values.push(current);
      current = "";
    } else current += char;
  }
  values.push(current);
  return values.map((value) => value.trim());
};

const keyOf = (raw: string) => {
  const colon = raw.indexOf(":");
  if (colon <= 0) return undefined;
  const key = raw.slice(0, colon).toLowerCase();
  return filterKeys.find((candidate) => candidate === key);
};

/** Splits a search query into key:value tokens, free text, and the token under the caret. */
export const parseFilterQuery = (
  input: string,
  caret: number,
): ParsedFilterQuery => {
  const tokens: FilterTokenSpan[] = [];
  const text: string[] = [];
  let active: ActiveFilterToken | undefined;
  for (const word of words(input)) {
    const inWord = caret >= word.start && caret <= word.end;
    const key = keyOf(word.raw);
    if (key === undefined) {
      text.push(word.raw);
      const lower = word.raw.toLowerCase();
      if (
        inWord &&
        caret === word.end &&
        !lower.includes(":") &&
        filterKeys.some((candidate) => candidate.startsWith(lower))
      )
        active = {
          kind: "key",
          prefix: lower,
          start: word.start,
          end: word.end,
        };
      continue;
    }
    const values = splitValues(word.raw.slice(key.length + 1));
    if (inWord) {
      active = {
        kind: "value",
        key,
        values: values.slice(0, -1).filter((value) => value !== ""),
        partial: values.at(-1) ?? "",
        start: word.start,
        end: word.end,
      };
      continue;
    }
    const filled = values.filter((value) => value !== "");
    if (filled.length > 0)
      tokens.push({ key, values: filled, start: word.start, end: word.end });
  }
  return { tokens, text: text.join(" "), active };
};

/** Replaces input[start, end) with an insert and returns the new text and caret. */
export const spliceFilterQuery = (
  input: string,
  start: number,
  end: number,
  insert = "",
) => {
  const before = input.slice(0, start).trimEnd();
  const after = input.slice(end).trimStart();
  const head = [before, insert].filter((part) => part !== "").join(" ");
  const text = [head, after].filter((part) => part !== "").join(" ");
  const spaced = !insert.endsWith(":") && head !== "" && after !== "";
  return { text, caret: head.length + (spaced ? 1 : 0) };
};

const quoteValue = (value: string) =>
  /[\s,"]/.test(value) ? `"${value.replaceAll('"', "")}"` : value;

export const formatFilterToken = (token: FilterToken) =>
  `${token.key}:${token.values.map(quoteValue).join(",")}`;

export const mergeFilterToken = (
  tokens: ReadonlyArray<FilterToken>,
  token: FilterToken,
) =>
  tokens.find((existing) => existing.key === token.key) === undefined
    ? [...tokens, token]
    : tokens.map((existing) =>
        existing.key === token.key
          ? {
              key: token.key,
              values: [...new Set([...existing.values, ...token.values])],
            }
          : existing,
      );

export const removeFilterValue = (
  tokens: ReadonlyArray<FilterToken>,
  key: FilterKey,
  value?: string,
): FilterToken[] =>
  tokens.flatMap((token) => {
    if (token.key !== key) return [token];
    if (value === undefined) return [];
    const values = token.values.filter((existing) => existing !== value);
    return values.length === 0 ? [] : [{ key, values }];
  });

export const filterValues = (
  tokens: ReadonlyArray<FilterToken>,
  key: FilterKey,
) => tokens.find((token) => token.key === key)?.values ?? [];

export const sincePresets = ["today", "week", "month"] as const;

export type SincePreset = (typeof sincePresets)[number];

export const sincePresetLabels: Record<SincePreset, string> = {
  today: "Today",
  week: "Past week",
  month: "Past month",
};

const dayMs = 864e5;

/** Resolves a since: value (today, week, month, 3d, 2w, 1m, 2026-01-31) to its start date. */
export const parseSince = (value: string, now: Date): Date | undefined => {
  if (value === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return start;
  }
  if (value === "week") return new Date(now.getTime() - 7 * dayMs);
  if (value === "month") return new Date(now.getTime() - 30 * dayMs);
  const relative = /^(\d{1,3})([dwm])$/.exec(value);
  if (relative !== null) {
    const unit = relative[2] === "d" ? 1 : relative[2] === "w" ? 7 : 30;
    return new Date(now.getTime() - Number(relative[1]) * unit * dayMs);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

export const sinceLabel = (value: string) =>
  sincePresets.find((preset) => preset === value) === undefined
    ? value
    : sincePresetLabels[value as SincePreset];

export const githubAuthorPrefix = "github:";

export const githubAuthor = (login: string) => githubAuthorPrefix + login;

export const githubLogin = (value: string) =>
  value.startsWith(githubAuthorPrefix)
    ? value.slice(githubAuthorPrefix.length)
    : undefined;

export const keySuggestions = (prefix: string) =>
  filterKeys.filter(
    (key) => prefix !== "" && key.startsWith(prefix.toLowerCase()),
  );
