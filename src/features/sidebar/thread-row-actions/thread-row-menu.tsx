import { useAtomSet, useAtomValue } from "@effect/atom-react";
import type { ReactNode } from "react";
import type { SidebarThread } from "@/components/sidebar-threads";
import type { JamId, ThreadTagId } from "@/data/api/schemas/ids";
import {
  assignTagAtom,
  tagsAtom,
  threadTagsAtom,
  unassignTagAtom,
} from "@/data/atoms/threadOrganization";
import { Icon } from "@/primitives/icon";
import type { IconId } from "@/primitives/icon/icon-ids";
import {
  ResponsiveMenuItem,
  ResponsiveMenuLabel,
  ResponsiveMenuSeparator,
  ResponsiveMenuSub,
} from "@/primitives/responsive-menu";
import { useSidebarOrgId } from "../sidebar-threads-data/live-source";
import { useThreadActions } from "./thread-actions-context";

const menuIconClassName =
  "flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted in-data-[intent=danger]:text-destructive";
const menuSeparatorClassName = "-mx-1 my-1 h-px bg-border-1";
const menuLabelClassName =
  "mt-1 flex min-h-[calc(var(--spacing)*5.5)] items-center px-2 text-xs font-medium text-muted-foreground-2 first:mt-0";

function MenuRow({
  icon,
  label,
  onClick,
  disabled,
  reason,
  intent,
}: {
  icon: IconId;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  reason?: string;
  intent?: "danger";
}) {
  return (
    <ResponsiveMenuItem
      data-intent={intent}
      disabled={disabled}
      title={disabled ? reason : undefined}
      onClick={() => {
        if (!disabled) onClick();
      }}
    >
      <span className={menuIconClassName}>
        <Icon name={icon} size="sm" />
      </span>
      {label}
    </ResponsiveMenuItem>
  );
}

/**
 * Capy's thread context menu, in Capy's order. The sidebar's `…` cluster and the
 * list's right-click menu render the same component, so the two can never drift.
 */
/** Capy's Tags row: every tag, checked on the thread's own assignment. */
function TagRows({ threadId }: { threadId: string }) {
  const orgId = useSidebarOrgId();
  const tags = useAtomValue(tagsAtom(orgId ?? ("" as never)));
  const assigned = useAtomValue(threadTagsAtom(`${orgId ?? ""}/${threadId}`));
  const assign = useAtomSet(assignTagAtom, { mode: "promise" });
  const unassign = useAtomSet(unassignTagAtom, { mode: "promise" });
  const list = Array.isArray(tags) ? (tags as ReadonlyArray<TagRow>) : [];
  const on = new Set(
    Array.isArray(assigned)
      ? (assigned as ReadonlyArray<{ id?: string }>).map((tag) => tag.id)
      : [],
  );
  if (list.length === 0)
    return (
      <ResponsiveMenuLabel className={menuLabelClassName}>
        No tags yet
      </ResponsiveMenuLabel>
    );
  return (
    <>
      {list.map((tag) => {
        const tagged = on.has(tag.id);
        return (
          <ResponsiveMenuItem
            key={tag.id}
            onClick={() => {
              if (orgId === undefined) return;
              const call = tagged ? unassign : assign;
              void call({
                params: { orgId, tagId: tag.id as ThreadTagId },
                payload: { jamIds: [threadId as JamId] },
              }).catch(() => undefined);
            }}
          >
            <span className={menuIconClassName}>
              <Icon name={tagged ? "checkmark-1" : "tag"} size="sm" />
            </span>
            {tag.name}
          </ResponsiveMenuItem>
        );
      })}
    </>
  );
}

type TagRow = { id: string; name: string };

export function ThreadRowMenu({
  thread,
  onClose,
  renameKey,
}: {
  thread: SidebarThread;
  onClose?: () => void;
  /** The section this menu was opened from, so Rename edits that row alone. */
  renameKey?: string;
}) {
  const actions = useThreadActions();
  const act = (run: () => void) => () => {
    onClose?.();
    run();
  };
  const folders: ReactNode =
    actions.folders.length === 0
      ? [
          <ResponsiveMenuLabel key="empty" className={menuLabelClassName}>
            No folders yet
          </ResponsiveMenuLabel>,
        ]
      : actions.folders.map((folder) => (
          <ResponsiveMenuItem
            key={folder.id}
            onClick={act(() => actions.moveTo(thread, folder.id))}
          >
            <span className={menuIconClassName}>
              <Icon name="folder-1" size="sm" />
            </span>
            {folder.name}
          </ResponsiveMenuItem>
        ));
  return (
    <>
      <MenuRow
        icon="folder-shared"
        label="Share"
        onClick={act(() => actions.share(thread))}
      />
      <MenuRow
        icon="square-arrow-top-right"
        label="Open in new tab"
        onClick={act(() => window.open(`/thread/${thread.id}`, "_blank"))}
      />
      {thread.pinned ? (
        <MenuRow
          icon="unpin"
          label="Unpin"
          onClick={act(() => actions.unpin(thread))}
        />
      ) : (
        <MenuRow
          icon="pin"
          label="Pin"
          onClick={act(() => actions.pin(thread))}
        />
      )}
      <ResponsiveMenuSub
        icon={
          <span className={menuIconClassName}>
            <Icon name="move-folder" size="sm" />
          </span>
        }
        label="Move to"
        contentClassName="w-52"
      >
        {folders}
      </ResponsiveMenuSub>
      <ResponsiveMenuSub
        icon={
          <span className={menuIconClassName}>
            <Icon name="tag" size="sm" />
          </span>
        }
        label="Tags"
        contentClassName="w-52"
      >
        <TagRows threadId={thread.id} />
      </ResponsiveMenuSub>
      {thread.owner && !thread.archived ? (
        <MenuRow
          icon="crown"
          label="Promote to Captain"
          onClick={act(() => actions.promote(thread))}
        />
      ) : null}
      <MenuRow
        icon="pencil"
        label="Rename"
        disabled={!thread.owner}
        reason="Only the thread's owner can rename it"
        onClick={act(() => actions.startRename(thread.id, renameKey))}
      />
      <MenuRow
        icon="arrow-rotate-clockwise"
        label="Regenerate title"
        disabled={!thread.owner}
        reason="Only the thread's owner can regenerate its title"
        onClick={act(() => actions.regenerateTitle(thread))}
      />
      <MenuRow
        icon="chain-link-1"
        label="Copy link"
        onClick={act(
          () =>
            void navigator.clipboard
              .writeText(`${window.location.origin}/thread/${thread.id}`)
              .catch(() => undefined),
        )}
      />
      <ResponsiveMenuSeparator className={menuSeparatorClassName} />
      {thread.hasUnreads ? (
        <MenuRow
          icon="email-2-check"
          label="Mark as read"
          onClick={act(() => actions.markRead(thread))}
        />
      ) : (
        <MenuRow
          icon="email-2-unread"
          label="Mark as unread"
          onClick={act(() => actions.markUnread(thread))}
        />
      )}
      {thread.archived ? null : thread.settled ? (
        <MenuRow
          icon="arrow-undo-up"
          label="Un-settle"
          onClick={act(() => actions.unsettle(thread))}
        />
      ) : (
        <MenuRow
          icon="checkmark-1"
          label="Settle"
          onClick={act(() => actions.settle(thread))}
        />
      )}
      {thread.archived ? (
        <MenuRow
          icon="arrow-rotate-clockwise"
          label="Unarchive"
          onClick={act(() => actions.unarchive(thread))}
        />
      ) : (
        <MenuRow
          icon="archive"
          label="Archive"
          onClick={act(() => actions.archive(thread))}
        />
      )}
      <MenuRow
        icon="trash-can"
        label="Delete"
        intent="danger"
        disabled={!thread.owner}
        reason="Only the thread's owner can delete it"
        onClick={act(() => actions.remove(thread))}
      />
    </>
  );
}
