/// <reference types="node" />
import { readdirSync, readFileSync } from "node:fs";
import {
  classify,
  definedProperties,
  findPropertyUses,
  RUNTIME_PROPERTIES,
} from "./custom-properties";

const isSource = (path: string) => /\.(css|ts|tsx)$/.test(path);

const files = readdirSync("src", { recursive: true, encoding: "utf8" })
  .map((path) => `src/${path.replaceAll("\\", "/")}`)
  .filter(isSource)
  .sort();

const sources = files.map((path) => ({
  path,
  source: readFileSync(path, "utf8"),
}));

const defined = definedProperties(sources);
const uses = sources.flatMap(({ path, source }) =>
  findPropertyUses(path, source),
);
const { unknown, stale } = classify(uses, defined);

for (const { file, line, name } of unknown) {
  console.error(
    `${file}:${line} "${name}" is read through var() and defined nowhere: use a token from src/tokens, or list it in scripts/custom-properties.ts with the reason the runtime supplies it`,
  );
}
for (const { file, line, name, definedIn } of stale) {
  console.error(
    `${file}:${line} "${name}" is on the runtime list but is defined at ${definedIn}: delete its entry from scripts/custom-properties.ts`,
  );
}

if (unknown.length + stale.length > 0) {
  console.error(
    `\n${unknown.length} undefined propert${unknown.length === 1 ? "y" : "ies"} and ${stale.length} stale runtime entr${stale.length === 1 ? "y" : "ies"}.`,
  );
  process.exit(1);
}

console.log(
  `No undefined custom properties in ${files.length} files (${defined.size} defined, ${uses.length} reads, ${RUNTIME_PROPERTIES.length} runtime entries in scripts/custom-properties.ts).`,
);
