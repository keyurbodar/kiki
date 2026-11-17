import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  type CapyReview,
  defaultTierLabel,
  findingsAsText,
  partitionFindings,
  type ReviewFinding,
  ReviewSection,
  reviewedHead,
  reviewStatus,
  runLabel,
} from ".";

afterEach(cleanup);

const finding = (
  id: string,
  overrides: Partial<ReviewFinding> = {},
): ReviewFinding => ({
  id,
  status: "open",
  kind: "issue",
  severity: "low",
  title: `Finding ${id}`,
  body: "Details",
  path: "src/app.ts",
  line: 4,
  ...overrides,
});

const round = (
  status: CapyReview["rounds"][number]["status"],
  extra: Partial<CapyReview["rounds"][number]> = {},
) => ({
  status,
  headSha: "abc",
  title: null,
  failureMessage: null,
  failureReason: null,
  ...extra,
});

const pull = {
  id: "pr_sample_1",
  state: "merged",
  author: "alex",
  headSha: "abc",
} as const;

describe("reviewStatus", () => {
  it("covers running, idle, failed and complete", () => {
    expect(reviewStatus(true, undefined, 0, 0).text).toBe(
      "Reviewing the latest changes",
    );
    expect(reviewStatus(false, undefined, 0, 0).text).toBe("Not reviewed yet");
    expect(
      reviewStatus(false, round("failed", { failureReason: "timeout" }), 0, 0)
        .text,
    ).toBe("Review failed: timeout");
    expect(
      reviewStatus(
        false,
        round("failed", {
          failureMessage: "Out of credits",
          failureReason: "x",
        }),
        0,
        0,
      ).text,
    ).toBe("Review failed: Out of credits");
    expect(reviewStatus(false, round("failed"), 0, 0).text).toBe(
      "Review failed",
    );
    expect(reviewStatus(false, round("completed"), 0, 0)).toEqual({
      kind: "complete",
      text: "No issues found",
      meta: "",
    });
    expect(reviewStatus(false, round("completed"), 2, 1)).toEqual({
      kind: "complete",
      text: "Review complete",
      meta: "2 open · 1 resolved",
    });
  });
});

describe("partitionFindings", () => {
  const findings = [
    ...Array.from({ length: 6 }, (_, index) => finding(`o${index}`)),
    finding("high", { severity: "high" }),
    finding("done", { status: "resolved" }),
  ];

  it("sorts open findings by severity and hides past five", () => {
    const result = partitionFindings(findings, false);
    expect(result.open[0]?.id).toBe("high");
    expect(result.shown).toHaveLength(5);
    expect(result.hidden).toBe(3);
  });

  it("shows everything when expanded", () => {
    expect(partitionFindings(findings, true).shown).toHaveLength(8);
  });

  it("is copyable only with an open issue", () => {
    expect(
      partitionFindings([finding("n", { kind: "note" })], false).copyable,
    ).toBe(false);
  });
});

describe("labels", () => {
  it("names the run button and default tier", () => {
    expect(runLabel(true, false)).toBe("Reviewing");
    expect(runLabel(false, true)).toBe("Rerun Capy review");
    expect(runLabel(false, false)).toBe("Run Capy review");
    expect(defaultTierLabel(undefined)).toBe("Organization default");
    expect(defaultTierLabel(null)).toBe("Organization default · Custom");
    expect(defaultTierLabel("high")).toBe("Organization default · High");
  });

  it("formats findings for copying", () => {
    expect(findingsAsText([finding("a"), finding("b", { kind: "note" })])).toBe(
      "1. Finding a (src/app.ts:4)\nDetails",
    );
  });

  it("knows when the head was reviewed", () => {
    const review = {
      threadId: null,
      reviewedHeadSha: "abc",
      rounds: [round("completed")],
      findings: [],
    };
    expect(reviewedHead(review, "abc")).toBe(true);
    expect(reviewedHead(review, "def")).toBe(false);
    expect(reviewedHead(null, "abc")).toBe(false);
  });
});

describe("ReviewSection", () => {
  const failed: CapyReview = {
    threadId: "jam_sample",
    reviewedHeadSha: null,
    rounds: [
      round("failed", {
        failureMessage:
          "This organization is out of credits. Add credits to continue.",
      }),
    ],
    findings: [],
  };

  it("shows a failed review without a run control on a merged pull", () => {
    render(<ReviewSection pull={pull} review={failed} onRun={vi.fn()} />);
    expect(
      screen.getByText(
        "Review failed: This organization is out of credits. Add credits to continue.",
      ),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "View review chat" }),
    ).toBeTruthy();
    expect(screen.queryByText("Run Capy review")).toBeNull();
  });

  it("runs a review on an open pull", async () => {
    const onRun = vi.fn(() => Promise.resolve());
    render(
      <ReviewSection
        pull={{ ...pull, state: "open" }}
        review={null}
        orgId="org_sample"
        effectiveTier="medium"
        onRun={onRun}
      />,
    );
    expect(screen.getByText("Not reviewed yet")).toBeTruthy();
    expect(screen.getByText("Organization default · Medium")).toBeTruthy();
    fireEvent.click(screen.getByText("Run Capy review"));
    expect(onRun).toHaveBeenCalledWith({
      forceRefresh: false,
      tier: undefined,
    });
  });

  it("collapses to a counts summary", () => {
    render(
      <ReviewSection
        pull={pull}
        review={{
          ...failed,
          rounds: [round("completed")],
          findings: [finding("a"), finding("b", { status: "resolved" })],
        }}
        onRun={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText("Capy Review"));
    expect(screen.getAllByText("1 open · 1 resolved")).toHaveLength(2);
  });
});
