import { describe, expect, it } from "vitest";
import {
  maxRecentIcons,
  projectEmojis,
  projectIcons,
  randomEmoji,
  randomIcon,
  recentIcons,
} from "./icons";

describe("project icon picker", () => {
  it("keeps the chosen icon at the front of the recent list", () => {
    expect(recentIcons("star", ["folder-open", "globe"])).toEqual([
      "star",
      "folder-open",
      "globe",
    ]);
  });

  it("does not duplicate an icon already in the list", () => {
    expect(recentIcons("globe", ["star", "globe"])).toEqual(["star", "globe"]);
  });

  it("caps the recent list", () => {
    const history = Array.from({ length: 30 }, (_, index) => `icon-${index}`);
    expect(recentIcons("new", history)).toHaveLength(maxRecentIcons);
  });

  it("picks deterministic icons and emojis from a source", () => {
    expect(randomIcon(projectIcons, () => 0)).toBe(projectIcons[0]);
    expect(randomIcon(projectIcons, () => 0.999)).toBe(
      projectIcons[projectIcons.length - 1],
    );
    expect(randomEmoji(projectEmojis, () => 0)).toBe(projectEmojis[0]);
  });
});
