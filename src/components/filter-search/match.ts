export type MatchTier = "exact" | "prefix" | "word" | "substring" | "fuzzy";

export type MatchRange = { readonly start: number; readonly end: number };

export type TextMatch = {
  readonly tier: MatchTier;
  readonly ranges: ReadonlyArray<MatchRange>;
};

const tierRank: Record<MatchTier, number> = {
  exact: 0,
  prefix: 1,
  word: 2,
  substring: 3,
  fuzzy: 4,
};

/** Where a query hits a text: exact, prefix, word start, substring, or a fuzzy subsequence. */
export const matchText = (
  text: string,
  query: string,
): TextMatch | undefined => {
  const haystack = text.toLowerCase();
  const needle = query.trim().toLowerCase();
  if (needle === "") return undefined;
  const whole = [{ start: 0, end: needle.length }];
  if (haystack === needle) return { tier: "exact", ranges: whole };
  if (haystack.startsWith(needle)) return { tier: "prefix", ranges: whole };
  const index = haystack.indexOf(needle);
  if (index !== -1) {
    const ranges = [{ start: index, end: index + needle.length }];
    const wordStart = /[\s/_.:-]/.test(haystack[index - 1] ?? "");
    return { tier: wordStart ? "word" : "substring", ranges };
  }
  const ranges: MatchRange[] = [];
  let from = 0;
  for (const char of needle) {
    const at = haystack.indexOf(char, from);
    if (at === -1) return undefined;
    const last = ranges.at(-1);
    if (last !== undefined && last.end === at)
      ranges[ranges.length - 1] = { start: last.start, end: at + 1 };
    else ranges.push({ start: at, end: at + 1 });
    from = at + 1;
  }
  return { tier: "fuzzy", ranges };
};

/** Splits text into hit and miss segments for highlighting. */
export const splitByRanges = (
  text: string,
  ranges: ReadonlyArray<MatchRange>,
) => {
  const segments: Array<{ text: string; hit: boolean }> = [];
  let cursor = 0;
  for (const range of ranges) {
    if (range.start > cursor)
      segments.push({ text: text.slice(cursor, range.start), hit: false });
    segments.push({ text: text.slice(range.start, range.end), hit: true });
    cursor = range.end;
  }
  if (cursor < text.length)
    segments.push({ text: text.slice(cursor), hit: false });
  return segments;
};

export type Rankable = {
  readonly id: string;
  readonly terms: ReadonlyArray<string>;
};

/** Options not yet selected, best match first; all of them in order when the query is empty. */
export const rankOptions = <Option extends Rankable>(
  options: ReadonlyArray<Option>,
  query: string,
  exclude: ReadonlyArray<string> = [],
) => {
  const open = options.filter((option) => !exclude.includes(option.id));
  if (query.trim() === "")
    return open.map((item) => ({ item, match: undefined }));
  return open
    .flatMap((item, order) => {
      const best = item.terms
        .map((term) => matchText(term, query))
        .filter((found): found is TextMatch => found !== undefined)
        .sort((a, b) => tierRank[a.tier] - tierRank[b.tier])[0];
      return best === undefined ? [] : [{ item, match: best, order }];
    })
    .sort(
      (a, b) =>
        tierRank[a.match.tier] - tierRank[b.match.tier] || a.order - b.order,
    )
    .map(({ item, match }) => ({ item, match }));
};
