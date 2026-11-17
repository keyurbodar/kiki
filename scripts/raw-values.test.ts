import { describe, expect, it } from "vitest";
import { findRawValues, isGuarded } from "./raw-values";

describe("findRawValues", () => {
  it("flags raw colours, lengths and durations", () => {
    const hits = findRawValues(
      'const a = "#21a388"; const b = "w-[24px] duration-[120ms]"; const c = "oklch(50% 0 0)"; const d = ".3s";',
    );
    expect(hits.map((h) => h.rule)).toEqual([
      "hex colour",
      "colour function",
      "px length",
      "duration",
      "duration",
    ]);
  });

  it("allows token references", () => {
    expect(
      findRawValues(
        'className="size-(--icon-base) duration-(--duration-fast) bg-card" href={url + "#" + id}',
      ),
    ).toEqual([]);
  });
});

describe("isGuarded", () => {
  it("skips the token layer, tests and generated routes", () => {
    expect(isGuarded("src/tokens/primitives.css")).toBe(false);
    expect(isGuarded("src/routeTree.gen.ts")).toBe(false);
    expect(isGuarded("src/lib/x.test.ts")).toBe(false);
    expect(isGuarded("src/features/thread/view.tsx")).toBe(true);
    expect(isGuarded("src/styles.css")).toBe(true);
  });
});
