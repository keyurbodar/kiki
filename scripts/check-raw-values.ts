/// <reference types="node" />
import { readdirSync, readFileSync } from "node:fs";
import { findRawValues, isGuarded } from "./raw-values";

const files = readdirSync("src", { recursive: true, encoding: "utf8" })
  .map((p) => `src/${p.replaceAll("\\", "/")}`)
  .filter(isGuarded)
  .sort();
let count = 0;
for (const file of files) {
  for (const hit of findRawValues(readFileSync(file, "utf8"))) {
    count++;
    console.error(
      `${file}:${hit.line}:${hit.column} raw ${hit.rule} "${hit.match}": use a token from src/tokens`,
    );
  }
}
if (count > 0) {
  console.error(`\n${count} raw value(s) outside src/tokens.`);
  process.exit(1);
}
console.log(`No raw values in ${files.length} files outside src/tokens.`);
