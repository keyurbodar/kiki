import { describe, expect, it } from "vitest";
import {
  allCollapsed,
  generatedPaths,
  initialCollapseState,
  isCollapsed,
  isGeneratedPath,
  setCollapsed,
  toggleAll,
} from "./collapse";

describe("collapse state", () => {
  const generated = new Set(["bun.lock"]);

  it("collapses generated files by default", () => {
    expect(isCollapsed(initialCollapseState, "bun.lock", generated)).toBe(true);
    expect(isCollapsed(initialCollapseState, "src/a.ts", generated)).toBe(
      false,
    );
  });

  it("lets an override win over the baseline", () => {
    const state = setCollapsed(initialCollapseState, "bun.lock", false);
    expect(isCollapsed(state, "bun.lock", generated)).toBe(false);
    expect(initialCollapseState.overrides.size).toBe(0);
  });

  it("toggles every file and clears overrides", () => {
    const paths = ["src/a.ts", "bun.lock"];
    expect(allCollapsed(initialCollapseState, paths, generated)).toBe(false);
    const collapsed = toggleAll(false);
    expect(allCollapsed(collapsed, paths, generated)).toBe(true);
    expect(toggleAll(true)).toEqual({
      baseline: "expanded",
      overrides: new Map(),
    });
    expect(allCollapsed(collapsed, [], generated)).toBe(false);
  });

  it("detects generated paths", () => {
    expect(isGeneratedPath("web/package-lock.json")).toBe(true);
    expect(isGeneratedPath("src/routeTree.gen.ts")).toBe(true);
    expect(isGeneratedPath("src/app.ts")).toBe(false);
    expect([
      ...generatedPaths([{ path: "bun.lock" }, { path: "a.ts" }]),
    ]).toEqual(["bun.lock"]);
  });
});
