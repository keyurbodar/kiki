import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { Schema } from "effect";
import { afterEach, describe, expect, it } from "vitest";
import { defaultIssueDisplay } from "@/components/issues-toolbar";
import {
  type IssueState,
  IssueState as IssueStateSchema,
  type IssueSummary,
  IssueSummary as IssueSummarySchema,
} from "@/data/api/schemas/issue";
import { IssuesList } from "./issues-list";

afterEach(cleanup);

const decodeState = Schema.decodeUnknownSync(IssueStateSchema);
const decodeIssue = Schema.decodeUnknownSync(IssueSummarySchema);

const todoState = decodeState({
  id: "state_todo",
  name: "Todo",
  type: "open",
  icon: "circlecheck",
  color: "green",
  position: 1,
  isDefault: true,
}) as IssueState;

const issue = (
  id: string,
  code: string,
  patch: { parentIssueId?: string | null; subIssueCount?: number } = {},
) =>
  decodeIssue({
    id,
    code,
    number: Number(code.split("-")[1]),
    projectId: "prj_1",
    title: `${code} title`,
    status: "todo",
    stateId: "state_todo",
    priority: "high",
    parentIssueId: patch.parentIssueId ?? null,
    visibility: "org",
    accessJamId: null,
    assignee: null,
    subIssueCount: patch.subIssueCount ?? 0,
    closedSubIssueCount: 1,
    viewer: {
      subscribed: false,
      unread: false,
      unreadSince: null,
      mentions: 0,
    },
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    closedAt: null,
  }) as IssueSummary;

const parent = issue("iss_parent", "AMA-12", { subIssueCount: 2 });
const child = issue("iss_child", "AMA-13", { parentIssueId: "iss_parent" });
const other = issue("iss_other", "AMA-20");

async function mount(
  issues: ReadonlyArray<IssueSummary>,
  subIssues: "expanded" | "collapsed" = "collapsed",
) {
  const rootRoute = createRootRoute({
    component: () => (
      <IssuesList
        orgId={"org_1" as never}
        issues={issues}
        states={[todoState]}
        filters={{ stateIds: [], stateNot: false, hideClosedSubIssues: false }}
        display={{ ...defaultIssueDisplay, subIssues }}
        projectNames={{}}
        now={new Date(2026, 10, 17).getTime()}
        emptyText="No issues"
      />
    ),
  });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ["/issues"] }),
  });
  await router.load();
  render(<RouterProvider router={router} />);
  return document.querySelector<HTMLElement>("[data-issue-row]");
}

const chip = (label: string) =>
  document.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`);

const codes = () =>
  [...document.querySelectorAll("[data-issue-code]")].map((row) =>
    row.getAttribute("data-issue-code"),
  );

describe("issue row sub-issues", () => {
  it("offers Capy's expand badge with a progress ring", async () => {
    await mount([parent, child, other]);
    const badge = chip("Expand 2 sub-issues");
    expect(badge).not.toBeNull();
    expect(badge?.getAttribute("aria-expanded")).toBe("false");
    expect(
      badge?.querySelector("[role='progressbar']")?.getAttribute("aria-label"),
    ).toBe("1 of 2 sub-issues closed");
  });

  it("reveals the sub-issue rows when the badge is pressed", async () => {
    await mount([parent, child, other]);
    expect(codes()).toEqual(["AMA-12", "AMA-20"]);
    const badge = chip("Expand 2 sub-issues");
    if (badge === null) throw new Error("no expand badge");
    fireEvent.click(badge);
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(chip("Collapse 2 sub-issues")?.getAttribute("aria-expanded")).toBe(
      "true",
    );
    expect(codes()).toEqual(["AMA-12", "AMA-13", "AMA-20"]);
  });

  it("folds the sub-issue row back under its parent", async () => {
    await mount([parent, child, other]);
    const badge = chip("Expand 2 sub-issues");
    if (badge === null) throw new Error("no expand badge");
    fireEvent.click(badge);
    await new Promise((resolve) => setTimeout(resolve, 60));
    const collapse = chip("Collapse 2 sub-issues");
    if (collapse === null) throw new Error("no collapse badge");
    fireEvent.click(collapse);
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(codes()).toEqual(["AMA-12", "AMA-20"]);
  });

  it("keeps a sub-issue row in place when the display mode expands them", async () => {
    await mount([parent, child, other], "expanded");
    const badge = chip("Expand 2 sub-issues");
    if (badge === null) throw new Error("no expand badge");
    fireEvent.click(badge);
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(codes()).toEqual(["AMA-12", "AMA-13", "AMA-20"]);
  });
});

describe("issue row controls", () => {
  it("names the status button the way Capy does, without a menu slot", async () => {
    await mount([parent]);
    const status = document.querySelector("[aria-label='Change status']");
    expect(status).not.toBeNull();
    expect(status?.getAttribute("data-slot")).toBeNull();
    expect(status?.getAttribute("aria-haspopup")).toBe("menu");
  });

  it("labels the priority icon", async () => {
    await mount([parent]);
    const priority = document.querySelector("[aria-label='High priority']");
    expect(priority).not.toBeNull();
    expect(priority?.getAttribute("data-slot")).toBe("tooltip-trigger");
  });
});
