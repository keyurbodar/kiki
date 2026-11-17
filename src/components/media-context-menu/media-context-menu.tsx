import type { ReactNode, TouchEvent } from "react";
import { toast } from "sonner";
import {
  type MediaSource,
  mediaActions,
  mediaShortcutLabel,
} from "@/components/media-lightbox/media-actions";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from "@/primitives/context-menu";
import { Icon } from "@/primitives/icon";
import { MenuItem } from "@/primitives/menu";

export {
  copyImageBlob as copyImage,
  type MediaKind,
  type MediaSource as MediaActionsInput,
  mediaActions,
  saveBlob,
} from "@/components/media-lightbox/media-actions";

export type MediaContextMenuProps = MediaSource & {
  /** Inside the lightbox: shows shortcuts and keeps touch long-press for pan. */
  preview?: boolean;
  children: ReactNode;
};

const ITEM_ICON =
  "flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted in-data-[intent=danger]:text-destructive";
const ITEM_SHORTCUT =
  "ml-auto flex shrink-0 items-center gap-1.5 text-sm font-normal text-muted-foreground-1";

/**
 * Capy's shared/media-context-menu: right-click on an image or video for
 * Copy image, Copy video address and Download image/video. Renders the
 * children alone when there is nothing to offer.
 */
export function MediaContextMenu({
  kind,
  name,
  url,
  resolveBlob,
  preview = false,

  children,
}: MediaContextMenuProps) {
  const actions = mediaActions({ kind, name, url, resolveBlob });
  if (actions.download === undefined && url === undefined) return children;
  return (
    <ContextMenu>
      <ContextMenuTrigger
        render={<span className="contents" />}
        onTouchStart={(
          event: TouchEvent & { preventBaseUIHandler?: () => void },
        ) => {
          if (preview && kind === "image") event.preventBaseUIHandler?.();
        }}
      >
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent
        className="w-52"
        data-media-preview={preview ? "" : undefined}
      >
        {actions.copy === undefined ? null : (
          <MenuItem onClick={actions.copy}>
            <span className={ITEM_ICON}>
              <Icon name="square-behind-square-2" />
            </span>
            Copy image
            {preview ? (
              <span className={ITEM_SHORTCUT}>
                {mediaShortcutLabel("preview.copy")}
              </span>
            ) : null}
          </MenuItem>
        )}
        {kind === "video" && url !== undefined ? (
          <MenuItem
            onClick={() => {
              navigator.clipboard.writeText(url).then(
                () => toast.success("Video address copied"),
                () => toast.error("Could not copy video address"),
              );
            }}
          >
            <span className={ITEM_ICON}>
              <Icon name="chain-link-1" />
            </span>
            Copy video address
          </MenuItem>
        ) : null}
        {actions.download === undefined ? null : (
          <MenuItem onClick={actions.download}>
            <span className={ITEM_ICON}>
              <Icon name="arrow-inbox" />
            </span>
            {kind === "video" ? "Download video" : "Download image"}
            {preview && kind === "image" ? (
              <span className={ITEM_SHORTCUT}>
                {mediaShortcutLabel("preview.download")}
              </span>
            ) : null}
          </MenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
