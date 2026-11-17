import { describe, expect, it } from "vitest";
import {
  activityItemKey,
  buildActivityItems,
  capyRoundTitle,
  commitLine,
  matchesActivityFilter,
  roundFailureText,
  toActivityData,
  toCapyReview,
} from "./activity-model";

const at = (minute: number) => new Date(Date.UTC(2026, 0, 1, 0, minute));

const activity = toActivityData({
  commits: [
    {
      sha: "e4f4dd5aa",
      message: "models: a role\n\nbody",
      authorLogin: "alex-sample",
      committedAt: at(5).toISOString(),
    },
  ],
  comments: [
    {
      id: "c1",
      author: "helper[bot]",
      bodyMd: "Looks fine",
      createdAt: at(8).toISOString(),
    },
    {
      id: "c2",
      authorLogin: "priya-sample",
      body: "Inline",
      path: "src/a.ts",
      githubReviewId: "r1",
      createdAt: at(9).toISOString(),
    },
  ],
  reviews: [
    {
      id: "r1",
      githubReviewId: "r1",
      authorLogin: "priya-sample",
      state: "APPROVED",
      submittedAt: at(10).toISOString(),
    },
  ],
});

const review = toCapyReview({
  rounds: [
    {
      requestId: "q1",
      headSha: "abc1234",
      status: "completed",
      createdAt: at(11).toISOString(),
      settledAt: at(12).toISOString(),
      title: null,
    },
  ],
  findings: [
    {
      id: "f1",
      requestId: "q1",
      status: "open",
      kind: "issue",
      severity: "high",
      summary: "Retry cap is off by one",
      detail: "The second attempt still throws.",
      file: "src/checkout/retry.ts",
      startLine: 24,
    },
    { id: "f2", requestId: "q1", status: "irrelevant" },
  ],
});

const pull = { createdAt: at(0), mergedAt: at(20), closedAt: at(20) };

describe("buildActivityItems", () => {
  const items = buildActivityItems(pull, activity, review);

  it("orders every kind by time and ends with the terminal row", () => {
    expect(items.map(activityItemKey)).toEqual([
      "opened",
      "commit:e4f4dd5aa",
      "comment:c1",
      "gh-review:r1",
      "capy-round:q1",
      "terminal:Merged",
    ]);
  });

  it("attaches inline threads to their review", () => {
    const reviewItem = items.find((item) => item.kind === "gh-review");
    expect(
      reviewItem?.kind === "gh-review" &&
        reviewItem.threads.map((thread) => thread.root.id),
    ).toEqual(["c2"]);
    expect(reviewItem?.kind === "gh-review" && reviewItem.review.state).toBe(
      "approved",
    );
  });

  it("filters by tab", () => {
    const keys = (filter: "all" | "comments" | "bots") =>
      items
        .filter((item) => matchesActivityFilter(item, filter))
        .map(activityItemKey);
    expect(keys("comments")).toEqual(["gh-review:r1"]);
    expect(keys("bots")).toEqual(["comment:c1", "capy-round:q1"]);
  });

  it("falls back to opened and closed rows without activity", () => {
    const rows = buildActivityItems(
      { createdAt: at(0), mergedAt: null, closedAt: at(3) },
      undefined,
      null,
    );
    expect(rows.map(activityItemKey)).toEqual(["opened", "terminal:Closed"]);
  });
});

describe("toCapyReview", () => {
  it("keeps the finding and round fields the UI renders", () => {
    const [finding, irrelevant] = review.findings;
    expect(finding).toMatchObject({
      severity: "high",
      title: "Retry cap is off by one",
      body: "The second attempt still throws.",
      path: "src/checkout/retry.ts",
      line: 24,
    });
    expect(irrelevant).toMatchObject({
      status: "irrelevant",
      title: "",
      body: "",
      path: null,
      line: null,
      severity: null,
    });
    expect(review.rounds[0]).toMatchObject({ headSha: "abc1234" });
    expect(review.threadId).toBeNull();
    expect(review.reviewedHeadSha).toBeNull();
  });
});

describe("copy helpers", () => {
  it("formats commit and review lines", () => {
    const [commit] = activity.commits;
    expect(commit && commitLine(commit)).toBe(
      "alex-sample committed e4f4dd5 models: a role",
    );
    const [round] = review.rounds;
    expect(round && capyRoundTitle(round, 1, 1)).toBe(
      "Capy Review found 2 issues",
    );
    expect(round && capyRoundTitle(round, 0, 0)).toBe("Capy Review approved");
    expect(
      round &&
        roundFailureText({
          ...round,
          status: "failed",
          failureMessage: "This organization is out of credits",
        }),
    ).toBe("Review failed: This organization is out of credits");
  });
});
