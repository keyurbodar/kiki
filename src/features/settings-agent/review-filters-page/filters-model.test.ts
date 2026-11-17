import { describe, expect, it } from "vitest";
import {
  blankCondition,
  conditionsValid,
  describeRule,
  draftConditions,
  operatorLabel,
  patternsValid,
  rulePayload,
  sourceLabel,
  splitValues,
} from "./filters-model";

const repositories = [
  { githubRepoId: 1, repo: "acme/web" },
  { githubRepoId: 2, repo: "acme/api" },
];

describe("review filters model", () => {
  it("words operators per field", () => {
    expect(operatorLabel("title_or_body", false)).toBe("contains any of");
    expect(operatorLabel("title_or_body", true)).toBe("doesn't contain any of");
    expect(operatorLabel("label", true)).toBe("is not any of");
  });

  it("describes a rule with its repository condition last", () => {
    expect(
      describeRule(
        {
          conditions: [
            { field: "label", not: false, values: ["wip", "skip-review"] },
          ],
          repositoryCondition: { not: true, repoIds: [2, 9] },
        },
        repositories,
      ),
    ).toBe(
      "Label is any of wip, skip-review, and Repository is not any of acme/api, Repository 9 unavailable",
    );
  });

  it("names the source", () => {
    expect(sourceLabel({ source: "greptile", createdByName: "Sam" })).toBe(
      "greptile.json",
    );
    expect(sourceLabel({ source: "hand", createdByName: null })).toBe("Manual");
    expect(sourceLabel({ source: "hand", createdByName: "Sam Rivera" })).toBe(
      "Sam Rivera",
    );
  });

  it("splits comma-separated values", () => {
    expect(splitValues(" a, ,b ,c,")).toEqual(["a", "b", "c"]);
  });

  it("starts the editor with one blank condition", () => {
    expect(
      draftConditions({ conditions: [], repositoryCondition: null }),
    ).toEqual([blankCondition()]);
    expect(
      draftConditions({
        conditions: [{ field: "author", not: true, values: ["bot", "ci"] }],
      }),
    ).toEqual([{ field: "author", not: true, values: "bot, ci" }]);
  });

  it("validates conditions", () => {
    expect(conditionsValid([blankCondition()], repositories)).toBe(false);
    expect(
      conditionsValid(
        [{ field: "label", not: false, values: "wip" }],
        repositories,
      ),
    ).toBe(true);
    expect(
      conditionsValid(
        [
          { field: "repository", not: false, values: "1" },
          { field: "repository", not: false, values: "2" },
        ],
        repositories,
      ),
    ).toBe(false);
    expect(
      conditionsValid(
        [{ field: "repository", not: false, values: "7" }],
        repositories,
      ),
    ).toBe(false);
  });

  it("builds the rule payload", () => {
    const drafts = [
      { field: "label" as const, not: false, values: "wip" },
      { field: "repository" as const, not: true, values: "1, 2" },
    ];
    expect(rulePayload("acme/web", drafts, true)).toEqual({
      repo: "acme/web",
      conditions: [{ field: "label", not: false, values: ["wip"] }],
      repositoryCondition: { not: true, repoIds: [1, 2] },
    });
    expect(
      rulePayload(null, drafts, false).repositoryCondition,
    ).toBeUndefined();
    expect(
      rulePayload(null, drafts.slice(0, 1), true).repositoryCondition,
    ).toBeNull();
  });

  it("validates ignore patterns", () => {
    expect(patternsValid([])).toBe(false);
    expect(patternsValid(["dist/**"])).toBe(true);
    expect(patternsValid(Array.from({ length: 51 }, () => "x"))).toBe(false);
  });
});
