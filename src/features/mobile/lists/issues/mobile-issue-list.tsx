import { useState } from "react";
import { type IssueFilters, stateVisible } from "@/components/issues-filters";
import {
  groupIssues,
  type IssueGroup,
  IssueRow,
  visibleIssues,
} from "@/components/issues-list";
import type { IssueDisplay } from "@/components/issues-toolbar";
import type { OrgId } from "@/data/api/schemas/ids";
import type { IssueState, IssueSummary } from "@/data/api/schemas/issue";
import { useIsNarrow } from "@/features/mobile/use-mobile";
import { Button } from "@/primitives/button";
import { MobileListSection } from "../mobile-list-section";

export type MobileIssueListProps = {
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
};

const closedStartsCollapsed = (group: IssueGroup) => !group.closed;

/**
 * The issues list on phones: the desktop `IssueRow` (which trims the id,
 * labels and due chip through its own container queries) inside Collapsible
 * state sections, so a section opens in place.
 */
export function MobileIssueList({
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
}: MobileIssueListProps) {
  const mobile = useIsNarrow();
  const [openSections, setOpenSections] = useState<
    Readonly<Record<string, boolean>>
  >({});
  if (!mobile) return null;
  if (failed)
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 py-16 text-sm font-normal text-muted-foreground-2">
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
        data-slot="mobile-issue-list"
        className="flex flex-col gap-1 overflow-y-auto overscroll-contain px-2 pt-1 pb-16"
      >
        {[0, 1, 2].map((group) => (
          <div key={group} className="flex flex-col">
            <div className="flex h-9 items-center gap-2 rounded-(--radius-card) bg-section px-2">
              <span className="size-3 rounded bg-secondary" />
              <span className="h-3 w-16 rounded bg-secondary" />
            </div>
            {[0, 1].map((row) => (
              <div key={row} className="flex h-11 items-center gap-2 px-2">
                <span className="size-3.5 rounded-full bg-secondary" />
                <span className="h-3 w-48 rounded bg-secondary" />
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  const visible = visibleIssues(issues, filters, display, states);
  const groups = groupIssues(visible, display.grouping, {
    states: states.filter((state) => stateVisible(filters, state.id)),
    projectNames,
  }).filter((group) => group.issues.length > 0 || group.closed);
  if (!groups.some((group) => group.issues.length > 0))
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center py-16 text-sm font-normal text-muted-foreground-2">
        {emptyText}
      </div>
    );
  return (
    <div
      data-slot="mobile-issue-list"
      className="@container/list flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain px-2 pt-1 pb-16 [--issue-code-width:max-content]"
    >
      {groups.map((group) => {
        const open = openSections[group.key] ?? closedStartsCollapsed(group);
        return (
          <MobileListSection
            key={group.key}
            label={group.label}
            count={group.issues.length}
            open={open}
            onOpenChange={(next) =>
              setOpenSections((current) => ({ ...current, [group.key]: next }))
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
                      state={states.find((state) => state.id === issue.stateId)}
                      display={display}
                      now={now}
                    />
                  </li>
                ))}
              </ul>
            )}
          </MobileListSection>
        );
      })}
    </div>
  );
}
