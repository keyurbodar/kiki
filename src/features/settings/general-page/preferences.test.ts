import { describe, expect, it } from "vitest";
import {
  defaultInputPrefs,
  isBoolean,
  isDesktopHandoff,
  isInputPrefs,
  isLinkTarget,
  isPreviewLinkTarget,
  isSearchEngine,
} from "./preferences";

describe("input preferences", () => {
  it("accepts the shipped defaults", () => {
    expect(isInputPrefs(defaultInputPrefs)).toBe(true);
  });

  it("rejects partial or unknown values", () => {
    expect(isInputPrefs({ ...defaultInputPrefs, altEnter: "nope" })).toBe(
      false,
    );
    expect(isInputPrefs({ enter: "steer" })).toBe(false);
    expect(isInputPrefs(null)).toBe(false);
  });
});

describe("stored value guards", () => {
  it("keeps desktop-handoff, link target, preview target and search engine values", () => {
    expect(isDesktopHandoff("ask")).toBe(true);
    expect(isDesktopHandoff("sometimes")).toBe(false);
    expect(isLinkTarget("capy")).toBe(true);
    expect(isLinkTarget("Capy")).toBe(false);
    expect(isPreviewLinkTarget("pane")).toBe(true);
    expect(isPreviewLinkTarget("tab")).toBe(false);
    expect(isSearchEngine("duckduckgo")).toBe(true);
    expect(isSearchEngine("")).toBe(false);
  });

  it("narrows booleans only", () => {
    expect(isBoolean(true)).toBe(true);
    expect(isBoolean("true")).toBe(false);
    expect(isBoolean(1)).toBe(false);
  });
});
