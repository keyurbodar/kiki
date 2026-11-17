import { DateTime } from "effect";
import { JamId, ProjectId } from "../../api/schemas/ids.ts";
import {
  IssueAccess,
  IssueActor,
  type IssueColor,
  IssueComment,
  IssueCommentId,
  IssueDetail,
  type IssueDueDate,
  IssueEvent,
  IssueEventId,
  IssueId,
  IssueLabel,
  IssueLabelId,
  IssueLabelList,
  IssuePullLink,
  IssuePullRef,
  type IssuePullState,
  IssueRelation,
  type IssueRelationKind,
  IssueRelationRef,
  IssueState,
  type IssueStateIcon,
  IssueStateId,
  IssueStateList,
  type IssueStatus,
  IssueSummary,
  IssueThreadLink,
  IssueViewer,
  PullId,
} from "../../api/schemas/issue.ts";
import type { Row } from "../db/MockDb.ts";
import { people, threads, viewer } from "../fixtures/world.ts";

/**
 * Issue page fixtures (D1b). The shared world (fixtures/world.ts) stores issues
 * as plain rows; these helpers project them onto the decoded issue schemas and
 * add what the world does not hold: descriptions, due dates, comments,
 * relations and subscriptions.
 */

type WorldState = Row<"issueStates">;
type WorldLabel = Row<"issueLabels">;
type WorldIssue = Row<"issues">;
type WorldPull = Row<"pulls">;

const stateStyle: Record<
  string,
  { status: IssueStatus; icon: IssueStateIcon; color: IssueColor }
> = {
  backlog: { status: "backlog", icon: "dashed", color: "gray" },
  unstarted: { status: "todo", icon: "empty", color: "gray" },
  started: { status: "in_progress", icon: "half", color: "yellow" },
  completed: { status: "done", icon: "check", color: "purple" },
  canceled: { status: "canceled", icon: "x", color: "gray" },
};

const stateOverrides: Record<
  string,
  { status: IssueStatus; icon: IssueStateIcon; color: IssueColor }
> = {
  ist_sample_in_review: {
    status: "in_review",
    icon: "progress",
    color: "green",
  },
  ist_sample_needs_you: {
    status: "in_progress",
    icon: "question",
    color: "orange",
  },
  ist_sample_waiting: {
    status: "in_progress",
    icon: "hourglass",
    color: "blue",
  },
};

const labelColors: Record<string, IssueColor> = {
  danger: "red",
  primary: "blue",
  success: "green",
  warning: "orange",
  info: "blue",
  default: "gray",
};

const fallbackStyle = {
  status: "todo",
  icon: "empty",
  color: "gray",
} as const;

const styleOf = (state: WorldState) =>
  stateOverrides[state.id] ?? stateStyle[state.category] ?? fallbackStyle;

export const statusOfState = (state: WorldState) => styleOf(state).status;

export const toIssueState = (state: WorldState) => {
  const style = styleOf(state);
  return new IssueState({
    id: IssueStateId.make(state.id),
    name: state.name,
    type:
      style.status === "done" || style.status === "canceled"
        ? "closed"
        : "open",
    icon: style.icon,
    color: style.color,
    position: state.position,
    isDefault: state.isDefault,
  });
};

export const toIssueStateList = (states: ReadonlyArray<WorldState>) =>
  new IssueStateList({ states: states.map(toIssueState) });

export const toIssueLabel = (label: WorldLabel) =>
  new IssueLabel({
    id: IssueLabelId.make(label.id),
    name: label.name,
    color: (labelColors[label.color] ?? label.color) as IssueColor,
  });

export const toIssueLabelList = (labels: ReadonlyArray<WorldLabel>) =>
  new IssueLabelList({ labels: labels.map(toIssueLabel) });

const personActor = (id: string) => {
  const person = Object.values(people).find((p) => p.id === id);
  return new IssueActor({
    kind: "user",
    id,
    name: person ? `${person.firstName} ${person.lastName}` : id,
    code: null,
    avatarUrl: null,
    captain: false,
  });
};

const threadOf = (id: string) =>
  Object.values(threads).find((thread) => thread.id === id);

const pullState = (state: string): IssuePullState =>
  state === "ready" ? "open" : (state as IssuePullState);

/** What the world does not store about an issue, keyed by issue code. */
export interface IssueExtra {
  readonly description: string;
  readonly dueAt?: IssueDueDate;
  readonly subscribed: boolean;
  readonly unread: boolean;
  readonly relations: ReadonlyArray<{
    readonly relation: IssueRelationKind;
    readonly code: string;
  }>;
  readonly comments: ReadonlyArray<{
    readonly authorId: string;
    readonly body: string;
    readonly minutesAgo: number;
  }>;
}

export const issueExtras: Record<string, IssueExtra> = {
  "ACME-1": {
    description:
      "Ship web release 2.4 once the checkout fix and dark mode land.\n\n- [ ] Checkout test is green on CI\n- [ ] Dark mode reviewed\n- [ ] Changelog written",
    dueAt: "2026-03-06",
    subscribed: true,
    unread: false,
    relations: [],
    comments: [
      {
        authorId: people.sam.id,
        body: "Release notes draft is in the docs folder.",
        minutesAgo: 120,
      },
    ],
  },
  "ACME-2": {
    description:
      "The checkout end-to-end test times out on CI about one run in five. It passes locally.\n\nLikely cause: the payment sandbox answers slowly under parallel runs. Retry the gateway call and raise the test timeout.",
    dueAt: "2026-03-03",
    subscribed: true,
    unread: true,
    relations: [
      { relation: "blocks", code: "ACME-1" },
      { relation: "related", code: "ACME-5" },
    ],
    comments: [
      {
        authorId: people.alex.id,
        body: "Seen again on main this morning. Logs attached to the thread.",
        minutesAgo: 45,
      },
    ],
  },
  "ACME-3": {
    description:
      "Add a dark theme to every settings page, following the system preference by default.",
    subscribed: false,
    unread: false,
    relations: [{ relation: "blocks", code: "ACME-1" }],
    comments: [],
  },
  "ACME-4": {
    description:
      "Orders currently returns every row. Pick a default page size and document it.",
    subscribed: true,
    unread: false,
    relations: [],
    comments: [],
  },
};

const emptyExtra: IssueExtra = {
  description: "",
  subscribed: false,
  unread: false,
  relations: [],
  comments: [],
};

export const extraOf = (
  extras: Record<string, IssueExtra>,
  code: string,
): IssueExtra => extras[code] ?? emptyExtra;

const timestamp = (iso: string) => DateTime.makeUnsafe(iso);

export interface IssueWorld {
  readonly issues: ReadonlyArray<WorldIssue>;
  readonly states: ReadonlyArray<WorldState>;
  readonly labels: ReadonlyArray<WorldLabel>;
  readonly pulls: ReadonlyArray<WorldPull>;
  readonly extras: Record<string, IssueExtra>;
}

const relationRef = (world: IssueWorld, code: string) => {
  const target = world.issues.find((row) => row.code === code);
  if (!target) return [];
  const state = world.states.find((s) => s.id === target.stateId);
  return [
    new IssueRelationRef({
      code: target.code,
      number: target.number,
      title: target.title,
      status: state ? styleOf(state).status : "todo",
      stateId: IssueStateId.make(target.stateId),
    }),
  ];
};

const inverse: Record<IssueRelationKind, IssueRelationKind> = {
  blocks: "blocked_by",
  blocked_by: "blocks",
  related: "related",
};

/** Every relation of an issue, including the inverse side stored on others. */
export const relationsOf = (world: IssueWorld, code: string) => {
  const own = extraOf(world.extras, code).relations;
  const incoming = Object.entries(world.extras).flatMap(([other, extra]) =>
    extra.relations
      .filter((relation) => relation.code === code)
      .map((relation) => ({
        relation: inverse[relation.relation],
        code: other,
      })),
  );
  return [...own, ...incoming];
};

export const toIssueSummary = (world: IssueWorld, row: WorldIssue) => {
  const state = world.states.find((s) => s.id === row.stateId);
  const extra = extraOf(world.extras, row.code);
  const relations = relationsOf(world, row.code);
  const parent = row.parentCode
    ? world.issues.find((other) => other.code === row.parentCode)
    : undefined;
  const subIssues = world.issues.filter(
    (other) => other.parentCode === row.code,
  );
  const closed = (other: WorldIssue) => {
    const s = world.states.find((st) => st.id === other.stateId);
    return s !== undefined && toIssueState(s).type === "closed";
  };
  const status = state ? styleOf(state).status : "todo";
  const assignee = row.assigneeId ? personActor(row.assigneeId) : null;
  const blockedBy = relations
    .filter((relation) => relation.relation === "blocked_by")
    .flatMap((relation) => relationRef(world, relation.code));
  return new IssueSummary({
    id: IssueId.make(row.id),
    code: row.code,
    number: row.number,
    projectId: ProjectId.make(row.projectId),
    title: row.title,
    status,
    stateId: IssueStateId.make(row.stateId),
    priority: row.priority as IssueSummary["priority"],
    ...(extra.dueAt ? { dueAt: extra.dueAt } : {}),
    parentIssueId: parent ? IssueId.make(parent.id) : null,
    visibility: "org",
    accessJamId: null,
    assignee,
    assignees: assignee ? [assignee] : [],
    labels: world.labels
      .filter((label) => row.labelIds.includes(label.id))
      .map(toIssueLabel),
    blockedBy,
    blocking: relations
      .filter((relation) => relation.relation === "blocks")
      .flatMap((relation) => relationRef(world, relation.code)),
    subIssueCount: subIssues.length,
    closedSubIssueCount: subIssues.filter(closed).length,
    openBlockers: blockedBy.filter(
      (ref) => ref.status !== "done" && ref.status !== "canceled",
    ).length,
    pulls: world.pulls
      .filter((pull) => row.pullIds.includes(pull.id))
      .map(
        (pull) =>
          new IssuePullRef({
            repoFullName: pull.repo,
            prNumber: pull.number,
            title: pull.title,
            state: pullState(pull.state),
          }),
      ),
    viewer: new IssueViewer({
      subscribed: extra.subscribed,
      unread: extra.unread,
      unreadSince: null,
      mentions: 0,
    }),
    createdAt: timestamp(row.createdAt),
    updatedAt: timestamp(row.updatedAt),
    closedAt:
      status === "done" || status === "canceled"
        ? timestamp(row.updatedAt)
        : null,
  });
};

export const toIssueDetail = (world: IssueWorld, row: WorldIssue) => {
  const extra = extraOf(world.extras, row.code);
  const parent = row.parentCode
    ? world.issues.find((other) => other.code === row.parentCode)
    : undefined;
  const relations = relationsOf(world, row.code).flatMap((relation) => {
    const target = world.issues.find((other) => other.code === relation.code);
    return target
      ? [
          new IssueRelation({
            relation: relation.relation,
            issue: toIssueSummary(world, target),
          }),
        ]
      : [];
  });
  return new IssueDetail({
    issue: toIssueSummary(world, row),
    description: extra.description,
    files: [],
    creator: personActor(row.creatorId),
    access: new IssueAccess({
      source: null,
      people: [personActor(viewer.id)],
      editable: true,
    }),
    parent: parent ? toIssueSummary(world, parent) : null,
    subIssues: world.issues
      .filter((other) => other.parentCode === row.code)
      .map((other) => toIssueSummary(world, other)),
    pulls: world.pulls
      .filter((pull) => row.pullIds.includes(pull.id))
      .map(
        (pull) =>
          new IssuePullLink({
            pullId: PullId.make(pull.id),
            repoFullName: pull.repo,
            prNumber: pull.number,
            title: pull.title,
            state: pullState(pull.state),
            viaCode: null,
            openedAt: timestamp(pull.updatedAt),
            mergedAt:
              pull.state === "merged" ? timestamp(pull.updatedAt) : null,
          }),
      ),
    threads: row.threadIds.flatMap((id) => {
      const thread = threadOf(id);
      return thread
        ? [
            new IssueThreadLink({
              jamId: JamId.make(thread.id),
              code: `WEB-${thread.number}`,
              title: thread.title,
              status: "idle",
              captain: false,
            }),
          ]
        : [];
    }),
    relations,
    relationCount: relations.length,
    comments: extra.comments.map(
      (comment, index) =>
        new IssueComment({
          id: IssueCommentId.make(`icm_sample_${row.number}_${index + 1}`),
          parentCommentId: null,
          replyToCommentId: null,
          author: personActor(comment.authorId),
          body: comment.body,
          createdAt: DateTime.subtract(timestamp(row.updatedAt), {
            minutes: comment.minutesAgo - 1,
          }),
          editedAt: null,
        }),
    ),
    events: [
      new IssueEvent({
        id: IssueEventId.make(`iev_sample_${row.number}_created`),
        kind: "created",
        actor: personActor(row.creatorId),
        payload: { kind: "created" },
        refs: {},
        issueCode: row.code,
        createdAt: timestamp(row.createdAt),
      }),
    ],
  });
};
