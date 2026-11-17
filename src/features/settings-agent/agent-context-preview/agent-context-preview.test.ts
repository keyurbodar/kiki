import { describe, expect, it } from "vitest";
import { groupParts } from "./agent-context-preview";
import { formatTokens, tokensOf, windowShare } from "./tokens";

describe("formatTokens", () => {
  it("matches Capy's compact counts", () => {
    expect(formatTokens(950)).toBe("950");
    expect(formatTokens(1_234)).toBe("1.2k");
    expect(formatTokens(2_000)).toBe("2k");
    expect(formatTokens(25_400)).toBe("25k");
    expect(formatTokens(1_000_000)).toBe("1M");
    expect(formatTokens(1_250_000)).toBe("1.3M");
  });

  it("estimates four characters per token and the window share", () => {
    expect(tokensOf(10_000)).toBe(2_500);
    expect(windowShare(2_500, 1_000_000)).toBeCloseTo(0.25);
    expect(windowShare(1, 0)).toBe(0);
  });
});

describe("groupParts", () => {
  const part = (
    kind: Parameters<typeof groupParts>[0][number]["kind"],
    chars: number,
    deferred?: boolean,
  ) => ({
    kind,
    label: kind,
    file: "AGENTS.md",
    chars,
    loaded: chars,
    deferred,
  });

  it("drops empty files but keeps the skills line", () => {
    const { shown } = groupParts([part("org", 0), part("skills", 0)]);
    expect(shown.map((p) => p.kind)).toEqual(["skills"]);
  });

  it("orders instructions, deferred repos and the rest", () => {
    const groups = groupParts([
      part("user", 10),
      part("repo", 5, true),
      part("project", 3),
      part("repo", 4),
      part("skills", 8),
    ]);
    expect(groups.loaded.map((p) => p.kind)).toEqual(["project", "repo"]);
    expect(groups.deferred).toHaveLength(1);
    expect(groups.rest.map((p) => p.kind)).toEqual(["user", "skills"]);
  });
});
