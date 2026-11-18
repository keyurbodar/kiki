import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * `lint` is a chain in `package.json`, and a chain is the easiest thing in the
 * repo to break silently: dropping one `bun scripts/check-*.ts` step leaves
 * every other check passing and the dropped one reporting nothing. #500 shipped
 * exactly that — five guard files deleted and the geometry step taken out of
 * `lint` — and no tree went red while the gate was gone.
 *
 * These assertions run from the test suite instead, so the guard has to be
 * present and wired in a place the guard itself does not control.
 */
const GUARDS = [
  "scripts/check-raw-values.ts",
  "scripts/check-utility-coverage.ts",
  "scripts/check-custom-properties.ts",
  "scripts/check-geometry.ts",
  "scripts/check-deletions.ts",
];

const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
  scripts: Record<string, string | undefined>;
};

const lint = pkg.scripts.lint ?? "";

describe("lint wiring", () => {
  it.each(GUARDS)("%s exists", (guard) => {
    expect(existsSync(guard)).toBe(true);
  });

  it.each(GUARDS)("%s runs from lint", (guard) => {
    expect(lint).toContain(guard);
  });

  it("every check script in the repo is wired into lint", () => {
    const declared = GUARDS.map((guard) => guard.replace("scripts/", ""));
    const missing = declared.filter(
      (name) => existsSync(`scripts/${name}`) && !lint.includes(name),
    );
    expect(missing).toEqual([]);
  });

  it("the geometry guard carries a baseline to compare against", () => {
    const baseline = JSON.parse(
      readFileSync("scripts/geometry-baseline.json", "utf8"),
    ) as Record<string, number>;
    expect(Object.keys(baseline).length).toBeGreaterThan(100);
  });

  it("recipes.css is imported, so its classes are not dead weight", () => {
    expect(readFileSync("src/tokens/index.css", "utf8")).toContain(
      '"./recipes.css"',
    );
  });
});
