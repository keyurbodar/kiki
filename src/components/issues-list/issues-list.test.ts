import { Schema } from "effect";
import { describe, expect, it } from "vitest";
import type { IssueState, IssueSummary } from "@/data/api/schemas/issue";
import {
  IssueState as IssueStateSchema,
  IssueSummary as IssueSummarySchema,
} from "@/data/api/schemas/issue";
import { visibleIssues } from "./issues-list";

const decodeIssue = Schema.decodeUnknownSync(IssueSummarySchema);
const decodeState = Schema.decodeUnknownSync(IssueStateSchema);

const state = (id: string, type: "open" | "closed", position: number) =>
  decodeState({
    id,
    name: id,
    type,
    icon: "circlecheck",
    color: "green",
    position,
    isDefault: false,
  }) as IssueState;

const issue = (
  id: string,
  stateId: string,
  parentIssueId: string | null = null,
) =>
  decodeIssue({
    id,
    code: id.toUpperCase(),
    number: 1,
    projectId: "prj_1",
    title: id,
    status: "todo",
    stateId,
    priority: "normal",
    parentIssueId,
    visibility: "org",
    accessJamId: null,
    assignee: null,
    subIssueCount: 0,
    closedSubIssueCount: 0,
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

const states = [state("open", "open", 1), state("closed", "closed", 2)];
const display = { order: "priority", direction: "asc" } as const;
const filters = { stateIds: [], stateNot: false, hideClosedSubIssues: false };

const parent = issue("parent", "open");
const child = issue("child", "open", "parent");
const orphan = issue("orphan", "open", "missing");

describe("visibleIssues", () => {
  it("keeps children when sub-issues are expanded", () => {
    expect(
      visibleIssues(
        [parent, child],
        filters,
        { ...display, subIssues: "expanded" },
        states,
      ).map((row) => row.id),
    ).toEqual(["parent", "child"]);
  });

  it("folds a child under its parent when sub-issues are collapsed", () => {
    expect(
      visibleIssues(
        [parent, child],
        filters,
        { ...display, subIssues: "collapsed" },
        states,
      ).map((row) => row.id),
    ).toEqual(["parent"]);
  });

  it("keeps a child whose parent is not in the list", () => {
    expect(
      visibleIssues(
        [orphan],
        filters,
        { ...display, subIssues: "collapsed" },
        states,
      ).map((row) => row.id),
    ).toEqual(["orphan"]);
  });

  it("drops closed sub-issues when that filter is on", () => {
    const closedChild = issue("closedChild", "closed", "parent");
    expect(
      visibleIssues(
        [parent, closedChild],
        { ...filters, hideClosedSubIssues: true },
        { ...display, subIssues: "expanded" },
        states,
      ).map((row) => row.id),
    ).toEqual(["parent"]);
  });

  it("renders a closed-only result set", () => {
    const closed = issue("closed", "closed");
    expect(
      visibleIssues(
        [closed],
        { ...filters, stateIds: ["closed"], stateNot: false },
        { ...display, subIssues: "expanded" },
        states,
      ).map((row) => row.id),
    ).toEqual(["closed"]);
  });
});
