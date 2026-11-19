import { Link } from "@tanstack/react-router";
import { cx } from "class-variance-authority";
import { type ReactNode, useState } from "react";
import {
  ArrowCornerUpLeft,
  ArrowUndoUp,
  Bubble,
  ChainLink,
  CircleBan,
  EditSmall,
  Flag,
  Globe,
  IssueActorAvatar,
  issueCoarseHitArea,
  issueDate,
  Lock,
  PlusLarge,
  PullRequest,
  relativeTime,
  SquareBehindSquare,
  User,
} from "@/components/issue-parts";
import type { OrgId } from "@/data/api/schemas/ids";
import type {
  IssueActor,
  IssueComment,
  IssueDetail,
  IssueEvent,
  IssueTimelineEvent,
} from "@/data/api/schemas/issue";
import {
  IssueStateIcon,
  issueStatusDefaults,
} from "@/features/issues/issue-parts";
import { useIssueStates } from "@/features/issues/issue-pickers";
import { Button } from "@/primitives/button";
import { toast } from "@/primitives/toaster";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import {
  type ActivityFilter,
  activityItems,
  eventText,
  matchesActivityFilter,
} from "./activity-items";
import { useIssueViewContext } from "./context";
import { IssueComposer } from "./issue-composer";
import type { IssueQuote } from "./issue-view";
import type { IssueActions } from "./use-issue";

const pageSize = 50;
const muted = "size-(--icon-xs) text-icon-muted";

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cx(
        "flex h-6 items-center rounded px-2 text-xs outline-none select-none",
        "transition-colors duration-100",
        active
          ? "bg-secondary text-foreground"
          : "text-muted-foreground-2 hover:bg-secondary hover:text-foreground",
        "focus-visible:outline-ring-inset",
      )}
    >
      {label}
    </button>
  );
}

/** One line of activity: glyph, text, "·", time (Capy's ActivityLine). */
function ActivityLine({
  icon,
  text,
  at,
}: {
  icon: ReactNode;
  text: string;
  at: Date;
}) {
  return (
    <div className="flex min-h-7 items-center gap-2 px-1">
      <span className="flex w-4.5 shrink-0 justify-center">{icon}</span>
      <span className="truncate text-xs text-muted-foreground-2">{text}</span>
      <span className="shrink-0 text-xs text-muted-foreground-3">·</span>
      <span className="shrink-0 text-2xs text-muted-foreground-3">
        {relativeTime(at)}
      </span>
    </div>
  );
}

function EventIcon({
  orgId,
  event,
}: {
  orgId: OrgId | undefined;
  event: IssueEvent | IssueTimelineEvent;
}) {
  const states = useIssueStates(orgId);
  const payload = (event.payload ?? {}) as {
    kind?: string;
    to?: unknown;
    target?: { kind?: string; relation?: string };
  };
  switch (payload.kind) {
    case "status_changed":
    case "state_changed": {
      const to = payload.to as { id?: string } | string | undefined;
      const id = typeof to === "string" ? to : to?.id;
      const state = states.find((candidate) => candidate.id === id);
      const look =
        state ??
        issueStatusDefaults[
          (typeof to === "string"
            ? to
            : "todo") as keyof typeof issueStatusDefaults
        ] ??
        issueStatusDefaults.todo;
      return (
        <IssueStateIcon
          icon={look.icon}
          color={look.color}
          className="size-(--icon-xs)"
        />
      );
    }
    case "created":
      return <PlusLarge className={muted} />;
    case "priority_changed":
      return <Flag className={muted} />;
    case "assignee_changed":
      return <User className={muted} />;
    case "parent_set":
    case "sub_issue_added":
    case "sub_issue_removed":
      return <ArrowCornerUpLeft className={muted} />;
    case "linked":
    case "unlinked":
      return payload.target?.kind === "pull" ? (
        <PullRequest className={muted} />
      ) : payload.target?.kind === "thread" ? (
        <Bubble className={muted} />
      ) : payload.target?.kind === "issue" ? (
        payload.target.relation === "related" ? (
          <ChainLink className={muted} />
        ) : (
          <CircleBan className={muted} />
        )
      ) : (
        <EditSmall className={muted} />
      );
    case "visibility_changed":
      return payload.to === "private" ? (
        <Lock className={muted} />
      ) : (
        <Globe className={muted} />
      );
    default:
      return <EditSmall className={muted} />;
  }
}

function CardAction({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={label}
            onClick={onClick}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}

function CommentAuthor({ author, at }: { author: IssueActor; at: Date }) {
  const { openThread } = useIssueViewContext();
  return (
    <span className="flex min-w-0 max-w-full items-center gap-2">
      <IssueActorAvatar actor={author} />
      {author.kind === "user" || author.hidden === true ? (
        <span className="truncate text-sm font-medium text-foreground">
          {author.name}
        </span>
      ) : (
        <Link
          to="/thread/$threadId"
          params={{ threadId: author.id }}
          onClick={(event) => {
            if (openThread?.(author.id) === true) event.preventDefault();
          }}
          className={cx(
            "relative flex min-w-0 rounded text-sm font-medium text-foreground outline-none hover:underline focus-visible:outline-ring-inset",
            issueCoarseHitArea,
          )}
        >
          <span className="truncate">{author.name}</span>
        </Link>
      )}
      <span className="flex shrink-0 items-center gap-2 text-2xs whitespace-nowrap text-muted-foreground-3">
        <span>{relativeTime(at)}</span>
      </span>
    </span>
  );
}

const copyText = (text: string) =>
  navigator.clipboard.writeText(text).then(
    () => toast.success("Copied"),
    () => toast.error("Could not copy"),
  );

/** A comment and its replies on one card (Capy's CommentCard). */
function CommentCard({
  code,
  comment,
  replies,
  actions,
}: {
  code: string;
  comment: IssueComment;
  replies: ReadonlyArray<IssueComment>;
  actions: IssueActions;
}) {
  const [replyTo, setReplyTo] = useState<IssueComment>();
  const toggleReply = (target: IssueComment) =>
    setReplyTo(replyTo?.id === target.id ? undefined : target);
  return (
    <div
      data-slot="activity-card"
      className="group/card flex flex-col gap-2 rounded-(--radius-card) border-hairline border-border-1 bg-card p-3 font-sans shadow-plate"
    >
      <div className="flex min-w-0 items-center gap-2">
        <CommentAuthor
          author={comment.author}
          at={issueDate(comment.createdAt)}
        />
        <div className="ml-auto flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity duration-100 group-hover/card:opacity-100 focus-within:opacity-100 pointer-coarse:opacity-100">
          <CardAction label="Copy" onClick={() => void copyText(comment.body)}>
            <SquareBehindSquare />
          </CardAction>
          <CardAction label="Reply" onClick={() => toggleReply(comment)}>
            <ArrowUndoUp />
          </CardAction>
        </div>
      </div>
      <div
        className="flex flex-col gap-2"
        data-quote-key={`issue:${code}`}
        data-quote-label={`${code} comment by ${comment.author.name}`}
      >
        <p className="text-sm whitespace-pre-wrap text-foreground">
          {comment.body}
        </p>
      </div>
      {replies.map((reply) => (
        <div
          key={reply.id}
          className="group/reply -mx-3 flex flex-col gap-1.5 border-t-hairline border-border-1 px-3 pt-2.5"
        >
          <div className="flex min-w-0 items-center gap-2">
            <CommentAuthor
              author={reply.author}
              at={issueDate(reply.createdAt)}
            />
            <div className="ml-auto shrink-0 opacity-0 transition-opacity duration-100 group-hover/reply:opacity-100 focus-within:opacity-100 pointer-coarse:opacity-100">
              <CardAction label="Reply" onClick={() => toggleReply(reply)}>
                <ArrowUndoUp />
              </CardAction>
            </div>
          </div>
          <p className="text-sm whitespace-pre-wrap text-foreground">
            {reply.body}
          </p>
        </div>
      ))}
      {replyTo !== undefined && (
        <IssueComposer
          key={replyTo.id}
          placeholder={`Reply to ${replyTo.author.name}`}
          submitLabel="Reply"
          editorClassName="min-h-12"
          autoFocus
          onSubmit={(text) =>
            actions.comment(text, replyTo.id).then((sent) => {
              if (sent) setReplyTo(undefined);
              return sent;
            })
          }
        />
      )}
    </div>
  );
}

/** Activity: filter pills, the timeline and the comment box (Capy's IssueActivity). */
export function IssueActivity({
  orgId,
  detail,
  actions,
  quote,
}: {
  orgId: OrgId | undefined;
  detail: IssueDetail;
  actions: IssueActions;
  /** A selected description passage the comment box is seeded with. */
  quote?: IssueQuote | null;
}) {
  const [filter, setFilter] = useState<ActivityFilter>("all");
  const [limit, setLimit] = useState(pageSize);
  const states = useIssueStates(orgId);
  const items = activityItems(detail).filter((item) =>
    matchesActivityFilter(item, filter),
  );
  const shown = items.slice(-limit);
  const earlier = items.length - shown.length;
  const stateName = (id: string) =>
    states.find((state) => state.id === id)?.name;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground-2">Activity</span>
        <span className="min-w-0 flex-1" />
        <FilterPill
          label="All"
          active={filter === "all"}
          onClick={() => setFilter("all")}
        />
        <FilterPill
          label="Comments"
          active={filter === "comments"}
          onClick={() => setFilter("comments")}
        />
        <FilterPill
          label="Agents & bots"
          active={filter === "bots"}
          onClick={() => setFilter("bots")}
        />
      </div>
      {earlier > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="self-start"
          onClick={() => setLimit(limit + pageSize)}
        >
          Show {Math.min(pageSize, earlier)} earlier
        </Button>
      )}
      <div className="flex flex-col gap-2">
        {shown.map((item) =>
          item.kind === "pull" ? (
            <ActivityLine
              key={`${item.pull.pullId}:${item.merged ? "merged" : "opened"}`}
              icon={
                <PullRequest
                  className={
                    item.merged ? "size-(--icon-xs) text-complete" : muted
                  }
                />
              }
              text={`${item.merged ? "Merged" : "Opened"} ${item.pull.repoFullName}#${item.pull.prNumber} ${item.pull.title}`}
              at={item.at}
            />
          ) : item.kind === "comment" ? (
            <CommentCard
              key={item.comment.id}
              code={detail.issue.code}
              comment={item.comment}
              replies={item.replies}
              actions={actions}
            />
          ) : (
            <ActivityLine
              key={item.event.id}
              icon={<EventIcon orgId={orgId} event={item.event} />}
              text={eventText(item.event, stateName)}
              at={item.at}
            />
          ),
        )}
      </div>
      <IssueComposer
        key={detail.issue.id}
        placeholder="Leave a comment"
        submitLabel="Comment"
        editorClassName="min-h-12"
        quote={quote}
        onSubmit={(text) => actions.comment(text)}
      />
    </div>
  );
}
