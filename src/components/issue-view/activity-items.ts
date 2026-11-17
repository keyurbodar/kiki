import { issueActorLead, issueDate } from "@/components/issue-parts";
import type {
  IssueComment,
  IssueDetail,
  IssueEvent,
  IssuePullLink,
  IssueTimelineEvent,
} from "@/data/api/schemas/issue";
import { relationLabels } from "./link-menus";

export type ActivityFilter = "all" | "comments" | "bots";

export type ActivityItem =
  | {
      readonly kind: "comment";
      readonly at: Date;
      readonly comment: IssueComment;
      readonly replies: ReadonlyArray<IssueComment>;
    }
  | {
      readonly kind: "event";
      readonly at: Date;
      readonly event: IssueEvent | IssueTimelineEvent;
    }
  | {
      readonly kind: "pull";
      readonly at: Date;
      readonly merged: boolean;
      readonly pull: IssuePullLink;
    };

/** Comments with their replies, events and pull openings/merges, oldest first. */
export function activityItems(
  detail: IssueDetail,
): ReadonlyArray<ActivityItem> {
  const replies = new Map<string, Array<IssueComment>>();
  for (const comment of [...detail.comments].sort(
    (a, b) =>
      issueDate(a.createdAt).getTime() - issueDate(b.createdAt).getTime(),
  )) {
    if (comment.parentCommentId === null) continue;
    const list = replies.get(comment.parentCommentId);
    if (list === undefined) replies.set(comment.parentCommentId, [comment]);
    else list.push(comment);
  }
  const items: Array<ActivityItem> = [
    ...detail.comments
      .filter((comment) => comment.parentCommentId === null)
      .map((comment) => ({
        kind: "comment" as const,
        at: issueDate(comment.createdAt),
        comment,
        replies: replies.get(comment.id) ?? [],
      })),
    ...(detail.timeline ?? detail.events).map((event) => ({
      kind: "event" as const,
      at: issueDate(event.createdAt),
      event,
    })),
    ...detail.pulls
      .filter((pull) => pull.viaCode === null)
      .flatMap((pull) => [
        {
          kind: "pull" as const,
          at: issueDate(pull.openedAt),
          merged: false,
          pull,
        },
        ...(pull.mergedAt === null
          ? []
          : [
              {
                kind: "pull" as const,
                at: issueDate(pull.mergedAt),
                merged: true,
                pull,
              },
            ]),
      ]),
  ];
  return items.sort((a, b) => a.at.getTime() - b.at.getTime());
}

/** Whether an item shows under an activity filter pill. */
export const matchesActivityFilter = (
  item: ActivityItem,
  filter: ActivityFilter,
) =>
  filter === "all"
    ? true
    : filter === "comments"
      ? item.kind === "comment"
      : item.kind !== "pull" &&
        (item.kind === "comment" ? item.comment.author : item.event.actor)
          ?.kind === "jam";

type Payload = { readonly kind?: string; readonly [key: string]: unknown };

const field = (payload: Payload, key: string) => {
  const value = payload[key];
  return typeof value === "string" ? value : null;
};

/** One activity line, worded as Capy words it. */
export function eventText(
  event: IssueEvent | IssueTimelineEvent,
  stateName: (stateId: string) => string | undefined,
  projectName?: string,
) {
  const who = issueActorLead(event.actor);
  const ref = (id: string | null) => (id === null ? undefined : event.refs[id]);
  const target = event.issueCode ?? "the issue";
  const payload = (event.payload ?? {}) as Payload;
  switch (payload.kind) {
    case "created":
      return `${who} created ${target}`;
    case "status_changed":
    case "state_changed": {
      const to = payload.to as { id?: string; name?: string } | string;
      const name =
        typeof to === "string"
          ? (stateName(to) ?? to)
          : (to?.name ?? stateName(to?.id ?? "") ?? "a new status");
      return `${who} moved ${target} to ${name}`;
    }
    case "priority_changed":
      return `${who} set priority to ${field(payload, "to") ?? "a new priority"}`;
    case "title_changed":
      return `${who} renamed the issue to ${field(payload, "to") ?? ""}`;
    case "description_edited":
      return `${who} edited the description`;
    case "parent_set": {
      const to = field(payload, "to");
      return to === null
        ? `${who} removed the parent`
        : `${who} set the parent to ${ref(to) ?? "an issue"}`;
    }
    case "sub_issue_added":
      return `${who} added sub-issue ${ref(field(payload, "issueId")) ?? "an issue"}`;
    case "sub_issue_removed":
      return `${who} removed sub-issue ${ref(field(payload, "issueId")) ?? "an issue"}`;
    case "linked":
    case "unlinked": {
      const link = (payload.target ?? {}) as Payload;
      if (link.kind === "issue") {
        const other = ref(field(link, "issueId")) ?? "an issue";
        const relation = field(link, "relation") as keyof typeof relationLabels;
        return payload.kind === "linked"
          ? `${who} marked ${target} as ${(relationLabels[relation] ?? "related to").toLowerCase()} ${other}`
          : `${who} removed the relation to ${other}`;
      }
      const other =
        ref(field(link, link.kind === "pull" ? "pullId" : "jamId")) ??
        (link.kind === "pull" ? "a pull request" : "a thread");
      return `${who} ${payload.kind} ${other}`;
    }
    case "visibility_changed":
      return payload.to === "private"
        ? `${who} made ${target} private`
        : `${who} shared ${target} with ${projectName ?? "the project"}`;
    default:
      return "This update needs a newer version of Capy";
  }
}
