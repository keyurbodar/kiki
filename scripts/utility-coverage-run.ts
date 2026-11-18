/// <reference types="node" />
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { compile } from "@tailwindcss/node";
import {
  classify,
  findClassCandidates,
  selectorOf,
  type UnstyledClass,
} from "./utility-coverage";

/**
 * The utility-coverage check, over any source tree.
 *
 * It lives apart from the CLI so the guard can be pointed at a fixture and
 * proved to fail — a guard nobody has watched reject something is a guard that
 * might pass everything.
 */
export type UtilityCoverageOptions = {
  /** Directory holding the `.tsx` files and the stylesheet. Defaults to `src`. */
  readonly root?: string;
  /** Stylesheet Tailwind compiles. Defaults to `<root>/styles.css`. */
  readonly styleEntry?: string;
};

export type UtilityCoverageResult = {
  /** Files whose class literals were read. */
  readonly files: ReadonlyArray<string>;
  /** Allowlisted, but it compiles now: the entry should go. */
  readonly stale: ReadonlyArray<UnstyledClass>;
  /** No rule anywhere, and nobody has claimed it. */
  readonly unknown: ReadonlyArray<UnstyledClass>;
  /** Set when Tailwind could not compile, so the check was skipped. */
  readonly skipped?: string;
};

const listFiles = (root: string, extension: string): ReadonlyArray<string> =>
  readdirSync(root, { recursive: true, encoding: "utf8" })
    .map((path) => join(root, path.replaceAll("\\", "/")))
    .filter((path) => path.endsWith(extension) && !path.includes(".test."))
    .sort();

const escapeSelector = (token: string) =>
  token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function runUtilityCoverage(
  options: UtilityCoverageOptions = {},
): Promise<UtilityCoverageResult> {
  const root = options.root ?? "src";
  const styleEntry = options.styleEntry ?? join(root, "styles.css");

  const sourceFiles = listFiles(root, ".tsx");
  const componentCss = listFiles(root, ".css")
    .map((path) => readFileSync(path, "utf8"))
    .join("\n");

  const candidates = new Map<string, ReturnType<typeof findClassCandidates>>();
  const tokens = new Set<string>();
  for (const file of sourceFiles) {
    const found = findClassCandidates(readFileSync(file, "utf8"));
    candidates.set(file, found);
    for (const { token } of found) tokens.add(token);
  }

  let compiled: string;
  try {
    const compiler = await compile(readFileSync(styleEntry, "utf8"), {
      base: resolve(root),
      onDependency() {},
    });
    compiled = compiler.build([...tokens]);
  } catch (error) {
    return {
      files: sourceFiles,
      stale: [],
      unknown: [],
      skipped: error instanceof Error ? error.message : String(error),
    };
  }

  const covers = (token: string) =>
    compiled.includes(selectorOf(token)) ||
    new RegExp(`\\.${escapeSelector(token)}(?![\\w-])`).test(componentCss);

  const hits: (UnstyledClass & { styled: boolean })[] = [];
  for (const [file, found] of candidates) {
    for (const { token, line } of found) {
      hits.push({ file, token, line, styled: covers(token) });
    }
  }

  return { files: sourceFiles, ...classify(hits) };
}
