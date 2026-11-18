import { useNavigate } from "@tanstack/react-router";
import type {
  SidebarCaptain,
  SidebarThread,
} from "@/components/sidebar-threads";
import { Icon } from "@/primitives/icon";
import type { IconId } from "@/primitives/icon/icon-ids";
import {
  ResponsiveMenuItem,
  ResponsiveMenuSeparator,
  ResponsiveMenuSub,
} from "@/primitives/responsive-menu";
import { useThreadActions } from "./thread-actions-context";

/** A Captain is a jam, so the shared row actions take it once it is shaped like a row. */
const asThread = (captain: SidebarCaptain): SidebarThread => ({
  id: captain.id,
  title: captain.name,
  status: captain.status,
  needsYou: captain.needsYou,
  ask: captain.ask,
  hasUnreads: captain.hasUnreads,
  age: captain.age,
  projectId: captain.card?.projectId ?? null,
  machine: null,
  settled: false,
  pinned: captain.card?.pinned ?? false,
  archived: captain.card?.archived ?? false,
  owner: true,
  origin: "web",
});

const menuIconClassName =
  "kiki-icon text-icon-muted in-data-[intent=danger]:text-destructive";
const menuSeparatorClassName = "-mx-1 kiki-menu-separator h-px bg-border-1";

function MenuRow({
  icon,
  label,
  onClick,
  intent,
}: {
  icon: IconId;
  label: string;
  onClick: () => void;
  intent?: "danger";
}) {
  return (
    <ResponsiveMenuItem data-intent={intent} onClick={onClick}>
      <span data-size="sm" className={menuIconClassName}>
        <Icon name={icon} size="sm" />
      </span>
      {label}
    </ResponsiveMenuItem>
  );
}

/**
 * Capy's Captain context menu, in Capy's order: open, profile, share, pin,
 * move, read state, archive, demote and delete. The row's own right-click and
 * its `…` cluster render this, so the two can never drift.
 */
export function CaptainRowMenu({
  captain,
  onClose,
}: {
  captain: SidebarCaptain;
  onClose?: () => void;
}) {
  const actions = useThreadActions();
  const row = asThread(captain);
  const navigate = useNavigate();
  const act = (run: () => void) => () => {
    onClose?.();
    run();
  };

  const folders =
    actions.folders.length === 0
      ? [
          <ResponsiveMenuItem key="empty" disabled>
            No folders yet
          </ResponsiveMenuItem>,
        ]
      : actions.folders.map((folder) => (
          <ResponsiveMenuItem
            key={folder.id}
            onClick={act(() => actions.moveTo(row, folder.id))}
          >
            <span data-size="sm" className={menuIconClassName}>
              <Icon name="folder-1" size="sm" />
            </span>
            {folder.name}
          </ResponsiveMenuItem>
        ));

  return (
    <>
      <MenuRow
        icon="square-arrow-top-right"
        label="Open in new tab"
        onClick={act(() => window.open(`/thread/${captain.id}`, "_blank"))}
      />
      <MenuRow
        icon="user"
        label="Profile"
        onClick={act(
          () =>
            void navigate({
              to: "/thread/$threadId",
              params: { threadId: captain.id },
              search: { pane: "overview" },
            }),
        )}
      />
      <MenuRow
        icon="folder-shared"
        label="Share"
        onClick={act(() => actions.share(row))}
      />
      {row.pinned ? (
        <MenuRow
          icon="unpin"
          label="Unpin"
          onClick={act(() => actions.unpin(row))}
        />
      ) : (
        <MenuRow icon="pin" label="Pin" onClick={act(() => actions.pin(row))} />
      )}
      <ResponsiveMenuSub
        icon={
          <span data-size="sm" className={menuIconClassName}>
            <Icon name="move-folder" size="sm" />
          </span>
        }
        label="Move to"
        contentClassName="kiki-menu"
      >
        {folders}
      </ResponsiveMenuSub>
      {captain.hasUnreads ? (
        <MenuRow
          icon="email-2-check"
          label="Mark as read"
          onClick={act(() => actions.markRead(row))}
        />
      ) : (
        <MenuRow
          icon="email-2-unread"
          label="Mark as unread"
          onClick={act(() => actions.markUnread(row))}
        />
      )}
      <MenuRow
        icon="archive"
        label="Archive"
        onClick={act(() => actions.archive(row))}
      />
      <ResponsiveMenuSeparator className={menuSeparatorClassName} />
      <MenuRow
        icon="arrow-undo-up"
        label="Demote to thread"
        onClick={act(() => actions.demoteCaptain(captain))}
      />
      <MenuRow
        icon="trash-can"
        label="Delete"
        intent="danger"
        onClick={act(() => actions.removeCaptain(captain))}
      />
    </>
  );
}
