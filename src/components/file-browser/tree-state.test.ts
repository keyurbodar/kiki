import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  parseCollapsedPaths,
  parseRecentCollapsed,
  recentCollapsedStorageKey,
  treeStorageKey,
  useRecentCollapsed,
  useTreeCollapsed,
} from "./tree-state";

afterEach(() => globalThis.localStorage.clear());

describe("parsers", () => {
  it("reads sorted string arrays and rejects anything else", () => {
    expect(parseCollapsedPaths('["b","a"]')).toEqual(["a", "b"]);
    expect(parseCollapsedPaths("[1]")).toEqual([]);
    expect(parseCollapsedPaths("nope")).toEqual([]);
    expect(parseCollapsedPaths(null)).toEqual([]);
  });

  it("reads the recent shelf flag", () => {
    expect(parseRecentCollapsed("true")).toBe(true);
    expect(parseRecentCollapsed("false")).toBe(false);
    expect(parseRecentCollapsed("{")).toBe(false);
  });
});

describe("useTreeCollapsed", () => {
  it("persists per user and location", () => {
    const { result } = renderHook(() => useTreeCollapsed("loc", "user-1"));
    act(() => result.current.onCollapsedChange(["z", "a"]));
    expect(result.current.collapsed).toEqual(["a", "z"]);
    expect(
      globalThis.localStorage.getItem(treeStorageKey("user-1", "loc")),
    ).toBe('["a","z"]');
  });

  it("keeps state in memory only without a user", () => {
    const { result } = renderHook(() => useTreeCollapsed("loc", undefined));
    act(() => result.current.onCollapsedChange(["a"]));
    expect(result.current.collapsed).toEqual([]);
  });
});

describe("useRecentCollapsed", () => {
  it("persists the flag", () => {
    const { result } = renderHook(() => useRecentCollapsed());
    act(() => result.current.onCollapsedChange(true));
    expect(result.current.collapsed).toBe(true);
    expect(globalThis.localStorage.getItem(recentCollapsedStorageKey)).toBe(
      "true",
    );
  });
});
