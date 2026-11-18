/// <reference types="node" />
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { findGeometry, isGuarded } from "./geometry";

const files = readdirSync("src", { recursive: true, encoding: "utf8" })
  .map((p) => `src/${p.replaceAll("\\", "/")}`)
  .filter(isGuarded)
  .sort();

const baseline: Record<string, number> = {};
let total = 0;
for (const file of files) {
  const hits = findGeometry(readFileSync(file, "utf8")).length;
  if (hits > 0) baseline[file] = hits;
  total += hits;
}
writeFileSync(
  "scripts/geometry-baseline.json",
  `${JSON.stringify(baseline, null, 2)}\n`,
);
console.log(
  `${total} geometry utilities across ${Object.keys(baseline).length} files recorded in scripts/geometry-baseline.json.`,
);
