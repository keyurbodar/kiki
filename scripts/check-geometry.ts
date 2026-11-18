/// <reference types="node" />
import { readdirSync, readFileSync } from "node:fs";
import { escapes, findGeometry, isGuarded } from "./geometry";

const BASELINE = "scripts/geometry-baseline.json";

type Baseline = Record<string, number>;

const baseline: Baseline = JSON.parse(readFileSync(BASELINE, "utf8"));

const files = readdirSync("src", { recursive: true, encoding: "utf8" })
  .map((p) => `src/${p.replaceAll("\\", "/")}`)
  .filter(isGuarded)
  .sort();

let total = 0;
let regressions = 0;
let escapesExplained = 0;
const unexplained: string[] = [];
const overBudget: string[] = [];

for (const file of files) {
  const source = readFileSync(file, "utf8");
  const hits = findGeometry(source);
  total += hits.length;

  const budget = baseline[file] ?? 0;
  if (hits.length > budget) {
    regressions += hits.length - budget;
    overBudget.push(file);
    for (const hit of hits) {
      console.error(
        `${file}:${hit.line}:${hit.column} geometry "${hit.match}" (${hit.kind}): use a recipe from src/tokens/recipes.css`,
      );
    }
  }

  const free = escapes(source);
  escapesExplained += free.explained;
  for (const line of free.unexplained)
    unexplained.push(`${file}:${line} data-geometry="free" without a reason`);
}

for (const problem of unexplained) console.error(problem);

const clean = files.filter((file) => !(file in baseline)).length;

if (regressions > 0) {
  console.error(
    `\n${regressions} new geometry utilit${regressions === 1 ? "y" : "ies"} in tsx across ${overBudget.length} file(s).`,
  );
}
if (unexplained.length > 0) {
  console.error(`\n${unexplained.length} unexplained geometry escape(s).`);
}
if (regressions > 0 || unexplained.length > 0) process.exit(1);

console.log(
  `Geometry: ${total} utilit${total === 1 ? "y" : "ies"} still in tsx (baseline, may only go down), ${clean} of ${files.length} files clean, ${escapesExplained} explained escape(s).`,
);
