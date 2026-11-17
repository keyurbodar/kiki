export const normalizeQuery = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, " ");

type Tier = "exact" | "prefix" | "word" | "substring";

const tierScore: Record<Tier, number> = {
  exact: 4,
  prefix: 3,
  word: 2,
  substring: 1,
};

const isWordChar = (char: string | undefined) =>
  char !== undefined && /[\p{L}\p{N}]/u.test(char);

const startsWord = (text: string, at: number) => {
  if (at === 0) return true;
  const before = text[at - 1];
  const here = text[at] ?? "";
  if (!isWordChar(before)) return true;
  if (/\p{Lu}/u.test(here) && /\p{Ll}/u.test(before ?? "")) return true;
  return /\p{N}/u.test(here) !== /\p{N}/u.test(before ?? "");
};

const matchTerm = (term: string, query: string): Tier | undefined => {
  const text = normalizeQuery(term);
  if (text === query) return "exact";
  const hits: number[] = [];
  for (
    let at = text.indexOf(query);
    at !== -1;
    at = text.indexOf(query, at + 1)
  )
    hits.push(at);
  if (hits.length === 0) return undefined;
  if (hits[0] === 0) return "prefix";
  if (hits.some((at) => startsWord(term, at))) return "word";
  return query.length >= 2 ? "substring" : undefined;
};

/**
 * Filters picker options by a typed query, best match first, keeping the
 * original order on ties and returning every option for an empty query.
 * Single letters only match at a word start; there is no fuzzy tier.
 */
export const searchIssueOptions = <T>(
  items: ReadonlyArray<T>,
  terms: (item: T) => ReadonlyArray<string>,
  query: string,
): ReadonlyArray<T> => {
  const needle = normalizeQuery(query);
  if (needle === "") return items;
  return items
    .flatMap((item, index) => {
      const best = Math.max(
        0,
        ...terms(item).map((term) => {
          const tier = matchTerm(term, needle);
          return tier === undefined ? 0 : tierScore[tier];
        }),
      );
      return best === 0 ? [] : [{ item, index, best }];
    })
    .sort((a, b) => b.best - a.best || a.index - b.index)
    .map(({ item }) => item);
};
