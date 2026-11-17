import { useAtomSet } from "@effect/atom-react";
import { Link } from "@tanstack/react-router";
import { DateTime } from "effect";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";
import { IssueDueChip } from "@/components/issue-due";
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
import { Menu, MenuContent, MenuTrigger } from "@/primitives/menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import { ActorAvatar } from "../actor-filter";
import { type IssueFilters, localDate, stateVisible } from "../issues-filters";
import {
  ChevronDownGlyph,
  ChevronRightGlyph,
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
          aria-label="Change status"
          className="flex size-5 shrink-0 cursor-pointer items-center justify-center rounded outline-none hover:bg-secondary focus-visible:outline-ring-inset"
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
        className="flex size-3.5 items-center justify-center rounded border-hairline border-border-3 data-[checked]:border-foreground data-[checked]:bg-foreground data-[checked]:text-background"
      />
    </button>
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
}: IssueRowProps) {
  const hidden = (property: IssueDisplay["hidden"][number]) =>
    display.hidden.includes(property);
  const labels = hidden("labels") ? [] : (issue.labels ?? []);
  const unread = issue.viewer.unread || issue.viewer.mentions > 0;
  return (
    <Link
      to="/issues/$code"
      params={{ code: issue.code }}
      data-issue-row={issue.id}
      data-issue-code={issue.code}
      className="relative flex h-11 items-center gap-2 rounded px-2 outline-none select-none transition-colors duration-100 hover:bg-section focus-visible:outline-ring-inset data-[selected]:bg-section"
      onClick={(event) => {
        if (!selectionMode || onCheck === undefined || !event.shiftKey) return;
        event.preventDefault();
        onCheck(issue, true);
      }}
    >
      {checked === undefined || onCheck === undefined ? null : (
        <RowCheckbox
          checked={checked}
          visible={selectionMode}
          onCheck={(shift) => onCheck(issue, shift)}
        />
      )}
      <span className="flex size-5 shrink-0 items-center justify-center">
        <IssueStatusMenu issue={issue} orgId={orgId} state={state} />
      </span>
      {hidden("id") ? null : (
        <span className="@max-lg/list:hidden w-(--issue-code-width) shrink-0 text-xs font-normal whitespace-nowrap text-muted-foreground-2">
          {issue.code}
        </span>
      )}
      <span className="flex min-w-0 flex-1 items-center gap-1">
        <span
          className={
            "mask-fade-r overflow-hidden leading-5 whitespace-nowrap " +
            (issue.title.length > 10
              ? "w-0 max-w-max min-w-[10ch] grow "
              : "shrink-0 ") +
            (unread
              ? "font-semibold text-foreground"
              : "font-normal text-muted-foreground-1")
          }
        >
          {issue.title}
        </span>
        {issue.subIssueCount > 0 ? (
          <span className="ml-1 flex h-5 shrink-0 items-center gap-1 rounded border-hairline border-border-2 px-1.5 text-xs font-medium text-foreground">
            <span className="tabular-nums">
              {issue.closedSubIssueCount}/{issue.subIssueCount}
            </span>
            <ChevronRightGlyph className="size-(--icon-xs) text-muted-foreground-3" />
          </span>
        ) : null}
      </span>
      {labels.length > 0 ? (
        <span className="@max-md/list:hidden flex max-w-[40%] min-w-0 shrink items-center justify-end gap-1 overflow-hidden">
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
      <span className="flex shrink-0 items-center gap-2">
        {issue.viewer.mentions > 0 ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <Badge
                  variant="filled"
                  size="count"
                  color="accent"
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
          {issue.assignee === null || hidden("assignee") ? null : (
            <ActorAvatar
              name={issue.assignee.name}
              avatarUrl={issue.assignee.avatarUrl}
            />
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
}

function IssueSection({
  group,
  open,
  onOpenChange,
  children,
}: {
  group: IssueGroup;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  const Chevron = open ? ChevronDownGlyph : ChevronRightGlyph;
  return (
    <section className="flex flex-col">
      <button
        type="button"
        aria-expanded={open}
        className="flex h-9 w-full cursor-pointer items-center gap-2 rounded bg-section px-2 text-sm font-medium text-foreground outline-none select-none focus-visible:outline-ring-inset"
        onClick={() => onOpenChange(!open)}
      >
        <span className="flex size-5 shrink-0 items-center justify-center">
          <Chevron className="size-(--icon-xs) shrink-0 text-muted-foreground-3" />
        </span>
        {group.label}
        {open || !group.closed ? (
          <span className="font-normal text-muted-foreground-2 tabular-nums">
            {group.issues.length}
          </span>
        ) : null}
      </button>
      {open ? <div className="-m-0.5 p-0.5">{children}</div> : null}
    </section>
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
}: IssuesListProps) {
  const [openSections, setOpenSections] = useState<
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
          <div key={row} className="flex h-11 items-center gap-2 px-2">
            <span className="size-3.5 rounded-full bg-secondary" />
            <span className="h-2.5 w-12 rounded bg-secondary" />
            <span className="h-2.5 w-48 rounded bg-secondary" />
          </div>
        ))}
      </div>
    );
  const visible = visibleIssues(issues, filters, display, states);
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
                  {group.issues.map((issue) => (
                    <li key={issue.id} className="group/row">
                      <IssueRow
                        issue={issue}
                        orgId={orgId}
                        state={states.find(
                          (state) => state.id === issue.stateId,
                        )}
                        display={display}
                        now={now}
                        checked={checked?.has(issue.id)}
                        selectionMode={(checked?.size ?? 0) > 0}
                        onCheck={onCheck}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </IssueSection>
          );
        })}
    </div>
  );
}
