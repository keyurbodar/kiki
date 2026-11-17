type Tier = "exact" | "prefix" | "word" | "substring" | "fuzzy";

type Match = { readonly tier: Tier; readonly score: number };

type FieldMatch = Match & { readonly field: number };

type Run = { readonly start: number; readonly end: number };

const tierScore: Record<Tier, number> = {
  exact: 1000,
  prefix: 800,
  word: 600,
  substring: 400,
  fuzzy: 200,
};

const secondaryWeight = 0.5;

const maxFuzzyRuns = 3;

const normalize = (query: string) =>
  query.trim().toLowerCase().replace(/\s+/g, " ");

const isWordChar = (char: string | undefined) =>
  char !== undefined && /[\p{L}\p{N}]/u.test(char);

const isWordStart = (text: string, at: number) => {
  if (at === 0) return true;
  const prev = text[at - 1];
  const char = text[at] ?? "";
  if (!isWordChar(prev) || (/\p{Lu}/u.test(char) && /\p{Ll}/u.test(prev ?? "")))
    return true;
  return /\p{N}/u.test(char) !== /\p{N}/u.test(prev ?? "");
};

const occurrences = (haystack: string, needle: string) => {
  const found: number[] = [];
  for (
    let at = haystack.indexOf(needle);
    at !== -1;
    at = haystack.indexOf(needle, at + 1)
  )
    found.push(at);
  return found;
};

const closeness = (query: string, text: string, at: number) =>
  Math.round((query.length / Math.max(text.length, 1)) * 60) +
  Math.max(0, 20 - Math.min(at, 20));

const matchContiguous = (
  text: string,
  lower: string,
  query: string,
): Match | undefined => {
  if (lower === query) return { tier: "exact", score: tierScore.exact };
  const hits = occurrences(lower, query);
  const first = hits[0];
  if (first === undefined) return undefined;
  const wordHit = hits.find((at) => isWordStart(text, at));
  const tier: Tier =
    first === 0
      ? "prefix"
      : wordHit !== undefined
        ? "word"
        : query.length >= 2
          ? "substring"
          : "fuzzy";
  if (tier === "fuzzy") return undefined;
  const at = tier === "word" && wordHit !== undefined ? wordHit : first;
  return { tier, score: tierScore[tier] + closeness(query, text, at) };
};

const matchWords = (
  text: string,
  lower: string,
  query: string,
): Match | undefined => {
  const words = query.split(" ").filter((word) => word !== "");
  if (words.length < 2) return undefined;
  const hits = words.flatMap(
    (word) => matchContiguous(text, lower, word) ?? [],
  );
  if (hits.length < words.length) return undefined;
  const tier = hits.some((hit) => hit.tier === "substring")
    ? "substring"
    : "word";
  return {
    tier,
    score: tierScore[tier] + Math.round(closeness(query, text, 0) / 2),
  };
};

const matchFuzzy = (
  text: string,
  lower: string,
  query: string,
): Match | undefined => {
  if (query.length < 2 || query.includes(" ")) return undefined;
  const runs: Run[] = [];
  let from = 0;
  let next = 0;
  while (next < query.length) {
    const char = query[next] ?? "";
    let start = -1;
    for (
      let at = lower.indexOf(char, from);
      at !== -1;
      at = lower.indexOf(char, at + 1)
    )
      if (isWordStart(text, at)) {
        start = at;
        break;
      }
    if (start === -1) return undefined;
    let end = start;
    while (next < query.length && lower[end] === query[next]) {
      end += 1;
      next += 1;
    }
    runs.push({ start, end });
    if (runs.length > maxFuzzyRuns) return undefined;
    from = end;
  }
  const length = (run: Run) => run.end - run.start;
  if (
    runs.slice(0, -1).some((run) => length(run) < 2) &&
    runs.some((run) => length(run) > 1)
  )
    return undefined;
  return {
    tier: "fuzzy",
    score:
      tierScore.fuzzy +
      Math.max(0, 60 - runs.length * 15) +
      Math.round(closeness(query, text, runs[0]?.start ?? 0) / 2),
  };
};

const matchText = (text: string, rawQuery: string): Match | undefined => {
  const query = normalize(rawQuery);
  if (query === "" || text === "") return undefined;
  const lower = text.toLowerCase();
  if (lower.length !== text.length)
    return lower.includes(query) ? matchText(lower, query) : undefined;
  return (
    matchContiguous(text, lower, query) ??
    matchWords(text, lower, query) ??
    matchFuzzy(text, lower, query)
  );
};

const isLoose = (match: Match) =>
  match.tier === "substring" || match.tier === "fuzzy";

const matchAcrossFields = (
  fields: ReadonlyArray<string>,
  query: string,
  primary: number,
): FieldMatch | undefined => {
  const words = normalize(query).split(" ");
  if (words.length < 2) return undefined;
  const hits = words.map((word) =>
    fields.findIndex((field) => {
      const match = matchText(field, word);
      return match !== undefined && !isLoose(match);
    }),
  );
  if (hits.some((field) => field === -1)) return undefined;
  const field = Math.max(...hits);
  return {
    tier: "word",
    score:
      field < primary
        ? tierScore.word
        : Math.round(tierScore.word * secondaryWeight),
    field,
  };
};

const matchFields = (
  fields: ReadonlyArray<string>,
  query: string,
  primary: number,
) =>
  fields.reduce<FieldMatch | undefined>((best, text, field) => {
    const match = matchText(text, query);
    if (match === undefined || (field >= primary && isLoose(match)))
      return best;
    const score =
      field < primary ? match.score : Math.round(match.score * secondaryWeight);
    return best !== undefined && best.score >= score
      ? best
      : { ...match, score, field };
  }, undefined) ?? matchAcrossFields(fields, query, primary);

/**
 * Capy's picker search: keeps the items whose fields match the query, best
 * match first and ties in their original order. Fields before `primary` count
 * in full; later fields count half and only on exact, prefix or word hits.
 */
export const rankByQuery = <Item>(
  items: ReadonlyArray<Item>,
  fields: (item: Item) => ReadonlyArray<string>,
  query: string,
  primary = 1,
): ReadonlyArray<Item> => {
  if (normalize(query) === "") return items;
  return items
    .flatMap((item, index) => {
      const match = matchFields(fields(item), query, primary);
      return match === undefined ? [] : [{ item, index, score: match.score }];
    })
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ item }) => item);
};
