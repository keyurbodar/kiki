import { type ComponentProps, type ReactNode, useState } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from "@/primitives/context-menu";
import { Icon } from "@/primitives/icon";
import { ResponsiveMenuItem } from "@/primitives/responsive-menu";

export type SidebarRowAction = (threadId: string) => void;

export type SidebarRowActions = {
  onMarkRead?: SidebarRowAction;
  onMarkUnread?: SidebarRowAction;
  onArchive?: SidebarRowAction;
  onUnarchive?: SidebarRowAction;
  onDelete?: SidebarRowAction;
};

export type SidebarRowMenuThread = {
  id: string;
  hasUnreads: boolean;
};

const menuIconClassName =
  "flex size-4 shrink-0 items-center justify-center text-icon-muted";

const copyLink = async (threadId: string) => {
  const url = `${window.location.origin}/thread/${threadId}`;
  try {
    await navigator.clipboard.writeText(url);
  } catch {
    return;
  }
};

export type SidebarRowPopupsProps = {
  threads: ReadonlyMap<string, SidebarRowMenuThread>;
  actions?: SidebarRowActions;
  className?: string;
  onClickCapture?: ComponentProps<"div">["onClickCapture"];
  children: ReactNode;
};

/**
 * Capy's `SidebarRowPopups`: one context menu for the whole thread list rather
 * than one per row. The trigger resolves the row under the pointer from its
 * `[data-row-menu]` marker and opens the list's menu anchored there, so a
 * right-click on empty list space opens nothing.
 */
export function SidebarRowPopups({
  threads,
  actions,
  className,
  onClickCapture,
  children,
}: SidebarRowPopupsProps) {
  const [thread, setThread] = useState<SidebarRowMenuThread | null>(null);
  const resolveFrom = (
    target: EventTarget | null,
    preventDefault: () => void,
  ) => {
    const row =
      target instanceof Element ? target.closest("[data-row-menu]") : null;
    const id = row
      ?.querySelector("[data-sidebar-target]")
      ?.getAttribute("data-sidebar-target");
    const found = id === null || id === undefined ? undefined : threads.get(id);
    if (found === undefined) {
      preventDefault();
      setThread(null);
      return;
    }
    setThread(found);
  };
  return (
    <ContextMenu onOpenChange={(open) => !open && setThread(null)}>
      <ContextMenuTrigger
        data-track-owner="shared/sidebar-threads.tsx#SidebarRowPopups:ContextMenuTrigger.1"
        className={className}
        onContextMenu={(event) =>
          resolveFrom(event.target, () => event.preventDefault())
        }
        onTouchStart={(event) => resolveFrom(event.target, () => {})}
        onClickCapture={onClickCapture}
      >
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-52">
        {thread === null ? null : (
          <SidebarRowMenu thread={thread} actions={actions} />
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}

function SidebarRowMenu({
  thread,
  actions,
}: {
  thread: SidebarRowMenuThread;
  actions?: SidebarRowActions;
}) {
  const run = (action: SidebarRowAction | undefined) => () =>
    action?.(thread.id);
  return (
    <>
      <ResponsiveMenuItem
        data-track-owner="shared/sidebar-threads.tsx#ThreadMenuItems:ResponsiveMenuItem[Open in new tab]"
        onClick={() => window.open(`/thread/${thread.id}`, "_blank")}
      >
        <span className={menuIconClassName}>
          <Icon name="square-arrow-top-right" size="sm" />
        </span>
        Open in new tab
      </ResponsiveMenuItem>
      <ResponsiveMenuItem
        data-track-owner="shared/sidebar-threads.tsx#ThreadMenuItems:ResponsiveMenuItem[Copy link]"
        onClick={() => void copyLink(thread.id)}
      >
        <span className={menuIconClassName}>
          <Icon name="chain-link-1" size="sm" />
        </span>
        Copy link
      </ResponsiveMenuItem>
      {actions?.onMarkRead === undefined || !thread.hasUnreads ? null : (
        <ResponsiveMenuItem onClick={run(actions.onMarkRead)}>
          <span className={menuIconClassName}>
            <Icon name="checkmark-1" size="sm" />
          </span>
          Mark as read
        </ResponsiveMenuItem>
      )}
      {actions?.onMarkUnread === undefined || thread.hasUnreads ? null : (
        <ResponsiveMenuItem onClick={run(actions.onMarkUnread)}>
          <span className={menuIconClassName}>
            <Icon name="circle-dashed" size="sm" />
          </span>
          Mark as unread
        </ResponsiveMenuItem>
      )}
      {actions?.onArchive === undefined ? null : (
        <ResponsiveMenuItem onClick={run(actions.onArchive)}>
          <span className={menuIconClassName}>
            <Icon name="archive" size="sm" />
          </span>
          Archive
        </ResponsiveMenuItem>
      )}
      {actions?.onUnarchive === undefined ? null : (
        <ResponsiveMenuItem onClick={run(actions.onUnarchive)}>
          <span className={menuIconClassName}>
            <Icon name="archive" size="sm" />
          </span>
          Unarchive
        </ResponsiveMenuItem>
      )}
      {actions?.onDelete === undefined ? null : (
        <ResponsiveMenuItem intent="danger" onClick={run(actions.onDelete)}>
          <span className={menuIconClassName}>
            <Icon name="trash-can" size="sm" />
          </span>
          Delete
        </ResponsiveMenuItem>
      )}
    </>
  );
}
