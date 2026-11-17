import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import { type ReactNode, useState } from "react";
import type {
  IssueSummary,
  UpdateIssueRequest,
} from "@/data/api/schemas/issue";
import { orgMembersAtom } from "@/data/atoms/billing";
import {
  markIssueSeenAtom,
  setIssueSubscriptionAtom,
  updateIssueAtom,
} from "@/data/atoms/issues";
import { currentUserAtom } from "@/data/atoms/session";
import { issueMenuKeys } from "@/features/issues/issue-menu";
import { useIssueOrgId } from "@/features/issues/issue-parts";
import {
  IssuePriorityOptions,
  IssueStatusOptions,
} from "@/features/issues/issue-pickers";
import { BulkBar } from "@/primitives/bulk-bar";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import {
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuItem,
  MenuTrigger,
} from "@/primitives/menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import {
  menuIconSlotClassName,
  menuListClassName,
  menuPartsClassName,
  menuPopupClassName,
} from "../issue-menu";
import { settleBulk, toBulkMembers } from "./bulk";

const track = (owner: string) =>
  `shared/issues/issues-bulk-bar.tsx#IssuesBulkBar:${owner}`;

/** Hides a bulk action's label when the bar's container is narrower than xl. */
function CollapseLabel({ children }: { children: ReactNode }) {
  return <span className="@max-xl/bulk:hidden">{children}</span>;
}

function BulkAction({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger render={children as React.ReactElement} />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

const popup = (width: string) =>
  `${menuPopupClassName} ${menuPartsClassName} ${width}`;

function MenuList({ children }: { children: ReactNode }) {
  return (
    <div role="presentation" data-menu-list className={menuListClassName}>
      {children}
    </div>
  );
}

function AssigneeOptions({
  orgId,
  onChange,
}: {
  orgId: string;
  onChange: (ids: ReadonlyArray<string>) => void;
}) {
  const [selected, setSelected] = useState<ReadonlyArray<string>>([]);
  const result = useAtomValue(orgMembersAtom(orgId));
  const members = AsyncResult.isSuccess(result)
    ? toBulkMembers(result.value)
    : [];
  return members.map((member) => (
    <MenuCheckboxItem
      key={member.id}
      checked={selected.includes(member.id)}
      onCheckedChange={(checked) => {
        const next = checked
          ? [...selected, member.id]
          : selected.filter((id) => id !== member.id);
        setSelected(next);
        onChange(next);
      }}
    >
      <span className="min-w-0 truncate">{member.name}</span>
    </MenuCheckboxItem>
  ));
}

export type IssuesBulkBarProps = {
  /** The checked issues, keyed by id. */
  checked: ReadonlyMap<string, IssueSummary>;
  onClear: () => void;
};

/** Capy's IssuesBulkBar: status, priority, assignee and notification actions for every checked issue. */
export function IssuesBulkBar({ checked, onClear }: IssuesBulkBarProps) {
  const orgId = useIssueOrgId();
  const user = useAtomValue(currentUserAtom);
  const userId = AsyncResult.isSuccess(user) ? user.value.id : undefined;
  const update = useAtomSet(updateIssueAtom, { mode: "promise" });
  const markSeen = useAtomSet(markIssueSeenAtom, { mode: "promise" });
  const setSubscription = useAtomSet(setIssueSubscriptionAtom, {
    mode: "promise",
  });
  const issues = [...checked.values()];

  const updateAll = (payload: UpdateIssueRequest, failure: string) => {
    if (orgId === undefined) return;
    void settleBulk(
      issues.map(
        (issue) => () =>
          update({
            params: { orgId, code: issue.code },
            payload,
            reactivityKeys: issueMenuKeys(orgId, issue.code),
          }),
      ),
      failure,
    );
  };

  const viewerReady = orgId !== undefined && userId !== undefined;
  const viewerKeys = (code: string) =>
    orgId === undefined
      ? []
      : [...issueMenuKeys(orgId, code), `issue-viewer:${code}:${userId}`];

  return (
    <BulkBar className="@container/bulk pointer-events-none absolute inset-x-0 bottom-[calc(1.5rem+var(--safe-bottom))] z-(--z-top-bar) flex justify-center">
      <div className="pointer-events-auto flex w-max max-w-[calc(100%-1rem)] items-center gap-0.5 rounded-(--radius-card) border-hairline border-border-2 bg-popover p-1 shadow-overlay">
        <span className="px-2 text-sm font-medium whitespace-nowrap text-foreground tabular-nums">
          {checked.size} selected
        </span>
        <Menu>
          <MenuTrigger
            render={
              <Button
                data-track-owner={track("Button[Status]")}
                variant="ghost"
                size="sm"
                aria-label="Status"
              />
            }
          >
            <Icon name="circle-half-fill" className="size-(--icon-sm)" />
            <CollapseLabel>Status</CollapseLabel>
          </MenuTrigger>
          <MenuContent className={popup("w-56")}>
            <MenuList>
              <IssueStatusOptions
                orgId={orgId}
                current=""
                onPick={(stateId) =>
                  updateAll({ stateId }, "Could not change the status")
                }
              />
            </MenuList>
          </MenuContent>
        </Menu>
        <Menu>
          <MenuTrigger
            render={
              <Button
                data-track-owner={track("Button[Priority]")}
                variant="ghost"
                size="sm"
                aria-label="Priority"
              />
            }
          >
            <Icon name="flag-1" className="size-(--icon-sm)" />
            <CollapseLabel>Priority</CollapseLabel>
          </MenuTrigger>
          <MenuContent className={popup("w-48")}>
            <MenuList>
              <IssuePriorityOptions
                current={undefined}
                onPick={(priority) =>
                  updateAll({ priority }, "Could not change the priority")
                }
              />
            </MenuList>
          </MenuContent>
        </Menu>
        <Menu>
          <MenuTrigger
            render={
              <Button
                data-track-owner={track("Button[Assignee]")}
                variant="ghost"
                size="sm"
                aria-label="Assignee"
              />
            }
          >
            <Icon name="user" className="size-(--icon-sm)" />
            <CollapseLabel>Assignee</CollapseLabel>
          </MenuTrigger>
          <MenuContent
            className={popup("w-64 max-h-[min(20rem,var(--available-height))]")}
          >
            <MenuList>
              {orgId === undefined ? null : (
                <AssigneeOptions
                  orgId={orgId}
                  onChange={(ids) =>
                    updateAll(
                      {
                        assignees: ids.map((id) => ({
                          kind: "user" as const,
                          id,
                        })),
                      },
                      "Could not change the assignees",
                    )
                  }
                />
              )}
            </MenuList>
          </MenuContent>
        </Menu>
        <Menu>
          <BulkAction label="Notifications">
            <MenuTrigger
              data-track-owner={track("ResponsiveMenuTrigger.1")}
              render={
                <Button
                  data-track-owner={track("Button[Notifications]")}
                  variant="ghost"
                  size="sm"
                  aria-label="Notifications"
                />
              }
            >
              <Icon name="bell" className="size-(--icon-sm)" />
              <CollapseLabel>Notifications</CollapseLabel>
            </MenuTrigger>
          </BulkAction>
          <MenuContent align="center" className={popup("w-44")}>
            <MenuList>
              <MenuItem
                data-track-owner={track("ResponsiveMenuItem[Mark as read]")}
                disabled={!viewerReady}
                onClick={() => {
                  if (orgId === undefined || userId === undefined) return;
                  void settleBulk(
                    issues.map(
                      (issue) => () =>
                        markSeen({
                          params: { orgId, code: issue.code },
                          reactivityKeys: viewerKeys(issue.code),
                        }),
                    ),
                    "Could not mark as read",
                  );
                }}
              >
                <span className={menuIconSlotClassName}>
                  <Icon name="inbox-checked" />
                </span>
                Mark as read
              </MenuItem>
              {[true, false].map((subscribed) => (
                <MenuItem
                  key={String(subscribed)}
                  data-track-owner={track("ResponsiveMenuItem.1")}
                  disabled={!viewerReady}
                  onClick={() => {
                    if (orgId === undefined || userId === undefined) return;
                    void settleBulk(
                      issues.map(
                        (issue) => () =>
                          setSubscription({
                            params: { orgId, code: issue.code },
                            payload: { subscribed },
                            reactivityKeys: viewerKeys(issue.code),
                          }),
                      ),
                      subscribed
                        ? "Could not subscribe"
                        : "Could not unsubscribe",
                    );
                  }}
                >
                  <span className={menuIconSlotClassName}>
                    <Icon name={subscribed ? "bell" : "bell-off"} />
                  </span>
                  {subscribed ? "Subscribe" : "Unsubscribe"}
                </MenuItem>
              ))}
            </MenuList>
          </MenuContent>
        </Menu>
        <BulkAction label="Clear selection">
          <Button
            data-track-owner="ui/bulk-bar.tsx#BulkBar:Button[Clear selection]"
            variant="ghost"
            size="icon-sm"
            aria-label="Clear selection"
            onClick={onClear}
          >
            <Icon name="x" size="sm" />
          </Button>
        </BulkAction>
      </div>
    </BulkBar>
  );
}
