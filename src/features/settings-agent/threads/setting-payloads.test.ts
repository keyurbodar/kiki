import { describe, expect, it } from "vitest";
import {
  patchGithubPreferences,
  patchGitPreferences,
  patchSigningPreferences,
  patchTaskLimits,
  taskLimitsPayload,
} from "./setting-payloads";

const base = {
  github: { humanMode: "off" as const, prBadge: true },
  tasks: { concurrent: 5, nestedDepth: 2 },
  git: { commitAuthor: "capy" as const, commitEmail: "a@example.com" },
  gitSigning: { signCommits: true },
  archiveIdleAfterDays: 30,
};

describe("setting payloads", () => {
  it("preserves sibling Git preferences", () => {
    expect(patchGitPreferences(base, { branchPrefix: "team" })).toEqual({
      commitAuthor: "capy",
      commitEmail: "a@example.com",
      branchPrefix: "team",
    });
  });

  it("preserves personal GitHub overrides when changing one", () => {
    expect(patchGithubPreferences(base, "prDraftDefault", true)).toEqual({
      humanMode: "off",
      prBadge: true,
      prDraftDefault: true,
    });
  });

  it("preserves task limits", () => {
    expect(patchTaskLimits(base, "nestedDepth", 4)).toEqual({
      concurrent: 5,
      nestedDepth: 4,
    });
  });

  it("sends both org limits with Capy's field names and defaults", () => {
    expect(
      taskLimitsPayload(
        "concurrent",
        12,
        { nestedDepth: 4 },
        { concurrent: 8, nestedDepth: 3 },
      ),
    ).toEqual({
      concurrent: 12,
      nested: 4,
    });
    expect(
      taskLimitsPayload(
        "nestedDepth",
        undefined,
        { concurrent: 10 },
        { concurrent: 8, nestedDepth: 3 },
      ),
    ).toEqual({
      concurrent: 10,
      nested: 3,
    });
  });

  it("preserves the signing object", () => {
    expect(patchSigningPreferences(base, false)).toEqual({
      signCommits: false,
    });
  });
});
