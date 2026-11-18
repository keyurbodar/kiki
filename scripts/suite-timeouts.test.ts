import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getConfig } from "@testing-library/dom";
import { describe, expect, it } from "vitest";

const config = readFileSync(join(process.cwd(), "vitest.config.ts"), "utf8");

/**
 * The full suite fails a different set of tests on every loaded run when these
 * budgets sit at their defaults: a `waitFor` expires after 1s and a test after
 * 5s, both of which a busy machine blows past. Dropping them quietly brings
 * back moving reds that read like real defects.
 */
describe("the suite's load budget", () => {
  it("gives a test twenty seconds", () => {
    expect(config).toContain("testTimeout: 20_000");
  });

  it("loads the setup file that raises the waitFor budget", () => {
    expect(config).toContain('setupFiles: ["vitest.setup.ts"]');
    expect(
      readFileSync(join(process.cwd(), "vitest.setup.ts"), "utf8"),
    ).toContain("asyncUtilTimeout: 5_000");
  });

  it("gives a waitFor five seconds", () => {
    expect(getConfig().asyncUtilTimeout).toBe(5_000);
  });
});
