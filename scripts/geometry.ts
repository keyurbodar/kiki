export type GeometryHit = {
  line: number;
  column: number;
  match: string;
  kind: string;
};

/**
 * The geometry families a recipe owns. Anything in these families belongs in
 * `src/tokens/recipes.css`, where one token moves every surface at once;
 * colour, typography, state and radius stay in tsx.
 */
const FAMILIES: ReadonlyArray<{ kind: string; pattern: RegExp }> = [
  {
    kind: "spacing",
    pattern: /(?<![\w-])[pm][trblxyse]?-(?:\[[^\]]*\]|\([^)]*\)|[\w./%-]+)/g,
  },
  {
    kind: "gap",
    pattern: /(?<![\w-])(?:gap|gap-x|gap-y|space-x|space-y)-[\w./[\]()%-]+/g,
  },
  {
    kind: "size",
    pattern: /(?<![\w-])(?:min-|max-)?[wh]-(?:\[[^\]]*\]|\([^)]*\)|[\w./%-]+)/g,
  },
  {
    kind: "size",
    pattern: /(?<![\w-])size-(?:\[[^\]]*\]|\([^)]*\)|[\w./%-]+)/g,
  },
  {
    kind: "align",
    pattern:
      /(?<![\w-])(?:items|justify|content|self|place|align)-(?:start|end|center|between|around|evenly|stretch|baseline|normal|auto)/g,
  },
  {
    kind: "align",
    pattern: /(?<![\w-])text-(?:left|center|right|start|end|justify)\b/g,
  },
  {
    kind: "inset",
    pattern:
      /(?<![\w-])(?:inset|inset-x|inset-y|top|right|bottom|left)-(?:\[[^\]]*\]|\([^)]*\)|[\w./%-]+)/g,
  },
  {
    kind: "columns",
    pattern:
      /(?<![\w-])(?:grid-cols|grid-rows|col-span|row-span|col-start|row-start|basis)-[\w./[\]()%-]+/g,
  },
];

/** Utilities whose names look geometric but carry type, colour or state. */
const ALLOWED = new Set([
  "w-fit",
  "h-fit",
  "w-full",
  "h-full",
  "w-px",
  "h-px",
  "w-auto",
  "h-auto",
  "w-max",
  "h-max",
  "w-min",
  "h-min",
  "w-screen",
  "h-screen",
  "size-fit",
  "size-full",
  "size-auto",
]);

const isAllowed = (match: string) =>
  ALLOWED.has(match) ||
  // A variant prefix such as `hover:` or `data-[x]:` does not change the family.
  match.includes("text-balance") ||
  match.includes("text-pretty") ||
  match.includes("text-ellipsis") ||
  match.includes("text-clip");

export function findGeometry(source: string): GeometryHit[] {
  const hits: GeometryHit[] = [];
  source.split("\n").forEach((text, index) => {
    const trimmed = text.trimStart();
    if (trimmed.startsWith("*") || trimmed.startsWith("//")) return;
    if (text.includes('data-geometry="free"')) return;
    for (const { kind, pattern } of FAMILIES) {
      for (const m of text.matchAll(pattern)) {
        const match = m[0];
        if (isAllowed(match)) continue;
        if (/-(?:transparent|inherit|current|none|hidden|visible)$/.test(match))
          continue;
        hits.push({ line: index + 1, column: (m.index ?? 0) + 1, match, kind });
      }
    }
  });
  return hits;
}

/** tsx and ts files outside the token layer carry no geometry. */
export const isGuarded = (path: string) =>
  /\.tsx?$/.test(path) &&
  !path.startsWith("src/tokens/") &&
  !path.startsWith("src/data/") &&
  !/\.test\.tsx?$/.test(path) &&
  !/\.specimen\.tsx$/.test(path) &&
  path !== "src/routeTree.gen.ts";

/**
 * An escape hatch has to say why. `data-geometry="free"` with a reason on the
 * same line is a measurement; without one it is a leak.
 */
export function escapes(source: string) {
  let explained = 0;
  const unexplained: number[] = [];
  source.split("\n").forEach((text, index) => {
    if (!text.includes('data-geometry="free"')) return;
    const after = text.slice(text.indexOf('data-geometry="free"'));
    const hasReason =
      /\/\/.*\S/.test(after) ||
      /\/\*.*\S.*\*\//.test(text) ||
      /#\S/.test(after);
    if (hasReason) explained++;
    else unexplained.push(index + 1);
  });
  return { explained, unexplained };
}
