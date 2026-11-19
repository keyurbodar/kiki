/// <reference types="node" />
import { readdirSync, readFileSync } from "node:fs";
import { findEmptyOrgAtomReads, isGuarded } from "./empty-org-atoms";

const baseline = JSON.parse(
  readFileSync("scripts/empty-org-atoms.json", "utf8"),
) as Record<string, number>;

const files = readdirSync("src", { recursive: true, encoding: "utf8" })
  .map((p) => `src/${p.replaceAll("\\", "/")}`)
  .filter(isGuarded)
  .sort();

let count = 0;
let allowed = 0;
for (const file of files) {
  const hits = findEmptyOrgAtomReads(readFileSync(file, "utf8"));
  const ceiling = baseline[file] ?? 0;
  if (hits.length <= ceiling) {
    allowed += hits.length;
    continue;
  }
  for (const hit of hits) {
    count++;
    console.error(
      `${file}:${hit.line}:${hit.column} atom keyed on ${hit.match}: an unresolved org has no id to read, so this asks for "/orgs//". Take the idle atom while the org is undefined: orgId === undefined ? idleXAtom : xAtom(orgId)`,
    );
  }
}

if (count > 0) {
  console.error(
    `\n${count} atom read(s) skipped over the ${allowed}-site baseline in scripts/empty-org-atoms.json.`,
  );
  process.exit(1);
}
console.log(
  `No new atom reads keyed on an empty org id in ${files.length} files (${allowed} known, listed in scripts/empty-org-atoms.json).`,
);
