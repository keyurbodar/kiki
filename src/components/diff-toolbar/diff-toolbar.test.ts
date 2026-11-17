import { describe, expect, it } from "vitest";
import { diffFilesCount, dimmedDiffPaths } from "./diff-toolbar";

const none = { database: false, tests: false, generated: false };
const files = [
  { path: "src/cart/cart.ts" },
  { path: "src/cart/cart.test.ts" },
  { path: "tests/e2e/checkout.ts" },
  { path: "pnpm-lock.yaml" },
];

describe("diffFilesCount", () => {
  it("returns the total when nothing is hidden", () => {
    expect(diffFilesCount(files, none)).toBe(4);
  });

  it("splits shown and hidden files", () => {
    expect(diffFilesCount(files, { ...none, tests: true })).toBe(
      "2 · 2 hidden",
    );
  });

  it("prefers an explicit category over the path", () => {
    expect(
      diffFilesCount([{ path: "src/a.ts", category: "generated" }], {
        ...none,
        generated: true,
      }),
    ).toBe("0 · 1 hidden");
  });
});

describe("dimmedDiffPaths", () => {
  it("dims hidden files and folders that only hold hidden files", () => {
    const dimmed = dimmedDiffPaths(files, { ...none, tests: true });
    expect(dimmed.has("src/cart/cart.test.ts")).toBe(true);
    expect(dimmed.has("tests")).toBe(true);
    expect(dimmed.has("tests/e2e")).toBe(true);
    expect(dimmed.has("src/cart")).toBe(false);
    expect(dimmed.has("src/cart/cart.ts")).toBe(false);
  });
});
