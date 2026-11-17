import { describe, expect, it } from "vitest";
import {
  latestReviews,
  readReviewerOptions,
  reviewerGroups,
  reviewerMatches,
  reviewerSummary,
  reviewerToggle,
} from "./reviewers";

const reviewer = (login: string) => ({ login, name: login, avatarUrl: null });

describe("reviewer menus", () => {
  it("groups current, suggested and other reviewers", () => {
    const reviews = [
      {
        reviewer: "past",
        state: "approved",
        submittedAt: new Date(2),
        authorAvatarUrl: null,
      },
    ];
    const groups = reviewerGroups(
      [reviewer("current")],
      {
        requested: [],
        suggested: [reviewer("suggested")],
        collaborators: [reviewer("other"), reviewer("author")],
      },
      latestReviews(reviews),
      "author",
    );
    expect(groups.map((group) => group.value)).toEqual([
      "current",
      "suggested",
      "other",
    ]);
    expect(groups[0]?.items[0]?.reviewer.login).toBe("current");
    expect(groups[0]?.items[1]?.word).toBe("Approved");
    expect(groups[2]?.items.map((row) => row.reviewer.login)).toEqual([
      "other",
    ]);
  });

  it("filters rows and finds the one toggled reviewer", () => {
    const row = { reviewer: reviewer("alex"), word: null, rerequest: false };
    expect(reviewerMatches(row, "ALEX")).toBe(true);
    expect(reviewerMatches(row, "sam")).toBe(false);
    expect(
      reviewerToggle([row, { ...row, reviewer: reviewer("sam") }], [row]),
    ).toEqual({ login: "sam", requested: true });
    expect(reviewerToggle([], [row])).toEqual({
      login: "alex",
      requested: false,
    });
  });

  it("reads options from a structured response", () => {
    const options = readReviewerOptions({
      requested: [{ login: "a" }],
      suggested: [],
      collaborators: [],
    });
    expect(options.requested[0]?.login).toBe("a");
  });

  it("summarises requested users, teams and past reviewers", () => {
    const summary = reviewerSummary(
      [
        { kind: "user", login: "a", avatarUrl: null },
        { kind: "team", login: "team", avatarUrl: null },
      ],
      null,
      new Map([
        [
          "past",
          {
            reviewer: "past",
            state: "approved",
            submittedAt: new Date(),
            authorAvatarUrl: null,
          },
        ],
      ]),
    );
    expect(summary.map((row) => row.login)).toEqual(["a", "team", "past"]);
  });
});
