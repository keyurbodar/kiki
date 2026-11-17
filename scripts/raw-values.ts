export type RawValueHit = {
  line: number;
  column: number;
  match: string;
  rule: string;
};

const RULES: ReadonlyArray<{ rule: string; pattern: RegExp }> = [
  {
    rule: "hex colour",
    pattern: /(?<![\w&$])#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})\b/gi,
  },
  {
    rule: "colour function",
    pattern: /\b(?:rgba?|hsla?|hwb|oklch|oklab|lab|lch)\(/gi,
  },
  { rule: "px length", pattern: /(?<![\w-])-?\d*\.?\d+px\b/gi },
  { rule: "duration", pattern: /(?<![\w.-])\d*\.?\d+m?s\b/gi },
];

export function findRawValues(source: string): RawValueHit[] {
  const hits: RawValueHit[] = [];
  source.split("\n").forEach((text, index) => {
    for (const { rule, pattern } of RULES) {
      for (const m of text.matchAll(pattern)) {
        hits.push({
          line: index + 1,
          column: (m.index ?? 0) + 1,
          match: m[0],
          rule,
        });
      }
    }
  });
  return hits;
}

export const isGuarded = (path: string) =>
  /\.(css|ts|tsx)$/.test(path) &&
  !path.startsWith("src/tokens/") &&
  !path.startsWith("src/data/") &&
  !/\.test\.tsx?$/.test(path) &&
  path !== "src/routeTree.gen.ts";
