import { afterEach, describe, expect, it } from "vitest";
import {
  FREQUENT_EMOJI_KEY,
  filterEmojiGroups,
  groupTitle,
  loadEmojiGroups,
  matchCustomEmoji,
  setFrequentEmoji,
  withFrequent,
} from "./emoji-data";

const groups = [
  {
    name: "Animals & Nature",
    emojis: [
      { emoji: "🐶", name: "dog face" },
      { emoji: "🐱", name: "cat face" },
    ],
  },
  { name: "Food & Drink", emojis: [{ emoji: "🍎", name: "red apple" }] },
];

afterEach(() => globalThis.localStorage?.clear());

describe("emoji data", () => {
  it("titles groups in sentence case", () => {
    expect(groupTitle("Smileys & Emotion")).toBe("Smileys & emotion");
  });

  it("filters by name and include, dropping empty groups", () => {
    expect(filterEmojiGroups(groups, "cat")).toEqual([
      { name: "Animals & Nature", emojis: [{ emoji: "🐱", name: "cat face" }] },
    ]);
    expect(filterEmojiGroups(groups, "", (emoji) => emoji === "🍎")).toEqual([
      groups[1],
    ]);
    expect(filterEmojiGroups(groups, "zzz")).toEqual([]);
  });

  it("matches workspace emoji by name or alias", () => {
    const custom = [{ name: "shipit", aliases: ["squirrel"], url: "u" }];
    expect(matchCustomEmoji(custom, "squ")).toEqual(custom);
    expect(matchCustomEmoji(custom, "")).toEqual(custom);
    expect(matchCustomEmoji(custom, "nope")).toEqual([]);
  });

  it("keeps the 21 most recent emoji, newest first, without repeats", () => {
    expect(withFrequent(["🐶", "🐱"], "🐱")).toEqual(["🐱", "🐶"]);
    const many = Array.from({ length: 21 }, (_, index) => String(index));
    expect(withFrequent(many, "x")).toHaveLength(21);
    expect(withFrequent(many, "x")[0]).toBe("x");
  });

  it("stores the frequent list under Capy's key", () => {
    setFrequentEmoji(["🐶"]);
    expect(globalThis.localStorage.getItem(FREQUENT_EMOJI_KEY)).toBe('["🐶"]');
  });

  it("loads Unicode's groups once", async () => {
    const loaded = await loadEmojiGroups();
    expect(loaded.map((group) => group.name)).toContain("Smileys & Emotion");
    expect(loaded[0]?.emojis[0]).toEqual({
      emoji: "😀",
      name: "grinning face",
    });
    expect(await loadEmojiGroups()).toBe(loaded);
  });
});
