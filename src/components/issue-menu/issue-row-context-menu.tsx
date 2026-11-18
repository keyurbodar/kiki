import type { ReactNode } from "react";
import type { ActorSources } from "@/components/actor-filter";
import type { IssueSummary } from "@/data/api/schemas/issue";
import { IssueMenuItems } from "@/features/issues/issue-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from "@/primitives/context-menu";
import {
  menuListClassName,
  menuPartsClassName,
  menuPopupClassName,
} from "./menu-classes";

export type IssueRowContextMenuProps = {
  issue: IssueSummary;
  /** Opens the issue in place (the list's side panel); without it, Open navigates to the issue page. */
  onOpenIssue?: (code: string) => void;
  /** The people, Captains and threads the Assignee row offers. */
  actors?: ActorSources;
  /** The issue row the menu opens on. */
  children: ReactNode;
};

/**
 * Capy's issue row context menu: right-clicking a row opens IssueMenuItems at the pointer in a
 * 14rem popup. The row itself stays the list's; this only wraps it.
 */
export function IssueRowContextMenu({
  issue,
  onOpenIssue,
  actors,
  children,
}: IssueRowContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger
        data-track-owner="shared/issues/issues-list.tsx#module:ContextMenuTrigger.1"
        className="block"
      >
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent
        data-issue-menu=""
        className={`${menuPopupClassName} ${menuPartsClassName} w-56`}
      >
        <div role="presentation" data-menu-list className={menuListClassName}>
          <IssueMenuItems
            issue={issue}
            onOpenIssue={onOpenIssue}
            actors={actors}
          />
        </div>
      </ContextMenuContent>
    </ContextMenu>
  );
}
