import type { ReactElement, ReactNode } from "react";
import { toast } from "sonner";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from "@/primitives/context-menu";
import { Icon } from "@/primitives/icon";
import { MenuItem } from "@/primitives/menu";

export type MediaKind = "image" | "video";

export type MediaActionsInput = {
  kind: MediaKind;
  name: string;
  url?: string;
  resolveBlob?: () => Promise<Blob>;
};

const fetchBlob = (url: string) =>
  fetch(url).then((response) =>
    response.ok
      ? response.blob()
      : Promise.reject(new Error(`Download failed: ${response.status}`)),
  );

const toPng = (blob: Blob) =>
  createImageBitmap(blob).then((bitmap) => {
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0);
    bitmap.close();
    return new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (png) =>
          png === null
            ? reject(new Error("Could not copy image"))
            : resolve(png),
        "image/png",
      ),
    );
  });

export const copyImage = (resolve: () => Promise<Blob>) =>
  navigator.clipboard.write([
    new ClipboardItem({
      "image/png": resolve().then((blob) =>
        blob.type === "image/png" ? blob : toPng(blob),
      ),
    }),
  ]);

export const saveBlob = (name: string, blob: Blob) => {
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(href), 60_000);
};

export function mediaActions({
  kind,
  name,
  url,
  resolveBlob,
}: MediaActionsInput) {
  const resolve =
    (url === undefined ? undefined : () => fetchBlob(url)) ?? resolveBlob;
  const download =
    resolveBlob ?? (url === undefined ? undefined : () => fetchBlob(url));
  return {
    copy:
      kind !== "image" || resolve === undefined
        ? undefined
        : () => {
            copyImage(resolve).then(
              () => toast.success("Image copied"),
              () => toast.error("Could not copy image"),
            );
          },
    download:
      download === undefined
        ? undefined
        : () => {
            download()
              .then((blob) => saveBlob(name, blob))
              .catch(() => undefined);
          },
  };
}

const copyVideoAddress = (url: string) =>
  navigator.clipboard.writeText(url).then(
    () => toast.success("Video address copied"),
    () => toast.error("Could not copy video address"),
  );

const itemIcon =
  "flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted in-data-[intent=danger]:text-destructive";
const itemShortcut =
  "ml-auto flex shrink-0 items-center gap-1.5 text-sm font-normal text-muted-foreground-1";

export type MediaContextMenuProps = MediaActionsInput & {
  preview?: boolean;
  shortcuts?: { copy?: ReactNode; download?: ReactNode };
  children: ReactElement;
};

export function MediaContextMenu({
  kind,
  name,
  url,
  resolveBlob,
  preview = false,
  shortcuts,
  children,
}: MediaContextMenuProps) {
  const actions = mediaActions({ kind, name, url, resolveBlob });
  if (actions.download === undefined && url === undefined) return children;
  return (
    <ContextMenu>
      <ContextMenuTrigger
        render={<span className="contents" />}
        onTouchStart={(event) => {
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
            <span className={itemIcon}>
              <Icon name="square-behind-square-2" />
            </span>
            Copy image
            {preview && shortcuts?.copy !== undefined ? (
              <span className={itemShortcut}>{shortcuts.copy}</span>
            ) : null}
          </MenuItem>
        )}
        {kind === "video" && url !== undefined ? (
          <MenuItem onClick={() => void copyVideoAddress(url)}>
            <span className={itemIcon}>
              <Icon name="chain-link-1" />
            </span>
            Copy video address
          </MenuItem>
        ) : null}
        {actions.download === undefined ? null : (
          <MenuItem onClick={actions.download}>
            <span className={itemIcon}>
              <Icon name="arrow-inbox" />
            </span>
            {kind === "video" ? "Download video" : "Download image"}
            {preview &&
            kind === "image" &&
            shortcuts?.download !== undefined ? (
              <span className={itemShortcut}>{shortcuts.download}</span>
            ) : null}
          </MenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
