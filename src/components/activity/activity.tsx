import { useAtomRefresh, useAtomSet, useAtomValue } from "@effect/atom-react";
import { useState } from "react";
import { ActivityCard, CardAction, cx } from "@/components/activity-card";
import { WriteBox } from "@/components/github-write";
import {
  commentPullAtom,
  pullActivityAtom,
  pullReactivityKeys,
  pullReviewAtom,
  resolveCommentAtom,
} from "@/components/pull-view/atoms";
import { copyText } from "@/components/pull-view/clipboard";
import { usePullOrgId } from "@/components/pull-view/context";
import { goneOr } from "@/components/pull-view/gone";
import {
  ArrowUndoUpIcon,
  ArrowUpIcon,
  CommitsIcon,
  PullRequestIcon,
  SquareBehindSquare2Icon,
} from "@/components/pull-view/icons";
import { PullMarkdown } from "@/components/pull-view/markdown";
import { type Pull, relativeTime } from "@/components/pull-view/pull-model";
import { resultValue } from "@/components/pull-view/result";
import { Badge } from "@/primitives/badge";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { toast } from "@/primitives/toaster";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import {
  type ActivityFilter,
  type ActivityItem,
  activityItemKey,
  buildActivityItems,
  capyRoundTitle,
  commitLine,
  matchesActivityFilter,
  type PullComment,
  reviewStateWord,
  roundFailureText,
  toActivityData,
  toCapyReview,
} from "./activity-model";

const track = (owner: string) => `shared/pull-view/activity.tsx#${owner}`;

export type FilterPillProps = {
  label: string;
  active: boolean;
  onClick: () => void;
};

export function FilterPill({ label, active, onClick }: FilterPillProps) {
  return (
    <button
      data-track-owner={track("FilterPill:button[onClick=onClick]")}
      type="button"
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

export type TimelineRowProps = {
  icon: React.ReactNode;
  text: string;
  at: Date;
};

export function TimelineRow({ icon, text, at }: TimelineRowProps) {
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

export function CopyAction({ text }: { text: string }) {
  return (
    <CardAction
      data-track-owner={track("CopyAction:CardAction[Copy]")}
      label="Copy"
      onClick={() => copyText(text, "Copied", "Could not copy")}
    >
      <SquareBehindSquare2Icon className="size-(--icon-sm)" />
    </CardAction>
  );
}

export type CommentCardProps = {
  pull: Pull;
  comment: PullComment;
  replies?: ReadonlyArray<PullComment>;
  className?: string;
};

export function CommentCard({
  pull,
  comment,
  replies = [],
  className,
}: CommentCardProps) {
  const orgId = usePullOrgId();
  const resolve = useAtomSet(resolveCommentAtom, { mode: "promise" });
  const refreshActivity = useAtomRefresh(pullActivityAtom(orgId, pull.id));
  const reply = useAtomSet(commentPullAtom, { mode: "promise" });
  const [resolved, setResolved] = useState(comment.resolved);
  const [saving, setSaving] = useState(false);
  const [collapsed, setCollapsed] = useState(comment.resolved);
  const [replying, setReplying] = useState(false);
  const toggleResolved = () => {
    if (saving) return;
    const next = !resolved;
    const previous = collapsed;
    setResolved(next);
    setCollapsed(next);
    setSaving(true);
    resolve({
      params: { orgId, pullId: pull.id, commentId: comment.id },
      payload: { resolved: next },
      reactivityKeys: [`pull_comment:${pull.id}`],
    })
      .catch((error: unknown) => {
        setResolved(!next);
        setCollapsed(previous);
        if (goneOr(error, "This comment", refreshActivity)) return;
        toast.error(
          error instanceof Error ? error.message : "GitHub refused this action",
        );
      })
      .finally(() => setSaving(false));
  };
  return (
    <ActivityCard
      author={comment.author}
      avatarUrl={comment.authorAvatarUrl}
      at={comment.authoredAt}
      edited={comment.edited}
      resolved={resolved}
      outdated={comment.outdated}
      className={className}
      collapsible={
        resolved
          ? { collapsed, onToggle: () => setCollapsed((value) => !value) }
          : undefined
      }
      actions={
        <>
          {comment.bodyMd !== "" && <CopyAction text={comment.bodyMd} />}
          <CardAction
            data-track-owner={track(
              "CommentCard:CardAction[onClick=toggleResolved]",
            )}
            label={resolved ? "Unresolve" : "Resolve"}
            disabled={saving}
            onClick={toggleResolved}
          >
            <Icon name="circle-check" size="sm" />
          </CardAction>
          <CardAction
            data-track-owner={track("CommentCard:CardAction[Reply]")}
            label="Reply"
            onClick={() => setReplying((value) => !value)}
          >
            <ArrowUndoUpIcon className="size-(--icon-sm)" />
          </CardAction>
        </>
      }
      footer={
        replying && (
          <WriteBox
            placeholder="Reply"
            submitLabel="Reply"
            autoFocus
            onSubmit={(body) => {
              reply({
                params: { orgId, pullId: pull.id },
                payload: { body, inReplyTo: comment.id },
                reactivityKeys: pullReactivityKeys(orgId, pull.id),
              })
                .then(() => setReplying(false))
                .catch(() => toast.error("GitHub refused"));
            }}
          />
        )
      }
    >
      {comment.bodyMd !== "" && <PullMarkdown text={comment.bodyMd} />}
      {replies.map((entry) => (
        <ReplyEntry key={entry.id} reply={entry} />
      ))}
    </ActivityCard>
  );
}

export function ReplyEntry({ reply }: { reply: PullComment }) {
  return (
    <div className="-mx-3 flex flex-col gap-1.5 border-t-(length:--border-width-hairline) border-border-1 px-3 pt-2.5">
      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate text-sm font-medium text-foreground">
          {reply.author}
        </span>
        <span className="shrink-0 text-2xs text-muted-foreground-3">
          {relativeTime(reply.authoredAt)}
        </span>
      </div>
      {reply.bodyMd !== "" && <PullMarkdown text={reply.bodyMd} />}
    </div>
  );
}

const timelineIcon = "size-(--icon-xs) text-icon-muted";

export function ActivityRow({
  pull,
  item,
}: {
  pull: Pull;
  item: ActivityItem;
}) {
  switch (item.kind) {
    case "opened":
      return (
        <TimelineRow
          icon={<PullRequestIcon className={timelineIcon} />}
          text={`Opened by ${pull.author}`}
          at={item.at}
        />
      );
    case "commit":
      return (
        <TimelineRow
          icon={<CommitsIcon className={timelineIcon} />}
          text={commitLine(item.commit)}
          at={item.at}
        />
      );
    case "terminal":
      return (
        <TimelineRow
          icon={<PullRequestIcon className={timelineIcon} />}
          text={item.word}
          at={item.at}
        />
      );
    case "comment":
      return <CommentCard pull={pull} comment={item.comment} />;
    case "gh-review": {
      const body = item.review.bodyMd ?? "";
      const state = item.review.state;
      return (
        <>
          <ActivityCard
            author={item.review.reviewer}
            avatarUrl={item.review.authorAvatarUrl}
            at={item.at}
            suffix={reviewStateWord(state)}
            chip={
              state === "approved" ? (
                <Badge size="xs" color="success">
                  Approved
                </Badge>
              ) : state === "changes_requested" ? (
                <Badge size="xs" color="warning">
                  Changes requested
                </Badge>
              ) : undefined
            }
            actions={body !== "" && <CopyAction text={body} />}
          >
            {body !== "" && <PullMarkdown text={body} />}
          </ActivityCard>
          {item.threads.length > 0 && (
            <div className="relative flex flex-col gap-2 pl-6">
              <div className="absolute inset-y-0.5 left-2.5 w-0.5 rounded-full bg-border-3" />
              {item.threads.map((thread) => (
                <CommentCard
                  key={thread.root.id}
                  pull={pull}
                  comment={thread.root}
                  replies={thread.replies}
                />
              ))}
            </div>
          )}
        </>
      );
    }
    case "capy-round": {
      const { round } = item;
      const completed = round.status === "completed";
      return (
        <ActivityCard
          author={capyRoundTitle(round, item.open, item.resolved)}
          avatar={<CapyReviewMark />}
          at={item.at}
          className="border-border-2"
        >
          {round.status === "running" || round.status === "pending" ? (
            <span className="text-sm text-muted-foreground-2">
              Reviewing the latest changes
            </span>
          ) : round.status === "failed" ? (
            <span className="text-sm text-muted-foreground-1">
              {roundFailureText(round)}
            </span>
          ) : round.status === "stale" ? (
            <span className="text-sm text-muted-foreground-2">
              Superseded by a newer push
            </span>
          ) : (
            completed &&
            round.title !== null && (
              <span className="mt-0.5 text-sm font-medium text-balance text-foreground">
                {round.title}
              </span>
            )
          )}
        </ActivityCard>
      );
    }
  }
}

function CapyReviewMark() {
  return <Icon name="review" className="size-4.5 text-foreground" />;
}

export type ActivityProps = { pull: Pull };

export function Activity({ pull }: ActivityProps) {
  const orgId = usePullOrgId();
  const activity = resultValue(useAtomValue(pullActivityAtom(orgId, pull.id)));
  const review = resultValue(useAtomValue(pullReviewAtom(orgId, pull.id)));
  const [filter, setFilter] = useState<ActivityFilter>("all");
  const items = buildActivityItems(
    pull,
    activity === undefined ? undefined : toActivityData(activity),
    review === undefined ? null : toCapyReview(review),
  ).filter((item) => matchesActivityFilter(item, filter));
  return (
    <div
      data-pull-section="activity"
      className="flex scroll-mt-3 flex-col gap-3"
    >
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground-2">Activity</span>
        <span className="min-w-0 flex-1" />
        <FilterPill
          data-track-owner={track("Activity:FilterPill[All]")}
          label="All"
          active={filter === "all"}
          onClick={() => setFilter("all")}
        />
        <FilterPill
          data-track-owner={track("Activity:FilterPill[Comments]")}
          label="Comments"
          active={filter === "comments"}
          onClick={() => setFilter("comments")}
        />
        <FilterPill
          data-track-owner={track("Activity:FilterPill[Agents bots]")}
          label="Agents & bots"
          active={filter === "bots"}
          onClick={() => setFilter("bots")}
        />
      </div>
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <ActivityRow key={activityItemKey(item)} pull={pull} item={item} />
        ))}
      </div>
      <CommentComposer pull={pull} />
    </div>
  );
}

function CommentComposer({ pull }: { pull: Pull }) {
  const orgId = usePullOrgId();
  const comment = useAtomSet(commentPullAtom, { mode: "promise" });
  const [text, setText] = useState("");
  const submit = () => {
    const body = text.trim();
    if (body === "") return;
    setText("");
    comment({
      params: { orgId, pullId: pull.id },
      payload: { body },
      reactivityKeys: pullReactivityKeys(orgId, pull.id),
    }).catch(() => toast.error("GitHub refused"));
  };
  return (
    <form
      data-slot="composer"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="relative @container/composer rounded-(--radius-card) bg-[color:var(--composer-surface,var(--card))] p-3 shadow-composer"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-(--radius-card) border-(length:--border-width-hairline) border-transparent [background:linear-gradient(180deg,var(--border-2),var(--border-1))] [mask:linear-gradient(black,black)_padding-box_exclude,linear-gradient(black,black)_border-box]"
      />
      <div className="relative">
        <textarea
          aria-label="Message"
          placeholder="Leave a comment"
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              submit();
            }
          }}
          className="block max-h-56 min-h-12 w-full resize-none overflow-y-auto overscroll-contain bg-transparent p-1 text-base font-normal text-foreground outline-none placeholder:text-muted-foreground-3"
        />
      </div>
      <div className="-mx-1 -mb-1 flex items-center gap-2 pt-1">
        <span className="min-w-0 flex-1" />
        <div className="flex shrink-0 items-center gap-1">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Voice input"
                  disabled
                />
              }
            >
              <Icon name="microphone" size="sm" />
            </TooltipTrigger>
            <TooltipContent side="top">Voice input coming soon</TooltipContent>
          </Tooltip>
          {text.trim() === "" ? null : (
            <Button
              type="submit"
              variant="ghost"
              size="icon-sm"
              aria-label="Comment"
            >
              <ArrowUpIcon className="size-(--icon-sm)" />
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
