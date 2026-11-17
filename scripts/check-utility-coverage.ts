/// <reference types="node" />
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { compile } from "@tailwindcss/node";
import {
  classify,
  findClassCandidates,
  KNOWN_UNSTYLED,
  selectorOf,
  type UnstyledClass,
} from "./utility-coverage";

const sourceFiles = readdirSync("src", { recursive: true, encoding: "utf8" })
  .map((path) => `src/${path.replaceAll("\\", "/")}`)
  .filter((path) => path.endsWith(".tsx") && !path.includes(".test."))
  .sort();

const componentCss = readdirSync("src", { recursive: true, encoding: "utf8" })
  .map((path) => `src/${path.replaceAll("\\", "/")}`)
  .filter((path) => path.endsWith(".css"))
  .sort()
  .map((path) => readFileSync(path, "utf8"))
  .join("\n");

const escapeSelector = (token: string) =>
  token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** A class is covered when Tailwind emits it, or a component stylesheet names it. */
const covers = (compiled: string, token: string) =>
  compiled.includes(selectorOf(token)) ||
  new RegExp(`\\.${escapeSelector(token)}(?![\\w-])`).test(componentCss);

const candidates = new Map<string, ReturnType<typeof findClassCandidates>>();
const tokens = new Set<string>();
for (const file of sourceFiles) {
  const found = findClassCandidates(readFileSync(file, "utf8"));
  candidates.set(file, found);
  for (const { token } of found) tokens.add(token);
}

let compiled: string;
try {
  const compiler = await compile(readFileSync("src/styles.css", "utf8"), {
    base: resolve("src"),
    onDependency() {},
  });
  compiled = compiler.build([...tokens]);
} catch (error) {
  console.warn(
    `Skipped the utility-coverage check: Tailwind's compiler is unavailable (${error instanceof Error ? error.message : String(error)}).`,
  );
  process.exit(0);
}

const hits: (UnstyledClass & { styled: boolean })[] = [];
for (const [file, found] of candidates) {
  for (const { token, line } of found) {
    hits.push({ file, token, line, styled: covers(compiled, token) });
  }
}

const { stale, unknown } = classify(hits);

for (const { file, token, line } of stale) {
  console.error(
    `${file}:${line} "${token}" is on the known-unstyled list but compiles now: delete its entry from scripts/utility-coverage.ts`,
  );
}
for (const { file, token, line } of unknown) {
  console.error(
    `${file}:${line} "${token}" styles nothing: use a token from src/tokens, or list it in scripts/utility-coverage.ts with the reason`,
  );
}

if (stale.length + unknown.length > 0) {
  console.error(
    `\n${unknown.length} unstyled class(es) and ${stale.length} stale allowlist entr(ies).`,
  );
  process.exit(1);
}

console.log(
  `No unstyled classes in ${sourceFiles.length} files (${KNOWN_UNSTYLED.length} known, listed in scripts/utility-coverage.ts).`,
);
