/// <reference types="node" />
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

/**
 * A branch cut before a guard existed carries no copy of it, and its merge can
 * carry the guard's deletion: #500 removed `scripts/geometry*.ts`,
 * `src/tokens/recipes.css`, `read-gate` and a step of `package.json`'s lint
 * chain in the same squash that added a pane, and nothing noticed because the
 * check that would have objected was inside the diff. For the hour the gate was
 * gone every tree passed `bun run lint`, and the drift it had been holding back
 * surfaced the moment #516 restored it.
 *
 * So infrastructure deletions are declared. A file under `scripts/`,
 * `src/tokens/`, or one of the config files below may be deleted only by adding
 * it to `scripts/deletions.allow.json` with a reason, which turns a silent
 * revert into a line in a diff someone reads.
 */

const BASE_REF = process.env.KIKI_BASE_REF ?? "origin/main";
const ALLOWLIST = "scripts/deletions.allow.json";

const PROTECTED = [
  /^scripts\/[\w./-]+$/,
  /^src\/tokens\/[\w./-]+$/,
  /^(?:package\.json|biome\.json|tsconfig\.json|vitest\.config\.ts|vitest\.setup\.ts|vite\.config\.ts|bun\.lock)$/,
];

type Allowlist = Record<string, string>;

function git(args: string[]): string | null {
  try {
    return execFileSync("git", args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return null;
  }
}

const base = git(["rev-parse", "--verify", "--quiet", `${BASE_REF}^{commit}`]);
if (base === null) {
  console.log(
    `Deletions: no ${BASE_REF} to compare against, skipped (CI fetches it).`,
  );
  process.exit(0);
}

const mergeBase = git(["merge-base", base.trim(), "HEAD"]);
if (mergeBase === null) {
  console.log(`Deletions: no merge base with ${BASE_REF}, skipped.`);
  process.exit(0);
}

const atBase = new Set(
  (git(["ls-tree", "-r", "--name-only", mergeBase.trim()]) ?? "")
    .split("\n")
    .filter(Boolean),
);

const allowlist: Allowlist = existsSync(ALLOWLIST)
  ? (JSON.parse(readFileSync(ALLOWLIST, "utf8")) as Allowlist)
  : {};

const missing = [...atBase]
  .filter((path) => PROTECTED.some((pattern) => pattern.test(path)))
  .filter((path) => !existsSync(path))
  .sort();

const undeclared = missing.filter((path) => allowlist[path] === undefined);

for (const path of missing) {
  const reason = allowlist[path];
  console.log(
    reason === undefined
      ? `deleted: ${path}`
      : `deleted with a reason: ${path} — ${reason}`,
  );
}

if (undeclared.length > 0) {
  console.error(
    `\n${undeclared.length} infrastructure file(s) deleted without a reason in ${ALLOWLIST}.`,
  );
  process.exit(1);
}

console.log(
  `Deletions: ${atBase.size} files at the merge base, ${missing.length} infrastructure deletion(s), all declared.`,
);
