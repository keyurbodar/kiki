import { Link } from "@tanstack/react-router";
import { cx } from "class-variance-authority";
import { type ReactNode, useState } from "react";
import {
  DueDatePicker,
  isOverdue,
  relativeDueLabel,
} from "@/components/issue-due";
import {
  ArrowCornerUpLeft,
  Bubble,
  Calendar,
  ChainLink,
  ChevronDownSmall,
  CircleHalfFill,
  Flag,
  IssueActorAvatar,
  issueActorName,
  issueCoarseHitArea,
  issueMenuIcon,
  issuePropertyGlyph,
  issuePropertyValue,
  localToday,
  PullRequest,
  Tag,
  User,
  UserEdit,
} from "@/components/issue-parts";
import type { OrgId } from "@/data/api/schemas/ids";
import {
  type IssueActor,
  type IssueDetail,
  type IssuePullLink,
  type IssueRelation,
  type IssueSummary,
  type IssueThreadLink,
  isClosedIssueStatus,
  type UpdateIssueRequest,
} from "@/data/api/schemas/issue";
import {
  IssueLabelDot,
  IssuePriorityIcon,
  IssuePropertyRow,
  IssueStateIcon,
  issuePriorityLabels,
  issueStatusDefaults,
} from "@/features/issues/issue-parts";
import {
  IssueLabelOptions,
  IssuePriorityOptions,
  IssueStatusOptions,
  useIssueStates,
} from "@/features/issues/issue-pickers";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuTrigger,
} from "@/primitives/menu";
import { useIssueViewContext } from "./context";
import {
  LinkMenu,
  RelationMenu,
  relationLabels,
  UnlinkButton,
} from "./link-menus";
import type { IssueActions } from "./use-issue";

const refLink = cx(issuePropertyValue, "min-w-0");

/** The state glyph for any issue, looked up in the org's states. */
export function IssueStatusGlyph({
  orgId,
  issue,
  className,
}: {
  orgId: OrgId | undefined;
  issue: Pick<IssueSummary, "stateId" | "status">;
  className?: string;
}) {
  const state = useIssueStates(orgId).find((s) => s.id === issue.stateId);
  const look = state ?? issueStatusDefaults[issue.status];
  return (
    <IssueStateIcon icon={look.icon} color={look.color} className={className} />
  );
}

/** A clickable "CODE Title" reference to another issue (Capy's IssueRef). */
export function IssueRef({
  orgId,
  issue,
}: {
  orgId: OrgId | undefined;
  issue: IssueSummary;
}) {
  const { openIssue } = useIssueViewContext();
  return (
    <Link
      to="/issues/$code"
      params={{ code: issue.code }}
      className={refLink}
      onClick={(event) => {
        if (openIssue === undefined || event.metaKey || event.ctrlKey) return;
        event.preventDefault();
        openIssue(issue.code);
      }}
    >
      <span className={issuePropertyGlyph}>
        <IssueStatusGlyph
          orgId={orgId}
          issue={issue}
          className="size-(--icon-xs)"
        />
      </span>
      <span className="shrink-0 font-normal text-muted-foreground-2">
        {issue.code}
      </span>
      <span className="min-w-0 truncate">{issue.title}</span>
    </Link>
  );
}

function PickerTrigger({
  label,
  glyph,
  placeholder,
  children,
}: {
  label: string;
  glyph?: ReactNode;
  placeholder?: boolean;
  children: ReactNode;
}) {
  return (
    <MenuTrigger
      aria-label={label}
      render={
        <button type="button" className={cx(issuePropertyValue, "min-w-0")} />
      }
    >
      {glyph !== undefined && (
        <span className={issuePropertyGlyph}>{glyph}</span>
      )}
      <span
        className={cx(
          "min-w-0 truncate",
          placeholder
            ? "font-normal text-muted-foreground-2"
            : "text-foreground",
        )}
      >
        {children}
      </span>
      <ChevronDownSmall className="size-(--icon-xs) shrink-0 text-icon-muted" />
    </MenuTrigger>
  );
}

function PullValueRow({
  pull,
  onUnlink,
}: {
  pull: IssuePullLink;
  onUnlink?: () => void;
}) {
  const slash = pull.repoFullName.indexOf("/");
  const owner = pull.repoFullName.slice(0, Math.max(slash, 0));
  const repo = pull.repoFullName.slice(slash + 1);
  return (
    <span className="group/link flex min-w-0 max-w-full items-center gap-1">
      <Link
        to="/pull/$owner/$repo/$prNumber"
        params={{ owner, repo, prNumber: String(pull.prNumber) }}
        className={refLink}
      >
        <span className={issuePropertyGlyph}>
          <PullRequest
            data-state={pull.state}
            className={cx(
              "size-(--icon-xs)",
              pull.state === "merged"
                ? "text-complete"
                : pull.state === "closed"
                  ? "text-destructive"
                  : "text-success",
            )}
          />
        </span>
        <span className="shrink-0 font-normal text-muted-foreground-2 tabular-nums">
          {repo}#{pull.prNumber}
        </span>
        <span className="min-w-0 truncate">{pull.title}</span>
        {pull.viaCode !== null && (
          <span className="shrink-0 font-normal text-muted-foreground-3">
            via {pull.viaCode}
          </span>
        )}
      </Link>
      {onUnlink !== undefined && (
        <UnlinkButton label="Unlink pull request" onClick={onUnlink} />
      )}
    </span>
  );
}

function ThreadValueRow({
  thread,
  onUnlink,
}: {
  thread: IssueThreadLink;
  onUnlink: () => void;
}) {
  const { openThread } = useIssueViewContext();
  return (
    <span
      data-thread-row
      className="group/row group/link relative flex min-w-0 max-w-full items-center gap-1"
    >
      <Link
        to="/thread/$threadId"
        params={{ threadId: thread.jamId }}
        className={refLink}
        onClick={(event) => {
          if (openThread?.(thread.jamId) === true) event.preventDefault();
        }}
      >
        <span className={issuePropertyGlyph}>
          <Bubble className="size-(--icon-xs) text-icon-muted" />
        </span>
        <span className="min-w-0 truncate">{thread.title}</span>
        {!thread.captain && thread.code !== null && (
          <span className="shrink-0 font-normal text-muted-foreground-2">
            {thread.code}
          </span>
        )}
      </Link>
      {thread.owner === true && (
        <span
          role="img"
          aria-label="Owner: woken by updates"
          title="Owner: woken by updates"
          className="size-1.5 shrink-0 rounded-full bg-success"
        />
      )}
      <UnlinkButton label="Unlink thread" onClick={onUnlink} />
    </span>
  );
}

function RelationRows({
  orgId,
  items,
  onUnrelate,
}: {
  orgId: OrgId | undefined;
  items: ReadonlyArray<IssueRelation>;
  onUnrelate: (code: string) => void;
}) {
  return items.map((item) => (
    <span
      key={item.issue.id}
      className="group/link flex max-w-full min-w-0 items-center gap-1"
    >
      <span className="shrink-0 text-xs text-muted-foreground-2">
        {relationLabels[item.relation]}
      </span>
      <IssueRef orgId={orgId} issue={item.issue} />
      <UnlinkButton
        label="Remove relation"
        onClick={() => onUnrelate(item.issue.code)}
      />
    </span>
  ));
}

const relationPageSize = 10;

function RelationList({
  orgId,
  detail,
  actions,
}: {
  orgId: OrgId | undefined;
  detail: IssueDetail;
  actions: IssueActions;
}) {
  const [shown, setShown] = useState(relationPageSize);
  const relations = detail.relations ?? [];
  const hidden = relations.length - shown;
  return (
    <span className="flex min-w-0 flex-col items-start gap-0.5">
      <RelationRows
        orgId={orgId}
        items={relations.slice(0, shown)}
        onUnrelate={(code) => void actions.unrelate(code)}
      />
      {hidden > 0 && (
        <button
          type="button"
          className={cx(
            issuePropertyValue,
            "text-muted-foreground-2 hover:text-foreground",
          )}
          onClick={() => setShown(shown + relationPageSize)}
        >
          Show {Math.min(hidden, relationPageSize)} more
        </button>
      )}
      <RelationMenu
        onRelate={(relation, code) => void actions.relate(relation, code)}
      />
    </span>
  );
}

const actorKey = (actor: IssueActor) => `${actor.kind}:${actor.id}`;

function AssigneeValue({
  issue,
  creator,
  actions,
}: {
  issue: IssueSummary;
  creator: IssueActor | null;
  actions: IssueActions;
}) {
  const assignees = issue.assignees ?? (issue.assignee ? [issue.assignee] : []);
  const candidates = [
    ...assignees,
    ...(creator !== null &&
    !assignees.some((actor) => actorKey(actor) === actorKey(creator))
      ? [creator]
      : []),
  ];
  const first = assignees[0];
  return (
    <Menu>
      <PickerTrigger
        label="Change assignees"
        placeholder={first === undefined}
        glyph={
          first === undefined ? undefined : (
            <IssueActorAvatar actor={first} className="size-3.5" />
          )
        }
      >
        {first === undefined
          ? "No assignee"
          : assignees.length > 1
            ? `${issueActorName(first)} +${assignees.length - 1}`
            : issueActorName(first)}
      </PickerTrigger>
      <MenuContent align="start" className="w-64">
        <MenuItem
          onClick={() =>
            assignees.length > 0 &&
            void actions.update(
              { assignees: [] },
              "Could not change the assignees",
            )
          }
        >
          <span className={issueMenuIcon}>
            <User />
          </span>
          No assignee
        </MenuItem>
        {candidates.length > 0 && <MenuLabel>People</MenuLabel>}
        {candidates.map((actor) => {
          const assigned = assignees.some(
            (other) => actorKey(other) === actorKey(actor),
          );
          return (
            <MenuItem
              key={actorKey(actor)}
              closeOnClick={false}
              onClick={() =>
                void actions.update(
                  {
                    assignees: (assigned
                      ? assignees.filter(
                          (other) => actorKey(other) !== actorKey(actor),
                        )
                      : [...assignees, actor]
                    ).map(({ kind, id }) => ({ kind, id })),
                  },
                  "Could not change the assignees",
                )
              }
            >
              <span className={issueMenuIcon}>
                <IssueActorAvatar actor={actor} />
              </span>
              <span className="min-w-0 truncate">{issueActorName(actor)}</span>
              {assigned && (
                <span className="ml-auto text-sm text-muted-foreground-1">
                  ✓
                </span>
              )}
            </MenuItem>
          );
        })}
      </MenuContent>
    </Menu>
  );
}

/** Every property of an issue, one row each (Capy's PropertyRows). */
export function PropertyRows({
  orgId,
  detail,
  actions,
  today = localToday(),
}: {
  orgId: OrgId | undefined;
  detail: IssueDetail;
  actions: IssueActions;
  today?: string;
}) {
  const issue = detail.issue;
  const states = useIssueStates(orgId);
  const state = states.find((candidate) => candidate.id === issue.stateId);
  const labels = issue.labels ?? [];
  const closed = isClosedIssueStatus(issue.status);
  const [showClosedPulls, setShowClosedPulls] = useState(false);
  const closedPulls = detail.pulls.filter(
    (pull) => pull.state === "merged" || pull.state === "closed",
  );
  const pullRow = (pull: IssuePullLink) => (
    <PullValueRow
      key={pull.pullId}
      pull={pull}
      onUnlink={
        pull.viaCode === null
          ? () => void actions.unlink({ kind: "pull", pullId: pull.pullId })
          : undefined
      }
    />
  );
  const showCreator =
    detail.creator !== null &&
    (issue.assignee === null ||
      detail.creator.kind !== issue.assignee.kind ||
      detail.creator.id !== issue.assignee.id);

  return (
    <div className="flex flex-col">
      {detail.parent !== null && (
        <IssuePropertyRow icon={<ArrowCornerUpLeft />} label="Parent">
          <IssueRef orgId={orgId} issue={detail.parent} />
        </IssuePropertyRow>
      )}
      <IssuePropertyRow icon={<CircleHalfFill />} label="Status">
        <Menu>
          <PickerTrigger
            label="Status"
            placeholder={state === undefined}
            glyph={
              state && (
                <IssueStateIcon
                  icon={state.icon}
                  color={state.color}
                  className="size-(--icon-xs)"
                />
              )
            }
          >
            {state?.name ?? "Status"}
          </PickerTrigger>
          <MenuContent align="start" className="w-56">
            <IssueStatusOptions
              orgId={orgId}
              current={issue.stateId}
              onPick={(stateId) =>
                void actions.update({ stateId }, "Could not change the status")
              }
            />
          </MenuContent>
        </Menu>
      </IssuePropertyRow>
      <IssuePropertyRow icon={<Flag />} label="Priority">
        <Menu>
          <PickerTrigger
            label="Priority"
            glyph={
              <IssuePriorityIcon
                priority={issue.priority}
                className="size-(--icon-xs)"
              />
            }
          >
            {issuePriorityLabels[issue.priority]}
          </PickerTrigger>
          <MenuContent align="start" className="w-48">
            <IssuePriorityOptions
              current={issue.priority}
              onPick={(priority) =>
                void actions.update(
                  { priority },
                  "Could not change the priority",
                )
              }
            />
          </MenuContent>
        </Menu>
      </IssuePropertyRow>
      <IssuePropertyRow icon={<Calendar />} label="Due date">
        <DueDatePicker
          value={issue.dueAt}
          today={today}
          onChange={(dueAt) =>
            void actions.update(
              { dueAt },
              dueAt === null
                ? "Could not remove the due date"
                : "Could not set the due date",
            )
          }
          trigger={<button type="button" className={issuePropertyValue} />}
        >
          {issue.dueAt === undefined ? (
            <span className="font-normal text-muted-foreground-2">
              No due date
            </span>
          ) : (
            <span
              className={cx(
                isOverdue(issue.dueAt, today, closed) && "text-destructive",
              )}
            >
              {relativeDueLabel(issue.dueAt, today)}
            </span>
          )}
          <ChevronDownSmall className="size-(--icon-xs) text-icon-muted" />
        </DueDatePicker>
      </IssuePropertyRow>
      <IssuePropertyRow icon={<User />} label="Assignee">
        <AssigneeValue
          issue={issue}
          creator={detail.creator}
          actions={actions}
        />
      </IssuePropertyRow>
      <IssuePropertyRow icon={<Tag />} label="Labels">
        <Menu>
          <PickerTrigger
            label="Labels"
            placeholder={labels.length === 0}
            glyph={
              labels.length === 0 ? undefined : (
                <span className="flex items-center -space-x-0.5">
                  {labels.slice(0, 3).map((label) => (
                    <IssueLabelDot key={label.id} color={label.color} />
                  ))}
                </span>
              )
            }
          >
            {labels.length === 0
              ? "No labels"
              : labels.map((label) => label.name).join(", ")}
          </PickerTrigger>
          <MenuContent align="start" className="w-60">
            <IssueLabelOptions
              orgId={orgId}
              selected={labels.map((label) => label.id)}
              onChange={(labelIds) =>
                void actions.update(
                  { labelIds: labelIds as UpdateIssueRequest["labelIds"] },
                  "Could not change the labels",
                )
              }
            />
          </MenuContent>
        </Menu>
      </IssuePropertyRow>
      {showCreator && detail.creator !== null && (
        <IssuePropertyRow icon={<UserEdit />} label="Created by">
          <span className="flex min-w-0 items-center gap-1.5 text-xs text-foreground">
            <IssueActorAvatar actor={detail.creator} className="size-3.5" />
            <span className="min-w-0 truncate">
              {issueActorName(detail.creator)}
            </span>
          </span>
        </IssuePropertyRow>
      )}
      <IssuePropertyRow
        icon={<PullRequest />}
        label={detail.pulls.length > 1 ? "Pull requests" : "Pull request"}
      >
        <span className="flex min-w-0 flex-col items-start gap-0.5">
          {detail.pulls
            .filter((pull) => !closedPulls.includes(pull))
            .map(pullRow)}
          {closedPulls.length > 0 && (
            <button
              type="button"
              aria-expanded={showClosedPulls}
              className={cx(
                issuePropertyValue,
                "relative text-muted-foreground-2 hover:text-foreground",
                issueCoarseHitArea,
              )}
              onClick={() => setShowClosedPulls(!showClosedPulls)}
            >
              <span className="flex size-(--icon-xs) shrink-0 items-center justify-center">
                <ChevronDownSmall
                  className={cx(
                    "size-(--icon-xs) text-icon-muted transition-transform duration-100",
                    !showClosedPulls && "-rotate-90",
                  )}
                />
              </span>
              <span className="tabular-nums">
                {(["merged", "closed"] as const)
                  .flatMap((kind) => {
                    const count = closedPulls.filter(
                      (pull) => pull.state === kind,
                    ).length;
                    return count === 0 ? [] : [`${count} ${kind}`];
                  })
                  .join(" · ")}
              </span>
            </button>
          )}
          {showClosedPulls && closedPulls.map(pullRow)}
          <LinkMenu
            label="Link pull request"
            placeholder="owner/repo#123 or a pull request URL"
            onLink={(ref) => void actions.link(ref)}
          />
        </span>
      </IssuePropertyRow>
      <IssuePropertyRow
        icon={<Bubble />}
        label={detail.threads.length > 1 ? "Threads" : "Thread"}
      >
        <span className="flex min-w-0 flex-col items-start gap-0.5">
          {detail.threads.map((thread) => (
            <ThreadValueRow
              key={thread.jamId}
              thread={thread}
              onUnlink={() =>
                void actions.unlink({ kind: "thread", jamId: thread.jamId })
              }
            />
          ))}
          <LinkMenu
            label="Link thread"
            placeholder="Thread code like FRO-12"
            onLink={(ref) => void actions.link(ref)}
          />
        </span>
      </IssuePropertyRow>
      <IssuePropertyRow icon={<ChainLink />} label="Relations">
        <RelationList orgId={orgId} detail={detail} actions={actions} />
      </IssuePropertyRow>
    </div>
  );
}
