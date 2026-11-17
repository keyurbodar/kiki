import { describe, expect, it } from "vitest";
import {
  boostScore,
  filterByQuery,
  matchesQuery,
  matchFields,
  matchText,
  normalizeQuery,
} from "./fuzzy";

describe("normalizeQuery", () => {
  it("trims, lowercases and collapses whitespace", () => {
    expect(normalizeQuery("  Open   PR ")).toBe("open pr");
  });
});

describe("matchText", () => {
  it("ranks tiers exact > prefix > word > substring > fuzzy", () => {
    const exact = matchText("review", "review");
    const prefix = matchText("review queue", "rev");
    const word = matchText("open review", "rev");
    const substring = matchText("preview", "rev");
    const fuzzy = matchText("pull request", "pr");
    expect(exact?.tier).toBe("exact");
    expect(prefix?.tier).toBe("prefix");
    expect(word?.tier).toBe("word");
    expect(substring?.tier).toBe("substring");
    expect(fuzzy?.tier).toBe("fuzzy");
    const scores = [exact, prefix, word, substring, fuzzy].map(
      (m) => m?.score ?? 0,
    );
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
  });

  it("returns the matched range", () => {
    expect(matchText("open review", "rev")?.ranges).toEqual([
      { start: 5, end: 8 },
    ]);
  });

  it("matches camelCase boundaries as words", () => {
    expect(matchText("composerEditor", "edi")?.tier).toBe("word");
  });

  it("matches every word of a multi-word query", () => {
    const match = matchText("fix the login flow", "login fix");
    expect(match?.tier).toBe("word");
    expect(match?.ranges).toEqual([
      { start: 0, end: 3 },
      { start: 8, end: 13 },
    ]);
  });

  it("rejects empty input and misses", () => {
    expect(matchText("review", "")).toBeUndefined();
    expect(matchText("", "a")).toBeUndefined();
    expect(matchText("review", "xyz")).toBeUndefined();
  });
});

describe("matchFields", () => {
  it("halves the score of secondary fields", () => {
    const primary = matchFields(["review", "x"], "review");
    const secondary = matchFields(["x", "review"], "review");
    expect(secondary?.score).toBe(Math.round((primary?.score ?? 0) / 2));
    expect(secondary?.field).toBe(1);
  });

  it("ignores substring matches in secondary fields", () => {
    expect(matchFields(["x", "preview"], "rev")).toBeUndefined();
  });

  it("matches words spread across fields", () => {
    expect(
      matchFields(["Deploy", "staging server"], "deploy staging")?.field,
    ).toBe(1);
  });
});

describe("filterByQuery", () => {
  const items = ["preview", "review", "open review", "settings"];

  it("returns every item for an empty query", () => {
    expect(filterByQuery(items, (i) => [i], " ")).toEqual(items);
  });

  it("drops misses and sorts by score", () => {
    expect(filterByQuery(items, (i) => [i], "review")).toEqual([
      "review",
      "open review",
      "preview",
    ]);
  });
});

describe("matchesQuery and boostScore", () => {
  it("treats every field as primary", () => {
    expect(matchesQuery(["x", "preview"], "rev")).toBe(true);
    expect(matchesQuery(["x"], "")).toBe(true);
  });

  it("clamps the boost between 0 and 1", () => {
    expect(boostScore(100, 2)).toBe(190);
    expect(boostScore(100, -1)).toBe(100);
    expect(boostScore(100, 0.5)).toBe(145);
  });
});
