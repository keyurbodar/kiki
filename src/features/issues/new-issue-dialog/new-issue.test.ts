import { describe, expect, it } from "vitest";
import type {
  IssueLabelId,
  IssueStateId,
  ProjectId,
} from "@/data/api/schemas/ids";
import type {
  IssueAssigneeInput,
  IssueDueDate,
  IssueState,
} from "@/data/api/schemas/issue";
import {
  accessLabel,
  canCreateIssue,
  createIssueRequest,
  defaultIssueState,
  emptyNewIssueDraft,
  localToday,
} from "./new-issue";

const projectId = "prj_sample" as ProjectId;
const day = (value: string) => value as IssueDueDate;

describe("canCreateIssue", () => {
  it("needs a project and a non-blank title, and nothing in flight", () => {
    const draft = { ...emptyNewIssueDraft(projectId), title: "  Fix login " };
    expect(canCreateIssue(draft, false)).toBe(true);
    expect(canCreateIssue(draft, true)).toBe(false);
    expect(canCreateIssue({ ...draft, title: "   " }, false)).toBe(false);
    expect(canCreateIssue({ ...draft, projectId: undefined }, false)).toBe(
      false,
    );
  });
});

describe("createIssueRequest", () => {
  it("trims the text and maps shared access to org visibility", () => {
    expect(
      createIssueRequest({
        ...emptyNewIssueDraft(projectId),
        projectId,
        title: "  Fix login ",
        description: "  ",
      }),
    ).toEqual({
      projectId,
      title: "Fix login",
      visibility: "org",
      priority: "normal",
      assignee: null,
      labelIds: [],
    });
  });

  it("carries every picked field", () => {
    const assignee: IssueAssigneeInput = { kind: "user", id: "usr_1" };
    expect(
      createIssueRequest({
        projectId,
        title: "Ship it",
        description: " Steps \n",
        stateId: "ist_1" as IssueStateId,
        priority: "urgent",
        dueAt: day("2026-11-20"),
        assignee,
        labelIds: ["lbl_1" as IssueLabelId],
        access: "private",
      }),
    ).toEqual({
      projectId,
      title: "Ship it",
      description: "Steps",
      visibility: "private",
      stateId: "ist_1",
      priority: "urgent",
      dueAt: "2026-11-20",
      assignee,
      labelIds: ["lbl_1"],
    });
  });
});

describe("defaultIssueState", () => {
  const state = (id: string, type: "open" | "closed", isDefault = false) =>
    ({ id, type, isDefault }) as unknown as IssueState;

  it("prefers the org default, then the first open state", () => {
    expect(
      defaultIssueState([state("a", "closed"), state("b", "open", true)])?.id,
    ).toBe("b");
    expect(
      defaultIssueState([state("a", "closed"), state("b", "open")])?.id,
    ).toBe("b");
    expect(defaultIssueState([])).toBeUndefined();
  });
});

describe("localToday", () => {
  it("reads today from the local calendar", () => {
    expect(localToday(new Date(2026, 10, 17, 23, 30))).toBe("2026-11-17");
  });
});

describe("accessLabel", () => {
  it("names who can see the issue", () => {
    expect(accessLabel("shared")).toBe("Everyone in organization");
    expect(accessLabel("shared", "Acme")).toBe("Everyone at Acme");
    expect(accessLabel("private", "Acme")).toBe("Only specific people");
  });
});
