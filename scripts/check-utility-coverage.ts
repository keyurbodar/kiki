/// <reference types="node" />

import { KNOWN_UNSTYLED } from "./utility-coverage";
import { runUtilityCoverage } from "./utility-coverage-run";

const result = await runUtilityCoverage();

if (result.skipped !== undefined) {
  console.warn(
    `Skipped the utility-coverage check: Tailwind's compiler is unavailable (${result.skipped}).`,
  );
  process.exit(0);
}

for (const { file, token, line } of result.stale) {
  console.error(
    `${file}:${line} "${token}" is on the known-unstyled list but compiles now: delete its entry from scripts/utility-coverage.ts`,
  );
}
for (const { file, token, line } of result.unknown) {
  console.error(
    `${file}:${line} "${token}" styles nothing: use a token from src/tokens, or list it in scripts/utility-coverage.ts with the reason`,
  );
}

for (const { file, token, line } of result.staleDead) {
  console.error(
    `${file}:${line} "${token}" is on the known-dead list but has a rule now: delete its entry from scripts/utility-coverage.ts`,
  );
}
for (const { file, token, line } of result.dead) {
  console.error(
    `${file}:${line} "${token}" is a component class with no rule: define it in a stylesheet, or drop it from the markup`,
  );
}

if (
  result.stale.length +
    result.unknown.length +
    result.dead.length +
    result.staleDead.length >
  0
) {
  console.error(
    `\n${result.unknown.length} unstyled class(es), ${result.dead.length} dead component class(es) and ${result.stale.length} stale allowlist entr(ies).`,
  );
  process.exit(1);
}

console.log(
  `No unstyled classes in ${result.files.length} files (${KNOWN_UNSTYLED.length} known, listed in scripts/utility-coverage.ts).`,
);
