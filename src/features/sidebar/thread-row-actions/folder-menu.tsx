import type { ReactNode } from "react";
import type { SidebarFolder } from "@/components/sidebar-threads";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import type { IconId } from "@/primitives/icon/icon-ids";
import {
  ResponsiveMenu,
  ResponsiveMenuContent,
  ResponsiveMenuItem,
  ResponsiveMenuSeparator,
  ResponsiveMenuTrigger,
} from "@/primitives/responsive-menu";

const menuIconClassName =
  "kiki-icon text-icon-muted in-data-[intent=danger]:text-destructive";

export type FolderMenuActions = {
  onRename: () => void;
  onShare: () => void;
  onToggleHidden: () => void;
  onLeave: () => void;
  onDelete: () => void;
};

function FolderRow({
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
 * Capy's folder menu. Its Promote to Captain and Add to Captain rows are absent
 * because neither has an endpoint on a folder: our Captains promote from a
 * thread, not from a folder.
 */
export function FolderMenuItems({
  folder,
  actions,
}: {
  folder: SidebarFolder;
  actions: FolderMenuActions;
}) {
  const shared = folder.visibility === "shared";
  return (
    <>
      <FolderRow
        icon="pencil"
        label="Rename folder"
        onClick={actions.onRename}
      />
      {shared ? (
        <FolderRow
          icon="folder-shared"
          label="Share folder"
          onClick={actions.onShare}
        />
      ) : null}
      <FolderRow
        icon={folder.hidden === true ? "eye-open" : "eye-slash"}
        label={folder.hidden === true ? "Show in sidebar" : "Hide from sidebar"}
        onClick={actions.onToggleHidden}
      />
      <ResponsiveMenuSeparator className="kiki-menu-divider" />
      {folder.viewerRole === "member" ? (
        <FolderRow
          icon="door"
          label="Leave folder"
          intent="danger"
          onClick={actions.onLeave}
        />
      ) : null}
      <FolderRow
        icon="trash-can"
        label="Delete folder"
        intent="danger"
        onClick={actions.onDelete}
      />
    </>
  );
}

export function FolderOptionsMenu({
  folder,
  actions,
}: {
  folder: SidebarFolder;
  actions: FolderMenuActions;
}): ReactNode {
  return (
    <ResponsiveMenu>
      <ResponsiveMenuTrigger
        render={
          <Button
            type="button"
            variant="bare"
            size="icon-shrink"
            aria-label="Folder options"
            className="kiki-icon-button relative opacity-0 transition-opacity duration-100 group-hover/folder:opacity-100 focus-visible:opacity-100 data-[popup-open]:opacity-100"
          />
        }
      >
        <Icon name="settings-slider-hor" size="sm" />
      </ResponsiveMenuTrigger>
      <ResponsiveMenuContent align="end" className="kiki-menu">
        <FolderMenuItems folder={folder} actions={actions} />
      </ResponsiveMenuContent>
    </ResponsiveMenu>
  );
}
