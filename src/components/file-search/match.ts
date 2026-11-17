export type MatchRange = { start: number; end: number };

export type PathMatch = {
  path: string;
  score: number;
  where: "name" | "path";
  ranges: MatchRange[];
};

export type TextSegment = { text: string; hit: boolean };

export const toRanges = (indices: readonly number[]): MatchRange[] => {
  const ranges: MatchRange[] = [];
  for (const index of indices) {
    const last = ranges.at(-1);
    if (last !== undefined && last.end === index)
      ranges[ranges.length - 1] = { ...last, end: index + 1 };
    else ranges.push({ start: index, end: index + 1 });
  }
  return ranges;
};

const isBoundary = (text: string, index: number) => {
  if (index === 0) return true;
  const previous = text.charAt(index - 1);
  if (
    previous === "/" ||
    previous === "-" ||
    previous === "_" ||
    previous === "." ||
    previous === " "
  )
    return true;
  const current = text.charAt(index);
  return (
    current !== current.toLowerCase() && previous === previous.toLowerCase()
  );
};

export const fuzzyScore = (query: string, text: string) => {
  const lower = text.toLowerCase();
  const indices: number[] = [];
  let score = 0;
  let from = 0;
  for (const char of query) {
    const index = lower.indexOf(char, from);
    if (index === -1) return undefined;
    score += 1;
    if (isBoundary(text, index)) score += 4;
    if (indices.at(-1) === index - 1) score += 2;
    indices.push(index);
    from = index + 1;
  }
  return { score, indices };
};

export const matchPath = (
  rawQuery: string,
  path: string,
): PathMatch | undefined => {
  const query = rawQuery.trim().toLowerCase();
  if (query === "") return undefined;
  const name = path
    .slice(path.lastIndexOf("/", path.length - 2) + 1)
    .replace(/\/$/, "");
  if (!query.includes("/")) {
    const hit = fuzzyScore(query, name);
    if (hit !== undefined) {
      const prefix = name.toLowerCase().startsWith(query) ? 24 : 0;
      const coverage = Math.round((query.length / name.length) * 8);
      return {
        path,
        score: 100 + hit.score + prefix + coverage,
        where: "name",
        ranges: toRanges(hit.indices),
      };
    }
  }
  const hit = fuzzyScore(query, path);
  return hit === undefined
    ? undefined
    : { path, score: hit.score, where: "path", ranges: toRanges(hit.indices) };
};

const isSubsequence = (query: string, text: string) => {
  let from = 0;
  for (const char of query) {
    const index = text.indexOf(char, from);
    if (index === -1) return false;
    from = index + 1;
  }
  return true;
};

const byScore = (a: PathMatch, b: PathMatch) =>
  b.score - a.score || a.path.length - b.path.length;

export type PathMatcher = (query: string, limit: number) => PathMatch[];

export const createPathMatcher = (paths: readonly string[]): PathMatcher => {
  const entries = paths.map((path) => ({ path, lower: path.toLowerCase() }));
  let previous: { query: string; candidates: typeof entries } | undefined;
  return (rawQuery, limit) => {
    const query = rawQuery.trim().toLowerCase();
    if (query === "") return [];
    const pool =
      previous !== undefined && query.startsWith(previous.query)
        ? previous.candidates
        : entries;
    const candidates = pool.filter((entry) =>
      isSubsequence(query, entry.lower),
    );
    previous = { query, candidates };
    return candidates
      .flatMap((entry) => {
        const match = matchPath(query, entry.path);
        return match === undefined ? [] : [match];
      })
      .sort(byScore)
      .slice(0, limit);
  };
};

export const splitHits = (
  text: string,
  ranges: readonly MatchRange[],
): TextSegment[] => {
  const segments: TextSegment[] = [];
  let at = 0;
  for (const range of ranges) {
    if (range.start > at)
      segments.push({ text: text.slice(at, range.start), hit: false });
    segments.push({ text: text.slice(range.start, range.end), hit: true });
    at = range.end;
  }
  if (at < text.length) segments.push({ text: text.slice(at), hit: false });
  return segments;
};

export type ContentMatch = {
  path: string;
  lineNumber: number;
  lineText: string;
  ranges: MatchRange[];
};

export const matchContent = (
  rawQuery: string,
  path: string,
  content: string,
  limit: number,
): ContentMatch[] => {
  const query = rawQuery.trim().toLowerCase();
  if (query === "") return [];
  const matches: ContentMatch[] = [];
  const lines = content.split("\n");
  for (let index = 0; index < lines.length && matches.length < limit; index++) {
    const line = lines[index] ?? "";
    const lowerLine = line.toLowerCase();
    const first = lowerLine.indexOf(query);
    if (first === -1) continue;
    const offset = line.length > 240 ? Math.max(0, first - 24) : 0;
    const window = line.slice(offset, offset + 240);
    const lowerWindow = lowerLine.slice(offset, offset + 240);
    const ranges: MatchRange[] = [];
    for (
      let at = lowerWindow.indexOf(query);
      at !== -1;
      at = lowerWindow.indexOf(query, at + query.length)
    )
      ranges.push({ start: at, end: at + query.length });
    if (ranges.length === 0) continue;
    const indent = window.length - window.trimStart().length;
    const trim = Math.min(indent, ranges[0]?.start ?? 0);
    matches.push({
      path,
      lineNumber: index + 1,
      lineText: window.slice(trim),
      ranges: ranges.map((range) => ({
        start: range.start - trim,
        end: range.end - trim,
      })),
    });
  }
  return matches;
};
