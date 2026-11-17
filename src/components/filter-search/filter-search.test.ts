import { describe, expect, it } from "vitest";
import {
  formatFilterToken,
  mergeFilterToken,
  parseFilterQuery,
  parseSince,
  removeFilterValue,
  spliceFilterQuery,
} from "./filter-input";
import { resolveFilterValue } from "./filter-search";
import { matchText, rankOptions, splitByRanges } from "./match";

describe("filter query grammar", () => {
  it("separates tokens, free text and the token under the caret", () => {
    const input = 'author:me,"Sam Lee" fix status:wor';
    const parsed = parseFilterQuery(input, input.length);
    expect(parsed.tokens).toEqual([
      { key: "author", values: ["me", "Sam Lee"], start: 0, end: 19 },
    ]);
    expect(parsed.text).toBe("fix");
    expect(parsed.active).toMatchObject({
      kind: "value",
      key: "status",
      partial: "wor",
    });
  });

  it("suggests a key while typing its prefix", () => {
    expect(parseFilterQuery("sta", 3).active).toMatchObject({
      kind: "key",
      prefix: "sta",
    });
    expect(parseFilterQuery("zzz", 3).active).toBeUndefined();
  });

  it("splices text and keeps a single space", () => {
    expect(spliceFilterQuery("a status:x b", 2, 10)).toEqual({
      text: "a b",
      caret: 2,
    });
    expect(spliceFilterQuery("sta", 0, 3, "status:")).toEqual({
      text: "status:",
      caret: 7,
    });
  });

  it("merges, removes and formats tokens", () => {
    const merged = mergeFilterToken([{ key: "repo", values: ["a/b"] }], {
      key: "repo",
      values: ["a/b", "c d"],
    });
    expect(merged).toEqual([{ key: "repo", values: ["a/b", "c d"] }]);
    expect(formatFilterToken(merged[0])).toBe('repo:a/b,"c d"');
    expect(removeFilterValue(merged, "repo", "a/b")).toEqual([
      { key: "repo", values: ["c d"] },
    ]);
    expect(removeFilterValue(merged, "repo")).toEqual([]);
  });

  it("parses since values", () => {
    const now = new Date(2026, 10, 17, 12);
    expect(parseSince("2w", now)?.getTime()).toBe(now.getTime() - 14 * 864e5);
    expect(parseSince("2026-11-01", now)?.getDate()).toBe(1);
    expect(parseSince("soon", now)).toBeUndefined();
  });
});

describe("matching", () => {
  it("ranks exact, prefix, word, substring and fuzzy hits", () => {
    expect(matchText("Working", "working")?.tier).toBe("exact");
    expect(matchText("Working", "wor")?.tier).toBe("prefix");
    expect(matchText("acme/web", "web")?.tier).toBe("word");
    expect(matchText("Checks pending", "ecks")?.tier).toBe("substring");
    expect(matchText("Checks pending", "cpd")?.tier).toBe("fuzzy");
    expect(splitByRanges("acme/web", [{ start: 5, end: 8 }])).toEqual([
      { text: "acme/", hit: false },
      { text: "web", hit: true },
    ]);
  });

  it("orders options by tier and drops excluded ids", () => {
    const options = [
      { id: "a", terms: ["Idle"] },
      { id: "b", terms: ["Waiting"] },
      { id: "c", terms: ["Wait"] },
    ];
    expect(rankOptions(options, "wait").map((r) => r.item.id)).toEqual([
      "c",
      "b",
    ]);
    expect(rankOptions(options, "", ["a"]).map((r) => r.item.id)).toEqual([
      "b",
      "c",
    ]);
  });

  it("resolves typed values", () => {
    const options = {
      author: [{ id: "user_1", label: "Sam Lee", terms: ["Sam Lee"] }],
      captain: [],
      repo: [],
      status: [
        { id: "working", label: "Working", terms: ["working", "Working"] },
      ],
      label: [],
      since: [],
    };
    expect(resolveFilterValue(options, "author", "me", "user_me")).toBe(
      "user_me",
    );
    expect(resolveFilterValue(options, "author", "sam")).toBe("user_1");
    expect(resolveFilterValue(options, "author", "@octo")).toBe("github:octo");
    expect(resolveFilterValue(options, "status", "work")).toBe("working");
    expect(resolveFilterValue(options, "status", "nope")).toBeUndefined();
    expect(resolveFilterValue(options, "repo", "acme/api")).toBe("acme/api");
  });
});
