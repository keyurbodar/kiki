import { useAtomSet } from "@effect/atom-react";
import { Link } from "@tanstack/react-router";
import { DateTime } from "effect";
import {
  Fragment,
  type MouseEvent,
  type ReactNode,
  useId,
  useState,
} from "react";
import { toast } from "sonner";
import type { ActorSources } from "@/components/actor-filter";
import { IssueDueChip } from "@/components/issue-due";
import { IssueRowContextMenu } from "@/components/issue-menu/issue-row-context-menu";
import { CircleBanGlyph } from "@/components/issue-pickers";
import { IssuePullChips } from "@/components/issue-pulls";
import {
  IssueRelationChip,
  issueRelationSides,
} from "@/components/issue-relations";
import {
  type ChipIssue,
  MarkdownChipsProvider,
} from "@/components/markdown-chips";
import { IssuePreview } from "@/components/markdown-chips/previews";
import { UserAvatar } from "@/components/user-menu/user-avatar";
import type { OrgId } from "@/data/api/schemas/ids";
import type {
  IssuePriority,
  IssueState,
  IssueSummary,
} from "@/data/api/schemas/issue";
import { reactivityKeys } from "@/data/atoms/conventions";
import { updateIssueAtom } from "@/data/atoms/issues";
import {
  IssueLabelDot,
  IssuePriorityIcon,
  IssueStateIcon,
} from "@/features/issues/issue-parts";
import { IssueStatusOptions } from "@/features/issues/issue-pickers";
import { Badge } from "@/primitives/badge";
import { Button } from "@/primitives/button";
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@/primitives/collapsible";
import { Icon } from "@/primitives/icon";
import { Menu, MenuContent, MenuTrigger } from "@/primitives/menu";
import {
  PreviewCard,
  PreviewCardContent,
  PreviewCardTrigger,
} from "@/primitives/preview-card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import { type IssueFilters, localDate, stateVisible } from "../issues-filters";
import {
  ChevronDownGlyph,
  type IssueDisplay,
  type IssueGrouping,
} from "../issues-toolbar";

const priorityRank: Record<IssuePriority, number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
};

/** Capy's minified age: "now", "56m", "2h", "1d", "3w", "2mo", "1y". */
export const shortAge = (at: DateTime.Utc, now: number) => {
  const minutes = Math.max(
    0,
    Math.floor((now - DateTime.toEpochMillis(at)) / 60_000),
  );
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.floor(days / 7)}w`;
  if (days < 365) return `${Math.floor(days / 30)}mo`;
  return `${Math.floor(days / 365)}y`;
};

export const compareIssues =
  (
    display: Pick<IssueDisplay, "order" | "direction">,
    states: ReadonlyArray<IssueState>,
  ) =>
  (a: IssueSummary, b: IssueSummary) => {
    const dir = display.direction === "asc" ? 1 : -1;
    const position = (issue: IssueSummary) =>
      states.find((state) => state.id === issue.stateId)?.position ?? 0;
    const updated =
      DateTime.toEpochMillis(b.updatedAt) - DateTime.toEpochMillis(a.updatedAt);
    switch (display.order) {
      case "title":
        return dir * a.title.localeCompare(b.title);
      case "created":
        return (
          dir *
          (DateTime.toEpochMillis(a.createdAt) -
            DateTime.toEpochMillis(b.createdAt))
        );
      case "updated":
        return -dir * updated;
      case "due":
        return dir * (a.dueAt ?? "9999").localeCompare(b.dueAt ?? "9999");
      case "status":
        return dir * (position(a) - position(b)) || updated;
      case "priority":
        return (
          dir * (priorityRank[a.priority] - priorityRank[b.priority]) || updated
        );
    }
  };

/** The rows the list draws: state filters, closed sub-issues, sub-issue folding, then order. */
export const visibleIssues = (
  issues: ReadonlyArray<IssueSummary>,
  filters: Pick<IssueFilters, "stateIds" | "stateNot" | "hideClosedSubIssues">,
  display: Pick<IssueDisplay, "order" | "direction" | "subIssues">,
  states: ReadonlyArray<IssueState>,
) => {
  const closedStateIds = new Set(
    states.filter((state) => state.type === "closed").map((state) => state.id),
  );
  const matching = issues
    .filter((issue) => stateVisible(filters, issue.stateId))
    .filter(
      (issue) =>
        !filters.hideClosedSubIssues ||
        issue.parentIssueId === null ||
        !closedStateIds.has(issue.stateId),
    );
  const matchingIds = new Set(matching.map((issue) => issue.id));
  const folded =
    display.subIssues === "collapsed"
      ? matching.filter(
          (issue) =>
            issue.parentIssueId === null ||
            !matchingIds.has(issue.parentIssueId),
        )
      : matching;
  return folded.toSorted(compareIssues(display, states));
};

export type IssueGroup = {
  readonly key: string;
  readonly label: string;
  readonly icon?: ReactNode;
  readonly closed: boolean;
  readonly issues: ReadonlyArray<IssueSummary>;
};

export type IssueGroupContext = {
  readonly states: ReadonlyArray<IssueState>;
  readonly projectNames: Readonly<Record<string, string>>;
};

const priorityLabels: Record<IssuePriority, string> = {
  urgent: "Urgent",
  high: "High",
  normal: "Normal",
  low: "Low",
};

/** Splits issues into sections. Status keeps every visible state, empty or not. */
export const groupIssues = (
  issues: ReadonlyArray<IssueSummary>,
  grouping: IssueGrouping,
  context: IssueGroupContext,
): ReadonlyArray<IssueGroup> => {
  if (grouping === "status")
    return context.states
      .toSorted((a, b) => a.position - b.position)
      .map((state) => ({
        key: state.id,
        label: state.name,
        icon: <IssueStateIcon icon={state.icon} color={state.color} />,
        closed: state.type === "closed",
        issues: issues.filter((issue) => issue.stateId === state.id),
      }));
  if (grouping === "none")
    return [{ key: "all", label: "All issues", closed: false, issues }];
  const keyed = issues.flatMap((issue) => {
    switch (grouping) {
      case "priority":
        return [
          { key: issue.priority, label: priorityLabels[issue.priority], issue },
        ];
      case "assignee":
        return [
          issue.assignee === null
            ? { key: "", label: "No assignee", issue }
            : { key: issue.assignee.id, label: issue.assignee.name, issue },
        ];
      case "project":
        return [
          {
            key: issue.projectId,
            label: context.projectNames[issue.projectId] ?? "Project",
            issue,
          },
        ];
      default:
        return (issue.labels ?? []).length === 0
          ? [{ key: "", label: "No label", issue }]
          : (issue.labels ?? []).map((label) => ({
              key: label.id,
              label: label.name,
              issue,
            }));
    }
  });
  const groups = new Map<
    string,
    { label: string; issues: Array<IssueSummary> }
  >();
  for (const entry of keyed) {
    const group = groups.get(entry.key) ?? { label: entry.label, issues: [] };
    group.issues.push(entry.issue);
    groups.set(entry.key, group);
  }
  const ordered = [...groups.entries()];
  if (grouping === "priority")
    ordered.sort(
      ([a], [b]) =>
        priorityRank[a as IssuePriority] - priorityRank[b as IssuePriority],
    );
  else
    ordered.sort(([a, x], [b, y]) =>
      a === "" ? 1 : b === "" ? -1 : x.label.localeCompare(y.label),
    );
  return ordered.map(([key, group]) => ({
    key,
    label: group.label,
    closed: false,
    issues: group.issues,
  }));
};

function IssueStatusMenu({
  issue,
  orgId,
  state,
}: {
  issue: IssueSummary;
  orgId: OrgId;
  state: IssueState | undefined;
}) {
  const update = useAtomSet(updateIssueAtom, { mode: "promise" });
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: keeps clicks in the status menu from opening the row link, as Capy's isolate span does
    <span
      className="contents"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <Menu>
        <MenuTrigger
          dataSlot={null}
          aria-label="Change status"
          className="relative -m-1 flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-(--radius) outline-none hover:bg-secondary focus-visible:outline-ring-inset data-[popup-open]:bg-secondary pointer-coarse:after:absolute pointer-coarse:after:-inset-2.5"
        >
          {state === undefined ? null : (
            <IssueStateIcon icon={state.icon} color={state.color} />
          )}
        </MenuTrigger>
        <MenuContent align="start" className="w-56">
          <IssueStatusOptions
            orgId={orgId}
            current={issue.stateId}
            onPick={(stateId) =>
              void update({
                params: { orgId, code: issue.code },
                payload: { stateId },
                reactivityKeys: [
                  reactivityKeys.issue(orgId, issue.code),
                  reactivityKeys.issues(orgId),
                ],
              }).catch(() => toast.error("Could not change the status"))
            }
          />
        </MenuContent>
      </Menu>
    </span>
  );
}

function RowCheckbox({
  checked,
  visible,
  onCheck,
}: {
  checked: boolean;
  visible: boolean;
  onCheck: (shift: boolean) => void;
}) {
  return (
    <button
      type="button"
      aria-label={checked ? "Deselect issue" : "Select issue"}
      aria-pressed={checked}
      className={
        "flex w-4 shrink-0 cursor-pointer items-center justify-center opacity-0 outline-none transition-opacity duration-100 group-hover/row:opacity-100 focus-visible:opacity-100 focus-visible:outline-ring-inset pointer-coarse:hidden" +
        (checked || visible ? " opacity-100 pointer-coarse:flex" : "")
      }
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onCheck(event.shiftKey);
      }}
    >
      <span
        data-checked={checked ? "" : undefined}
        className="relative flex size-4 shrink-0 items-center justify-center rounded-(--radius-sm) border-hairline border-border-3 bg-input text-primary-foreground transition-colors duration-100 data-[checked]:border-transparent data-[checked]:bg-primary data-[checked]:[--focus-ring:var(--primary-text)]"
      />
    </button>
  );
}

/** Capy's sub-issue badge: a progress ring, the closed count and an expand chevron. */
function SubIssueBadge({
  closed,
  total,
  open,
  onToggle,
}: {
  closed: number;
  total: number;
  open: boolean;
  onToggle?: () => void;
}) {
  const plural = total === 1 ? "" : "s";
  const label = `${open ? "Collapse" : "Expand"} ${total} sub-issue${plural}`;
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Badge
            variant="default"
            size="xs"
            interactive={onToggle !== undefined}
            aria-label={label}
            aria-expanded={onToggle === undefined ? undefined : open}
            onClick={(event: MouseEvent<HTMLDivElement>) => {
              event.preventDefault();
              event.stopPropagation();
              onToggle?.();
            }}
          />
        }
      >
        <svg
          viewBox="0 0 16 16"
          className="size-3 text-muted-foreground-1"
          role="progressbar"
          aria-label={`${closed} of ${total} sub-issue${plural} closed`}
        >
          <circle
            cx="8"
            cy="8"
            r="6"
            fill="none"
            stroke="var(--border-3)"
            strokeWidth="2"
          />
          <circle
            cx="8"
            cy="8"
            r="6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            pathLength="100"
            strokeDasharray={`${(closed / Math.max(total, 1)) * 100} 100`}
            transform="rotate(-90 8 8)"
          />
        </svg>
        <span className="tabular-nums">
          {closed}/{total}
        </span>
        <ChevronDownGlyph
          className={
            "-mr-0.5 size-(--icon-xs) transition-transform duration-100" +
            (open ? " rotate-0" : " -rotate-90")
          }
        />
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

/**
 * Capy's tree line beside a nested row: a vertical run for the branch, an
 * elbow for the row itself, and an end for the last child.
 */
function IssueTreeConnector({
  kind,
  height,
  className,
}: {
  kind: "root" | "branch" | "last";
  height: number;
  className?: string;
}) {
  const center = height / 2;
  const path =
    kind === "root"
      ? `M0.5 ${center + 10} V${height}`
      : kind === "last"
        ? `M0.5 0 V${center - 6} A6 6 0 0 0 6.5 ${center} H10.5`
        : `M0.5 0 V${height} M0.5 ${center - 6} A6 6 0 0 0 6.5 ${center} H10.5`;
  const mask = useId().replace(/[^a-zA-Z0-9_-]/gu, "");
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute top-0 left-(--issue-tree-line-inset) h-full w-3 overflow-visible text-border-1 ${className ?? ""}`}
    >
      <svg aria-hidden width="12" height={height} className="overflow-visible">
        <mask
          id={mask}
          maskUnits="userSpaceOnUse"
          x="-1"
          y="-1"
          width="14"
          height={height + 2}
        >
          <path
            d={path}
            stroke="white"
            strokeWidth={1}
            fill="none"
            className="-translate-y-(--spacing-hairline) [@media(min-resolution:2dppx)]:translate-x-(--spacing-hairline) [@media(min-resolution:2dppx)]:translate-y-0"
          />
        </mask>
        <rect
          x="-1"
          y="-1"
          width="14"
          height={height + 2}
          fill="currentColor"
          mask={`url(#${mask})`}
        />
      </svg>
    </span>
  );
}

/** Capy's row relations: a blocked-by badge and a blocking badge, when either applies. */
function IssueRelations({ issue }: { issue: IssueSummary }) {
  const open = issue.openBlockers ?? 0;
  const sides = ["blockedBy", "blocking"] as const;
  if (issue.blockedBy === undefined && open > 0) {
    const label = open === 1 ? "Blocked" : `Blocked by ${open}`;
    return (
      <Badge
        size="xs"
        className="shrink-0"
        data-issue-relation="blockedBy"
        aria-label={label}
      >
        <CircleBanGlyph className="text-destructive" />
        <span className="whitespace-nowrap @max-md/list:hidden">{label}</span>
        <span className="hidden tabular-nums @max-md/list:inline">{open}</span>
      </Badge>
    );
  }
  return (
    <>
      {sides.map((side) => {
        const refs = issue[side] ?? [];
        const first = refs[0];
        if (first === undefined) return null;
        const total = Math.max(
          refs.length,
          (side === "blockedBy" ? issue.openBlockers : issue.blockingCount) ??
            0,
        );
        const capped = side === "blocking" && total >= 100;
        const label = capped
          ? `${issueRelationSides[side].label} 99+`
          : side === "blocking" || total > 1
            ? `${issueRelationSides[side].label} ${total}`
            : `${issueRelationSides[side].label} ${first.code}`;
        return (
          <IssueRelationChip
            key={side}
            side={side}
            subject={issue.code}
            refs={refs}
            total={total}
            capped={capped}
            label={label}
            count={capped ? "99+" : String(total)}
          />
        );
      })}
    </>
  );
}

export type IssueRowProps = {
  issue: IssueSummary;
  orgId: OrgId;
  state: IssueState | undefined;
  display: IssueDisplay;
  now: number;
  checked?: boolean;
  selectionMode?: boolean;
  onCheck?: (issue: IssueSummary, shift: boolean) => void;
  /** Whether this row's sub-issues are showing under it. */
  subIssuesOpen?: boolean;
  onToggleSubIssues?: () => void;
  /** Depth under an expanded parent: Capy indents a sub-issue row one step. */
  nested?: boolean;
  /** A nested row that is the last of its siblings ends the tree line. */
  lastChild?: boolean;
  /** The page draws its rows tall; a pane's are one short line. */
  density?: IssueDensity;
};

/** Capy's IssueRow at page density: status, ID, title, badges, properties. */
export function IssueRow({
  issue,
  orgId,
  state,
  display,
  now,
  checked,
  selectionMode = false,
  onCheck,
  subIssuesOpen = false,
  onToggleSubIssues,
  nested = false,
  lastChild = false,
  density = "page",
}: IssueRowProps) {
  const pane = density === "pane";
  const hidden = (property: IssueDisplay["hidden"][number]) =>
    display.hidden.includes(property);
  const labels = hidden("labels") ? [] : (issue.labels ?? []);
  const pulls = hidden("pulls") ? [] : (issue.pulls ?? []);
  const actors = hidden("assignee")
    ? []
    : (issue.assignees ?? (issue.assignee === null ? [] : [issue.assignee]));
  const relations = hidden("relations") ? null : (
    <IssueRelations issue={issue} />
  );
  const unread = issue.viewer.unread || issue.viewer.mentions > 0;
  const chipIssue: ChipIssue = {
    code: issue.code,
    title: issue.title,
    status: issue.status,
    stateName: state?.name,
    priority: issue.priority,
    visibility: issue.visibility === "private" ? "private" : "shared",
    assignee:
      issue.assignee === null
        ? null
        : {
            name: issue.assignee.name,
            avatarUrl: issue.assignee.avatarUrl ?? undefined,
          },
  };
  const row = (
    <Link
      to="/issues/$code"
      params={{ code: issue.code }}
      data-issue-row={issue.id}
      data-issue-code={issue.code}
      data-density={pane ? "pane" : "page"}
      data-padding={pane ? undefined : "tight"}
      data-nested={nested ? "true" : undefined}
      className={
        "kiki-row relative rounded-(--radius) outline-none select-none transition-colors duration-100 hover:bg-section focus-visible:outline-ring-inset data-[selected]:bg-section" +
        (pane ? " text-sm" : "")
      }
      onClick={(event) => {
        if (!selectionMode || onCheck === undefined || !event.shiftKey) return;
        event.preventDefault();
        onCheck(issue, true);
      }}
      onKeyDown={(event) => {
        if (onToggleSubIssues === undefined) return;
        if (event.altKey || event.metaKey || event.ctrlKey || event.shiftKey)
          return;
        if (event.key !== (subIssuesOpen ? "ArrowLeft" : "ArrowRight")) return;
        event.preventDefault();
        onToggleSubIssues();
      }}
    >
      {nested || subIssuesOpen ? (
        <IssueTreeConnector
          kind={nested ? (lastChild ? "last" : "branch") : "root"}
          height={44}
          className={
            checked === undefined
              ? undefined
              : "left-(--issue-tree-line-checked-inset)"
          }
        />
      ) : null}
      {checked === undefined || onCheck === undefined ? null : (
        <RowCheckbox
          checked={checked}
          visible={selectionMode}
          onCheck={(shift) => onCheck(issue, shift)}
        />
      )}
      <span className="kiki-icon" data-size="base">
        <IssueStatusMenu issue={issue} orgId={orgId} state={state} />
      </span>
      {hidden("id") ? null : (
        <span className="@max-lg/list:hidden w-(--issue-code-width) shrink-0 text-xs font-normal whitespace-nowrap text-muted-foreground-2">
          {issue.code}
        </span>
      )}
      <span className="flex flex-1 items-center gap-1">
        <span
          className={
            "mask-fade-r overflow-hidden leading-5 whitespace-nowrap " +
            (issue.title.length > 10
              ? "w-0 max-w-max min-w-[10ch] grow "
              : "shrink-0 ") +
            (unread
              ? "font-semibold text-foreground"
              : "font-normal text-foreground/80 dark:text-muted-foreground-1")
          }
        >
          {issue.title}
        </span>
        {issue.visibility === "private" ? (
          <span
            role="img"
            aria-label="Only specific people"
            className="size-3 shrink-0 text-muted-foreground-2"
          >
            <Icon name="lock" className="size-3 shrink-0" />
          </span>
        ) : null}
        <span className="ml-1 flex shrink-0 items-center gap-1">
          {relations}
          {issue.subIssueCount > 0 ? (
            <SubIssueBadge
              closed={issue.closedSubIssueCount}
              total={issue.subIssueCount}
              open={subIssuesOpen}
              onToggle={onToggleSubIssues}
            />
          ) : null}
        </span>
      </span>
      {pulls.length > 0 || labels.length > 0 ? (
        <span className="flex max-w-[40%] min-w-0 shrink items-center justify-end gap-1">
          {pulls.length > 0 ? <IssuePullChips pulls={pulls} /> : null}
          {labels.length > 0 ? (
            <span className="@max-md/list:hidden flex min-w-0 shrink items-center justify-end gap-1 overflow-hidden">
              {labels.map((label) => (
                <span
                  key={label.id}
                  className="flex h-5 shrink-0 items-center gap-1 rounded border-hairline border-border-2 px-1.5 text-xs font-normal text-muted-foreground-1"
                >
                  <IssueLabelDot color={label.color} />
                  {label.name}
                </span>
              ))}
            </span>
          ) : null}
        </span>
      ) : null}
      <span className="flex shrink-0 items-center gap-2">
        {issue.viewer.mentions > 0 ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <Badge
                  variant="filled"
                  size="count"
                  color="accent"
                  interactive={false}
                  aria-label={`${issue.viewer.mentions} unread ${issue.viewer.mentions === 1 ? "mention" : "mentions"} of you`}
                  className="h-3.5 min-w-4.5 shrink-0 gap-0 px-1"
                />
              }
            >
              {issue.viewer.mentions > 99
                ? "99+"
                : String(issue.viewer.mentions)}
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {`${issue.viewer.mentions} unread ${issue.viewer.mentions === 1 ? "mention" : "mentions"} of you`}
            </TooltipContent>
          </Tooltip>
        ) : null}
        {issue.dueAt === undefined || hidden("due") ? null : (
          <span className="@max-sm/list:hidden flex">
            <IssueDueChip
              due={issue.dueAt}
              today={localDate(now)}
              closed={state?.type === "closed"}
            />
          </span>
        )}
        {hidden("priority") ? null : (
          <IssuePriorityIcon priority={issue.priority} />
        )}
      </span>
      <span className="flex shrink-0 items-center gap-1.5">
        <span className="flex min-w-4 items-center justify-end">
          {actors.length === 0 || hidden("assignee") ? null : (
            <Tooltip>
              <TooltipTrigger render={<span className="flex" />}>
                <span className="flex shrink-0 items-center gap-0.5">
                  {actors.slice(0, 3).map((actor) => (
                    <UserAvatar
                      key={actor.id}
                      src={actor.avatarUrl}
                      name={actor.name}
                      size="xs"
                    />
                  ))}
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {actors
                  .map((actor) =>
                    actor.code === null || actor.captain
                      ? actor.name
                      : `${actor.code} ${actor.name}`,
                  )
                  .join(", ")}
              </TooltipContent>
            </Tooltip>
          )}
        </span>
        {hidden("updated") ? null : (
          <span className="w-6 text-right text-xs font-normal text-muted-foreground-2 tabular-nums">
            {shortAge(issue.updatedAt, now)}
          </span>
        )}
      </span>
    </Link>
  );
  return (
    <PreviewCard>
      <PreviewCardTrigger render={row} />
      <PreviewCardContent side="right" align="start">
        <MarkdownChipsProvider
          value={{
            renderIssueState: (_issue, className) =>
              state === undefined ? null : (
                <IssueStateIcon
                  icon={state.icon}
                  color={state.color}
                  className={className}
                />
              ),
            renderIssuePriority: (chipIssue, className) => (
              <IssuePriorityIcon
                priority={chipIssue.priority}
                className={className}
              />
            ),
          }}
        >
          <IssuePreview issue={chipIssue} />
        </MarkdownChipsProvider>
      </PreviewCardContent>
    </PreviewCard>
  );
}

export type IssueDensity = "page" | "pane";

function IssueSection({
  group,
  open,
  onOpenChange,
  density,
  children,
}: {
  group: IssueGroup;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  density: IssueDensity;
  children: ReactNode;
}) {
  const pane = density === "pane";
  const count = String(group.issues.length);
  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      {pane ? (
        <div className="kiki-pane-section w-full bg-section">
          <CollapsibleTrigger
            block
            showChevron={false}
            className="kiki-pane-section-trigger flex-1 text-xs"
          >
            <span className="text-foreground">{group.label}</span>
            <span className="font-normal text-muted-foreground-3 tabular-nums">
              {count}
            </span>
          </CollapsibleTrigger>
        </div>
      ) : (
        <CollapsibleTrigger tone="section" block showChevron={false}>
          <span className="kiki-icon" data-size="base">
            <ChevronDownGlyph className="size-(--icon-xs) shrink-0 text-muted-foreground-3 transition-transform duration-100 group-data-[panel-open]/collapsible:rotate-0 -rotate-90" />
          </span>
          {group.label}
          {open || !group.closed ? (
            <span className="font-normal text-muted-foreground-2 tabular-nums">
              {count}
            </span>
          ) : null}
        </CollapsibleTrigger>
      )}
      <CollapsiblePanel className={pane ? undefined : "-m-0.5 p-0.5"}>
        {group.issues.length === 0 ? (
          <div
            className={
              (pane
                ? "kiki-pane-empty"
                : "flex h-11 items-center px-2 pt-0.5") +
              " text-sm font-normal text-muted-foreground-2"
            }
          >
            No issues in {group.label}
          </div>
        ) : (
          children
        )}
      </CollapsiblePanel>
    </Collapsible>
  );
}

export type IssuesListProps = {
  orgId: OrgId;
  issues: ReadonlyArray<IssueSummary> | undefined;
  states: ReadonlyArray<IssueState> | undefined;
  filters: Pick<IssueFilters, "stateIds" | "stateNot" | "hideClosedSubIssues">;
  display: IssueDisplay;
  projectNames: Readonly<Record<string, string>>;
  now: number;
  emptyText: string;
  failed?: boolean;
  onRetry?: () => void;
  checked?: ReadonlyMap<string, IssueSummary>;
  onCheckedChange?: (checked: ReadonlyMap<string, IssueSummary>) => void;
  /** The people, Captains and threads a row menu's Assignee row offers. */
  actors?: ActorSources;
  /** Defaults to the page's rows and full section headers. */
  density?: IssueDensity;
  /** Opens an issue in place; without it a row navigates to the issue page. */
  onOpenIssue?: (code: string) => void;
};

/** Capy's IssuesList: state sections of issue rows, with loading and empty states. */
export function IssuesList({
  orgId,
  issues,
  states,
  filters,
  display,
  projectNames,
  now,
  emptyText,
  failed = false,
  onRetry,
  checked,
  onCheckedChange,
  actors,
  density = "page",
  onOpenIssue,
}: IssuesListProps) {
  const [openSections, setOpenSections] = useState<
    Readonly<Record<string, boolean>>
  >({});
  const [expandedRows, setExpandedRows] = useState<
    Readonly<Record<string, boolean>>
  >({});
  const [anchor, setAnchor] = useState<string | null>(null);
  if (failed)
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-sm font-normal text-muted-foreground-2">
        Could not load issues
        {onRetry === undefined ? null : (
          <Button variant="ghost" size="xs" onClick={onRetry}>
            Retry loading
          </Button>
        )}
      </div>
    );
  if (issues === undefined || states === undefined)
    return (
      <div
        role="status"
        aria-label="Loading issues"
        className="flex flex-col px-2 pt-1"
      >
        <div className="flex h-7 items-center gap-2 rounded bg-section px-2">
          <span className="h-2.5 w-16 rounded bg-secondary" />
        </div>
        {[0, 1, 2].map((row) => (
          <div
            key={row}
            data-density={density === "pane" ? "pane" : undefined}
            className={
              density === "pane"
                ? "kiki-row"
                : "flex h-11 items-center gap-2 px-2"
            }
          >
            <span className="size-3.5 rounded-full bg-secondary" />
            <span className="h-2.5 w-12 rounded bg-secondary" />
            <span className="h-2.5 w-48 rounded bg-secondary" />
          </div>
        ))}
      </div>
    );
  const subIssuesByParent = new Map<string, Array<IssueSummary>>();
  for (const issue of issues) {
    if (issue.parentIssueId === null) continue;
    if (!stateVisible(filters, issue.stateId)) continue;
    const siblings = subIssuesByParent.get(issue.parentIssueId) ?? [];
    siblings.push(issue);
    subIssuesByParent.set(issue.parentIssueId, siblings);
  }
  const subIssuesOf = (issue: IssueSummary) =>
    (subIssuesByParent.get(issue.id) ?? []).toSorted(
      compareIssues(display, states),
    );
  const visible = visibleIssues(issues, filters, display, states).filter(
    (issue) =>
      issue.parentIssueId === null ||
      expandedRows[issue.parentIssueId] !== true,
  );
  const groups = groupIssues(visible, display.grouping, {
    states: states.filter((state) => stateVisible(filters, state.id)),
    projectNames,
  });
  const anyIssue = groups.some((group) => group.issues.length > 0);
  const order = groups.flatMap((group) => group.issues);
  const onCheck =
    checked === undefined || onCheckedChange === undefined
      ? undefined
      : (issue: IssueSummary, shift: boolean) => {
          const next = new Map(checked);
          const from =
            shift && anchor !== null
              ? order.findIndex((row) => row.id === anchor)
              : -1;
          const to = order.findIndex((row) => row.id === issue.id);
          if (from !== -1 && to !== -1) {
            for (const row of order.slice(
              Math.min(from, to),
              Math.max(from, to) + 1,
            ))
              next.set(row.id, row);
          } else {
            setAnchor(issue.id);
            if (next.has(issue.id)) next.delete(issue.id);
            else next.set(issue.id, issue);
          }
          onCheckedChange(next);
        };
  const renderRow = (
    issue: IssueSummary,
    nested: boolean,
    ancestors: ReadonlySet<string> = new Set(),
    lastChild = false,
  ): ReactNode => {
    const subIssues = ancestors.has(issue.id) ? [] : subIssuesOf(issue);
    const subIssuesOpen = expandedRows[issue.id] ?? false;
    return (
      <Fragment key={issue.id}>
        <li className="group/row">
          <IssueRowContextMenu
            issue={issue}
            actors={actors}
            onOpenIssue={onOpenIssue}
          >
            <IssueRow
              issue={issue}
              orgId={orgId}
              state={states.find((state) => state.id === issue.stateId)}
              display={display}
              now={now}
              checked={checked?.has(issue.id)}
              selectionMode={(checked?.size ?? 0) > 0}
              onCheck={onCheck}
              nested={nested}
              lastChild={lastChild}
              density={density}
              subIssuesOpen={subIssuesOpen && subIssues.length > 0}
              onToggleSubIssues={
                subIssues.length === 0
                  ? undefined
                  : () =>
                      setExpandedRows((current) => ({
                        ...current,
                        [issue.id]: !subIssuesOpen,
                      }))
              }
            />
          </IssueRowContextMenu>
        </li>
        {subIssuesOpen
          ? subIssues.map((child, index) =>
              renderRow(
                child,
                true,
                new Set([...ancestors, issue.id]),
                index === subIssues.length - 1,
              ),
            )
          : null}
      </Fragment>
    );
  };
  return (
    <div className="@container/list flex flex-col gap-1 px-2 pt-1 [--issue-code-width:max-content]">
      {anyIssue ? null : (
        <div className="flex items-center justify-center py-16 text-sm font-normal text-muted-foreground-2">
          {emptyText}
        </div>
      )}
      {groups
        .filter((group) => group.issues.length > 0 || group.closed)
        .map((group) => {
          const open = openSections[group.key] ?? !group.closed;
          return (
            <IssueSection
              key={group.key}
              group={group}
              open={open}
              density={density}
              onOpenChange={(next) =>
                setOpenSections((current) => ({
                  ...current,
                  [group.key]: next,
                }))
              }
            >
              {group.issues.length === 0 ? (
                <div className="flex h-11 items-center px-2 pt-0.5 text-sm font-normal text-muted-foreground-2">
                  No issues in {group.label}
                </div>
              ) : (
                <ul className="flex flex-col pt-0.5">
                  {group.issues.map((issue) => renderRow(issue, false))}
                </ul>
              )}
            </IssueSection>
          );
        })}
    </div>
  );
}
