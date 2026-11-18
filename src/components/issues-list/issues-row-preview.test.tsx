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
import { IssueRow } from "./issues-list";

afterEach(cleanup);

const state = Schema.decodeUnknownSync(IssueStateSchema)({
  id: "state_todo",
  name: "Todo",
  type: "open",
  icon: "circlecheck",
  color: "green",
  position: 1,
  isDefault: true,
}) as IssueState;

const issue = Schema.decodeUnknownSync(IssueSummarySchema)({
  id: "iss_1",
  code: "AMA-99",
  number: 99,
  projectId: "prj_1",
  title: "Two device lists",
  status: "todo",
  stateId: "state_todo",
  priority: "high",
  parentIssueId: null,
  visibility: "org",
  accessJamId: null,
  assignee: null,
  subIssueCount: 0,
  closedSubIssueCount: 0,
  viewer: { subscribed: false, unread: false, unreadSince: null, mentions: 0 },
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  closedAt: null,
}) as IssueSummary;

async function mount() {
  const rootRoute = createRootRoute({
    component: () => (
      <IssueRow
        issue={issue}
        orgId={"org_1" as never}
        state={state}
        display={defaultIssueDisplay}
        now={new Date(2026, 10, 17).getTime()}
      />
    ),
  });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ["/issues"] }),
  });
  await router.load();
  render(<RouterProvider router={router} />);
}

const card = () => document.querySelector("[data-slot='preview-card-content']");

describe("issue row preview card", () => {
  it("opens Capy's issue hover card with the issue's state, code and priority", async () => {
    await mount();
    expect(card()).toBeNull();
    const row = document.querySelector("[data-issue-row]");
    if (row === null) throw new Error("no row");
    fireEvent.focus(row);
    await new Promise((resolve) => setTimeout(resolve, 420));
    const content = card();
    expect(content).not.toBeNull();
    const text = content?.textContent ?? "";
    expect(text).toContain("AMA-99");
    expect(text).toContain("Todo");
    expect(text).toContain("High");
  });
});
