#!/usr/bin/env bun
/**
 * Regenerates `src/primitives/icon/sprite.svg` and `src/primitives/icon/icon-ids.ts`
 * from Capy's production bundle.
 *
 * Capy defines every icon as a memoised component whose `ariaLabel` carries the
 * icon's name followed by its keyword aliases, and whose children are the
 * geometry:
 *
 *     Xe = J.memo(e => J.createElement(v, {...e, ariaLabel:`agent, flow, diagram`},
 *         J.createElement(`circle`, {cx:`12`, cy:`6`, r:`2.5`, stroke:`currentColor`}),
 *         ...))
 *
 * Seventeen names appear twice, once filled and once stroked, and the stroked
 * ones are the `-outline` glyphs the app already ships: the variant with fewer
 * `stroke-width` children keeps the plain name, the other becomes `<name>-outline`.
 *
 * Those chunks are private: they live on the build machine and never enter the
 * repo. Point the script at them with KIKI_ICON_CHUNKS (or let it fall back to
 * the shared work directory). Only the generated sprite and id list are
 * committed.
 *
 * Usage: bun scripts/generate-icon-sprite.ts [--check]
 *   --check  fail instead of writing when the committed files are out of date
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const CHUNK_DIRS = [
  process.env.KIKI_ICON_CHUNKS,
  join(homedir(), ".capy/work/kiki-wp/chunks"),
  "/home/ubuntu/.capy/work/kiki-wp/chunks",
].filter((dir): dir is string => typeof dir === "string" && dir.length > 0);

const ICON_DIR = join(import.meta.dir, "..", "src/primitives/icon");
const SPRITE_PATH = join(ICON_DIR, "sprite.svg");
const IDS_PATH = join(ICON_DIR, "icon-ids.ts");

const ICON_NAME = /^[a-z0-9][a-z0-9.-]*$/;
const ATTRIBUTE = /([A-Za-z]+):(`[^`]*`|-?[0-9.]+)/g;
const CREATE = /createElement\(`([a-zA-Z]+)`,{/g;

type Attribute = [name: string, value: string];
type Child = [tag: string, attributes: Attribute[]];
type Glyph = { label: string; children: Child[] };

const chunkDir = CHUNK_DIRS.find((dir) => existsSync(dir));
if (chunkDir === undefined) {
  console.error(
    "No bundle chunks found. Set KIKI_ICON_CHUNKS to the directory holding Capy's extracted chunks.",
  );
  process.exit(2);
}

const kebab = (name: string) =>
  name.replace(/(?<!^)([A-Z])/g, (letter) => `-${letter.toLowerCase()}`);

function matchingBrace(text: string, start: number): number {
  let depth = 0;
  for (let index = start; index < text.length; index += 1) {
    if (text[index] === "{") depth += 1;
    else if (text[index] === "}") {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
}

function attributesOf(raw: string): Attribute[] | null {
  // Anything left after the literal pairs is computed, and a computed attribute
  // would have to be invented, so such a glyph is skipped instead.
  if (raw.replace(ATTRIBUTE, "").replace(/[,\s]/g, "").length > 0) return null;
  return [...raw.matchAll(ATTRIBUTE)].map(([, name, value]) => [
    kebab(name),
    value.startsWith("`") ? value.slice(1, -1) : value,
  ]);
}

function childrenOf(text: string, from: number): Child[] | null {
  const children: Child[] = [];
  let cursor = from;
  for (;;) {
    CREATE.lastIndex = cursor;
    const element = CREATE.exec(text);
    if (element === null) break;
    const open = element.index + element[0].length - 1;
    const close = matchingBrace(text, open);
    if (close < 0) break;
    const attributes = attributesOf(text.slice(open + 1, close));
    if (attributes === null) return null;
    children.push([element[1], attributes]);
    cursor = close + 1;
    while (cursor < text.length && /\s/.test(text[cursor])) cursor += 1;
    if (text[cursor] === ")") cursor += 1;
    while (cursor < text.length && /\s/.test(text[cursor])) cursor += 1;
    if (text[cursor] !== ",") break;
    cursor += 1;
  }
  return children.length > 0 ? children : null;
}

function glyphsIn(text: string): Map<string, Glyph[]> {
  const found = new Map<string, Glyph[]>();
  const aria = /ariaLabel:`([^`]*)`/g;
  let label = aria.exec(text);
  while (label !== null) {
    const name = label[1].split(",")[0]?.trim() ?? "";
    if (ICON_NAME.test(name)) {
      const children = childrenOf(text, label.index + label[0].length);
      if (children !== null) {
        const glyphs = found.get(name) ?? [];
        const rendered = render(children);
        if (!glyphs.some((glyph) => render(glyph.children) === rendered)) {
          glyphs.push({ label: label[1], children });
        }
        found.set(name, glyphs);
      }
    }
    label = aria.exec(text);
  }
  return found;
}

function render(children: Child[]): string {
  return children
    .map(
      ([tag, attributes]) =>
        `<${tag} ${attributes.map(([name, value]) => `${name}="${value}"`).join(" ")}/>`,
    )
    .join("");
}

const stroked = (glyph: Glyph) =>
  glyph.children.filter(([, attributes]) =>
    attributes.some(([name]) => name === "stroke-width"),
  ).length;

const collected = new Map<string, Glyph[]>();
for (const file of readdirSync(chunkDir).sort()) {
  if (!file.endsWith(".js")) continue;
  for (const [name, glyphs] of glyphsIn(
    readFileSync(join(chunkDir, file), "utf8"),
  )) {
    const existing = collected.get(name) ?? [];
    for (const glyph of glyphs) {
      if (
        !existing.some(
          (known) => render(known.children) === render(glyph.children),
        )
      ) {
        existing.push(glyph);
      }
    }
    collected.set(name, existing);
  }
}

const named = new Map<string, Glyph>();
for (const [name, glyphs] of collected) {
  // The filled variant keeps the plain name. When both variants are stroked,
  // the one with more elements is the plain glyph and the sparser one is the
  // outline, which is how Capy's own sprite pairs them.
  const ordered = [...glyphs].sort(
    (a, b) =>
      Number(stroked(a) > 0) - Number(stroked(b) > 0) ||
      b.children.length - a.children.length,
  );
  named.set(name, ordered[0]);
  if (ordered.length > 1) named.set(`${name}-outline`, ordered[1]);
  if (ordered.length > 2) {
    console.warn(`${name}: ${ordered.length} glyphs, keeping the first two`);
  }
}

const entries = [...named.entries()].sort(([a], [b]) => (a < b ? -1 : 1));
const names = entries.map(([name]) => name);
const symbols = entries.map(
  ([name, glyph]) =>
    `  <symbol id="${name}" viewBox="0 0 24 24" fill="none">${render(glyph.children)}</symbol>`,
);

const sprite = [
  '<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true">',
  ...symbols,
  "</svg>",
  "",
].join("\n");

const idsSource = [
  "/* Generated by scripts/generate-icon-sprite.ts from Capy's production bundle. Do not edit. */",
  "export const ICON_IDS = [",
  ...names.map((name) => `  ${JSON.stringify(name)},`),
  "] as const;",
  "",
  "export type IconId = (typeof ICON_IDS)[number];",
  "",
  "export const ICON_KEYWORDS: Record<IconId, string> = {",
  ...entries.map(
    ([name, glyph]) =>
      `  ${JSON.stringify(name)}: ${JSON.stringify(glyph.label)},`,
  ),
  "};",
  "",
  "const iconIds: ReadonlySet<string> = new Set(ICON_IDS);",
  "",
  "export const isIconId = (name: string): name is IconId => iconIds.has(name);",
  "",
].join("\n");

const check = process.argv.includes("--check");
const stale = [
  [SPRITE_PATH, sprite],
  [IDS_PATH, idsSource],
].filter(([path, next]) => readFileSync(path, "utf8") !== next);

console.log(
  `${names.length} glyphs from ${collected.size} bundle names (${names.length - collected.size} outline variants)`,
);

if (stale.length === 0) {
  console.log("committed sprite and id list are up to date");
} else if (check) {
  console.error(
    `out of date: ${stale.map(([path]) => path).join(", ")} — run bun scripts/generate-icon-sprite.ts`,
  );
  process.exit(1);
} else {
  for (const [path, next] of stale) {
    writeFileSync(path, next);
    console.log(`wrote ${path}`);
  }
}
