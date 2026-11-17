import type {
  IssueLabelId,
  IssueStateId,
  ProjectId,
} from "@/data/api/schemas/ids";
import type {
  CreateIssueRequest,
  IssueAssigneeInput,
  IssueDueDate,
  IssuePriority,
  IssueState,
} from "@/data/api/schemas/issue";

export type NewIssueAccess = "shared" | "private";

export interface NewIssueDraft {
  readonly projectId: ProjectId | undefined;
  readonly title: string;
  readonly description: string;
  readonly stateId: IssueStateId | undefined;
  readonly priority: IssuePriority;
  readonly dueAt: IssueDueDate | undefined;
  readonly assignee: IssueAssigneeInput | null;
  readonly labelIds: ReadonlyArray<IssueLabelId>;
  readonly access: NewIssueAccess;
}

export const emptyNewIssueDraft = (
  projectId: ProjectId | undefined,
): NewIssueDraft => ({
  projectId,
  title: "",
  description: "",
  stateId: undefined,
  priority: "normal",
  dueAt: undefined,
  assignee: null,
  labelIds: [],
  access: "shared",
});

/** Whether the dialog can submit: a project, a non-blank title, nothing in flight. */
export const canCreateIssue = (draft: NewIssueDraft, busy: boolean) =>
  draft.projectId !== undefined && draft.title.trim() !== "" && !busy;

/** The create payload Capy sends for a draft. */
export function createIssueRequest(
  draft: NewIssueDraft & { projectId: ProjectId },
): CreateIssueRequest {
  const description = draft.description.trim();
  return {
    projectId: draft.projectId,
    title: draft.title.trim(),
    visibility: draft.access === "private" ? "private" : "org",
    priority: draft.priority,
    assignee: draft.assignee,
    labelIds: draft.labelIds,
    ...(description === "" ? {} : { description }),
    ...(draft.stateId === undefined ? {} : { stateId: draft.stateId }),
    ...(draft.dueAt === undefined ? {} : { dueAt: draft.dueAt }),
  };
}

/** The state a new issue starts in: the org default, else the first open state. */
export const defaultIssueState = (states: ReadonlyArray<IssueState>) =>
  states.find((state) => state.isDefault) ??
  states.find((state) => state.type === "open") ??
  states[0];

/** Today in the viewer's own calendar, as YYYY-MM-DD. */
export const localToday = (now: Date) =>
  new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
    .toISOString()
    .slice(0, 10) as IssueDueDate;

export const accessLabel = (access: NewIssueAccess, orgName?: string) =>
  access === "private"
    ? "Only specific people"
    : orgName === undefined
      ? "Everyone in organization"
      : `Everyone at ${orgName}`;
