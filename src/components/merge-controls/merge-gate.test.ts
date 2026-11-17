import { describe, expect, it } from "vitest";
import {
  autoMergeBlocked,
  blockedOnGitHub,
  forceMergeBlocked,
  isRuleRefusal,
  joinBlockers,
  landingPulls,
  mergeFailureDescription,
  mergeGate,
  mergeMethods,
  type PullStack,
} from "./merge-gate";

const base = {
  open: true,
  draft: false,
  checksState: "pending",
  mergeableVerdict: "dirty",
  blockers: [],
};

describe("merge gates", () => {
  it("reports conflicts before checks", () => {
    expect(mergeGate(base)).toBe("Merge conflicts with the base branch");
    expect(autoMergeBlocked(base)).toBe("Merge conflicts with the base branch");
    expect(forceMergeBlocked(base)).toBe(
      "Merge conflicts with the base branch",
    );
  });

  it("allows clean merges and blocks drafts", () => {
    expect(
      mergeGate({ ...base, mergeableVerdict: "clean", checksState: "pending" }),
    ).toBeNull();
    expect(
      mergeGate({
        ...base,
        mergeableVerdict: "blocked",
        checksState: "pending",
      }),
    ).toBe("Waiting on checks");
    expect(
      mergeGate({
        ...base,
        mergeableVerdict: "blocked",
        checksState: "failed",
      }),
    ).toBe("Checks are failing");
    expect(
      autoMergeBlocked({
        ...base,
        mergeableVerdict: "clean",
        checksState: "passed",
      }),
    ).toBe("Can merge now");
    expect(mergeGate({ ...base, draft: true })).toBe(
      "Draft pull requests cannot merge",
    );
  });

  it("formats shared rule suffixes once", () => {
    const blockers = [
      "Required check A (ruleset “Main”)",
      "Required check B (ruleset “Main”)",
    ];
    expect(joinBlockers(blockers)).toBe(
      "Required check A and required check B (ruleset “Main”)",
    );
    expect(blockedOnGitHub(blockers)).toContain("Blocked on GitHub:");
    expect(isRuleRefusal("a rule requires review")).toBe(true);
    expect(mergeFailureDescription("A rule requires review.")).toBe(
      "A rule requires review, a stack cannot bypass checks",
    );
  });

  it("lists landed pulls top first and keeps method copy", () => {
    const stack: PullStack = {
      number: 10,
      position: 2,
      size: 3,
      baseRef: "main",
      members: [
        {
          id: "a",
          number: 10,
          title: "A",
          position: 1,
          state: "ready",
          headRef: "a",
        },
        {
          id: "b",
          number: 11,
          title: "B",
          position: 2,
          state: "ready",
          headRef: "b",
        },
        {
          id: "c",
          number: 12,
          title: "C",
          position: 3,
          state: "ready",
          headRef: "c",
        },
      ],
    };
    expect(landingPulls(stack).map((pull) => pull.number)).toEqual([11, 10]);
    expect(landingPulls(null)).toEqual([]);
    expect(mergeMethods.map((method) => method.method)).toEqual([
      "squash",
      "merge",
      "rebase",
    ]);
  });
});
