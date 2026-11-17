export type MatchTier = "exact" | "prefix" | "word" | "substring" | "fuzzy";

export type MatchRange = { start: number; end: number };

export type Match = {
  tier: MatchTier;
  score: number;
  ranges: MatchRange[];
  field?: number;
};

export type Ranked<T> = { item: T; score: number; match: Match | undefined };

const tierScore: Record<MatchTier, number> = {
  exact: 1000,
  prefix: 800,
  word: 600,
  substring: 400,
  fuzzy: 200,
};
const secondaryFieldWeight = 0.5;
const boostScale = 90;
const maxFuzzyRuns = 3;

export const normalizeQuery = (query: string) =>
  query.trim().toLowerCase().replace(/\s+/g, " ");

const isWordChar = (char: string | undefined) =>
  char !== undefined && /[\p{L}\p{N}]/u.test(char);

const isWordStart = (text: string, index: number) => {
  if (index === 0) return true;
  const previous = text[index - 1];
  const current = text[index];
  if (!isWordChar(previous)) return true;
  if (/\p{Lu}/u.test(current) && /\p{Ll}/u.test(previous)) return true;
  return /\p{N}/u.test(current) !== /\p{N}/u.test(previous);
};

const indexesOf = (text: string, needle: string) => {
  const found: number[] = [];
  for (let i = text.indexOf(needle); i !== -1; i = text.indexOf(needle, i + 1))
    found.push(i);
  return found;
};

const closeness = (needle: string, text: string, start: number) =>
  Math.round((needle.length / Math.max(text.length, 1)) * 60) +
  Math.max(0, 20 - Math.min(start, 20));

const matchToken = (
  text: string,
  lower: string,
  token: string,
): Match | undefined => {
  if (lower === token)
    return {
      tier: "exact",
      score: tierScore.exact,
      ranges: [{ start: 0, end: text.length }],
    };
  const hits = indexesOf(lower, token);
  if (hits.length === 0) return undefined;
  const wordHit = hits.find((i) => isWordStart(text, i));
  const tier: MatchTier =
    hits[0] === 0
      ? "prefix"
      : wordHit === undefined
        ? token.length >= 2
          ? "substring"
          : "fuzzy"
        : "word";
  if (tier === "fuzzy") return undefined;
  const start = tier === "word" ? (wordHit as number) : hits[0];
  return {
    tier,
    score: tierScore[tier] + closeness(token, text, start),
    ranges: [{ start, end: start + token.length }],
  };
};

const matchFuzzy = (
  text: string,
  lower: string,
  query: string,
): Match | undefined => {
  if (query.length < 2 || query.includes(" ")) return undefined;
  const runs: MatchRange[] = [];
  let from = 0;
  let q = 0;
  while (q < query.length) {
    let start = -1;
    for (
      let i = lower.indexOf(query[q], from);
      i !== -1;
      i = lower.indexOf(query[q], i + 1)
    )
      if (isWordStart(text, i)) {
        start = i;
        break;
      }
    if (start === -1) return undefined;
    let end = start;
    while (q < query.length && lower[end] === query[q]) {
      end += 1;
      q += 1;
    }
    runs.push({ start, end });
    if (runs.length > maxFuzzyRuns) return undefined;
    from = end;
  }
  if (
    runs.slice(0, -1).some((r) => r.end - r.start < 2) &&
    runs.some((r) => r.end - r.start > 1)
  )
    return undefined;
  return {
    tier: "fuzzy",
    score:
      tierScore.fuzzy +
      Math.max(0, 60 - runs.length * 15) +
      Math.round(closeness(query, text, runs[0].start) / 2),
    ranges: runs,
  };
};

const matchWords = (
  text: string,
  lower: string,
  query: string,
): Match | undefined => {
  const words = query.split(" ").filter((w) => w !== "");
  if (words.length < 2) return undefined;
  const hits = words.flatMap((w) => matchToken(text, lower, w) ?? []);
  if (hits.length < words.length) return undefined;
  const tier = hits.some((h) => h.tier === "substring") ? "substring" : "word";
  return {
    tier,
    score: tierScore[tier] + Math.round(closeness(query, text, 0) / 2),
    ranges: hits.flatMap((h) => h.ranges).sort((a, b) => a.start - b.start),
  };
};

export const matchText = (text: string, query: string): Match | undefined => {
  const normalized = normalizeQuery(query);
  if (normalized === "" || text === "") return undefined;
  const lower = text.toLowerCase();
  if (lower.length !== text.length)
    return lower.includes(normalized) ? matchText(lower, normalized) : undefined;
  return (
    matchToken(text, lower, normalized) ??
    matchWords(text, lower, normalized) ??
    matchFuzzy(text, lower, normalized)
  );
};

const matchAcrossFields = (
  fields: readonly string[],
  query: string,
  primary: number,
): Match | undefined => {
  const words = normalizeQuery(query).split(" ");
  if (words.length < 2) return undefined;
  const hits = words.map(
    (word) =>
      fields.flatMap((field, index) => {
        const m = matchText(field, word);
        return m === undefined || m.tier === "substring" || m.tier === "fuzzy"
          ? []
          : [{ field: index, match: m }];
      })[0],
  );
  if (hits.some((h) => h === undefined)) return undefined;
  const found = hits as { field: number; match: Match }[];
  const field = Math.max(...found.map((h) => h.field));
  return {
    tier: "word",
    score:
      field < primary
        ? tierScore.word
        : Math.round(tierScore.word * secondaryFieldWeight),
    ranges: found.filter((h) => h.field === field).flatMap((h) => h.match.ranges),
    field,
  };
};

export const matchFields = (
  fields: readonly string[],
  query: string,
  primary = 1,
): Match | undefined =>
  fields.reduce<Match | undefined>((best, field, index) => {
    const m = matchText(field, query);
    if (
      m === undefined ||
      (index >= primary && (m.tier === "substring" || m.tier === "fuzzy"))
    )
      return best;
    const score =
      index < primary ? m.score : Math.round(m.score * secondaryFieldWeight);
    return best !== undefined && best.score >= score
      ? best
      : { ...m, score, field: index };
  }, undefined) ?? matchAcrossFields(fields, query, primary);

const boosted = (score: number, boost: number) =>
  score + Math.round(Math.min(Math.max(boost, 0), 1) * boostScale);

export function rankItems<T>(
  items: readonly T[],
  fieldsOf: (item: T) => readonly string[],
  query: string,
  options?: { primary?: number; keep?: boolean; boost?: (item: T) => number },
): Ranked<T>[] {
  return items
    .flatMap((item, index) => {
      const match = matchFields(fieldsOf(item), query, options?.primary);
      return match === undefined && options?.keep !== true
        ? []
        : [
            {
              item,
              match,
              index,
              score: boosted(match?.score ?? 150, options?.boost?.(item) ?? 0),
            },
          ];
    })
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ item, score, match }) => ({ item, score, match }));
}

export function filterItems<T>(
  items: readonly T[],
  fieldsOf: (item: T) => readonly string[],
  query: string,
  primary = 1,
): readonly T[] {
  return normalizeQuery(query) === ""
    ? items
    : rankItems(items, fieldsOf, query, { primary }).map((r) => r.item);
}
