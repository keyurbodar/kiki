/**
 * The guard answers one question: does any stylesheet or inline style in this
 * repo define the custom property a `var()` reads? It cannot tell a property a
 * runtime library sets (`--available-height` from Base UI, `--trees-*` from
 * @pierre/trees, `--surface` inside an embedded visual's document) from one
 * nobody sets at all, and it does not evaluate fallbacks, so a name only ever
 * read through `var(--name, fallback)` still needs a decision. Those live in
 * RUNTIME_PROPERTIES below with the reason we believe the runtime supplies
 * them; anything else is a declaration that silently drops.
 */

export type PropertyUse = { file: string; line: number; name: string };

export type PropertySource = { path: string; source: string };

const DEFINITION = /(--[A-Za-z0-9_-]+)["']?\s*:/g;
const SETTER = /setProperty\(\s*["'`](--[A-Za-z0-9_-]+)/g;
const USE = /var\(\s*(--[A-Za-z0-9_-]+)\s*[,)]/g;

const lineOf = (source: string, index: number) =>
  source.slice(0, index).split("\n").length;

/**
 * Names the runtime supplies rather than a stylesheet. An entry that is exact
 * can go stale — if the repo starts defining it, the guard says so; a prefix
 * entry covers a third-party family and cannot.
 */
export const RUNTIME_PROPERTIES: ReadonlyArray<{
  name?: string;
  prefix?: string;
  note: string;
}> = [
  {
    prefix: "--trees-",
    note: "@pierre/trees defines these inside the shadow root",
  },
  {
    prefix: "--diffs-",
    note: "@pierre/diffs defines these inside the shadow root",
  },
  {
    prefix: "--shiki-",
    note: "shiki writes these per token on the code block",
  },
  { prefix: "--term-", note: "the terminal layer writes these at runtime" },
  {
    prefix: "--chart-",
    note: "chart series read a name composed from the index",
  },
  {
    prefix: "--capy-",
    note: "the embedded visual document maps these from app tokens",
  },
  {
    prefix: "--visual-gap-",
    note: "the embedded visual document declares these",
  },
  {
    prefix: "--diff-sticky-backing",
    note: "DiffSurface writes these from measured geometry",
  },
  {
    name: "--available-height",
    note: "Base UI writes the popup's available height",
  },
  { name: "--anchor-width", note: "Base UI writes the trigger's width" },
  { name: "--transform-origin", note: "Base UI writes the popup's origin" },
  { name: "--y", note: "motion writes the drag translation" },
  { name: "--swipe-amount-x", note: "motion writes the swipe offset" },
  { name: "--swipe-amount-y", note: "motion writes the swipe offset" },
  { name: "--x", note: "motion writes the drag translation" },
  { name: "--grid", note: "grid-table writes the grid template inline" },
  {
    name: "--grid-columns",
    note: "grid-table writes the grid template inline",
  },
  { name: "--tile-r", note: "tile-surface writes the ratio inline" },
  { name: "--fabric-unmask", note: "the fabric effect writes its mask inline" },
  {
    name: "--composer-surface",
    note: "composer callers override the surface inline",
  },
  {
    name: "--lightbox-controls",
    note: "the lightbox writes its control inset inline",
  },
  {
    name: "--scroll-divider-ramp",
    note: "the sticky header writes its fade range",
  },
  { name: "--tail-fade", note: "work-group writes the tail mask inline" },
  { name: "--surface", note: "embedded visual token, mapped in visual.tsx" },
  { name: "--border", note: "embedded visual token, mapped in visual.tsx" },
  { name: "--accent", note: "embedded visual token, mapped in visual.tsx" },
  { name: "--positive", note: "embedded visual token, mapped in visual.tsx" },
  { name: "--negative", note: "embedded visual token, mapped in visual.tsx" },
  { name: "--faint", note: "embedded visual token, mapped in visual.tsx" },
  { name: "--background", note: "embedded visual token, mapped in visual.tsx" },
  { name: "--foreground", note: "embedded visual token, mapped in visual.tsx" },
];

export function definedProperties(
  sources: ReadonlyArray<PropertySource>,
): Map<string, string> {
  const defined = new Map<string, string>();
  for (const { path, source } of sources) {
    for (const match of source.matchAll(DEFINITION)) {
      const name = match[1];
      if (name !== undefined && !defined.has(name))
        defined.set(name, `${path}:${lineOf(source, match.index ?? 0)}`);
    }
    for (const match of source.matchAll(SETTER)) {
      const name = match[1];
      if (name !== undefined && !defined.has(name))
        defined.set(name, `${path}:${lineOf(source, match.index ?? 0)}`);
    }
  }
  return defined;
}

/**
 * Every `var(--name)` in a source that names a property literally. A name
 * composed at runtime (`var(--chart-${index})`) is not a use this guard can
 * judge, so it is dropped rather than reported.
 */
export function findPropertyUses(file: string, source: string): PropertyUse[] {
  const uses: PropertyUse[] = [];
  for (const match of source.matchAll(USE)) {
    const name = match[1];
    if (name === undefined || name.endsWith("-")) continue;
    uses.push({ name, file, line: lineOf(source, match.index ?? 0) });
  }
  return uses;
}

const matches = (entry: (typeof RUNTIME_PROPERTIES)[number], name: string) =>
  entry.name === name ||
  (entry.prefix !== undefined && name.startsWith(entry.prefix));

export const isRuntimeProperty = (name: string) =>
  RUNTIME_PROPERTIES.some((entry) => matches(entry, name));

export type PropertyVerdict = {
  /** Read by `var()`, defined nowhere, claimed by nobody. */
  unknown: PropertyUse[];
  /** On the runtime list, but the repo defines it now. */
  stale: Array<PropertyUse & { note: string; definedIn: string }>;
};

/**
 * Splits every use into the properties nobody defines and the runtime entries
 * that have since become real, so the list cannot quietly outlive its reason.
 */
export function classify(
  uses: ReadonlyArray<PropertyUse>,
  defined: ReadonlyMap<string, string>,
): PropertyVerdict {
  const unknown: PropertyUse[] = [];
  const stale: Array<PropertyUse & { note: string; definedIn: string }> = [];
  const seenStale = new Set<string>();
  for (const use of uses) {
    const definedIn = defined.get(use.name);
    const entry = RUNTIME_PROPERTIES.find((candidate) =>
      matches(candidate, use.name),
    );
    if (definedIn === undefined) {
      if (entry === undefined) unknown.push(use);
      continue;
    }
    if (entry === undefined || entry.prefix !== undefined) continue;
    if (seenStale.has(use.name)) continue;
    seenStale.add(use.name);
    stale.push({ ...use, note: entry.note, definedIn });
  }
  return { unknown, stale };
}
