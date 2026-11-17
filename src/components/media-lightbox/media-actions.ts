import { useEffect, useEffectEvent } from "react";
import { toast } from "sonner";

export type MediaKind = "image" | "video";

export type MediaSource = {
  kind: MediaKind;
  /** File name used for downloads and accessible labels. */
  name: string;
  /** Fetchable URL of the full-size media. */
  url?: string;
  /** Resolves the media bytes when there is no fetchable URL (local files). */
  resolveBlob?: () => Promise<Blob>;
};

export type MediaActions = {
  copy?: () => void;
  download?: () => void;
};

const STALL_TIMEOUT = 30_000;
const REVOKE_DELAY = 60_000;

/** GET a URL as a Blob, failing when the transfer stalls (Capy's fetchBlob). */
export function fetchBlob(url: string, signal?: AbortSignal): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    let stall: ReturnType<typeof setTimeout> | undefined;
    const armStall = () => {
      clearTimeout(stall);
      stall = setTimeout(() => {
        reject(new Error("Download failed: stalled"));
        request.abort();
      }, STALL_TIMEOUT);
    };
    request.open("GET", url);
    request.responseType = "blob";
    request.onprogress = armStall;
    request.onloadend = () => clearTimeout(stall);
    request.onload = () =>
      (request.status >= 200 && request.status < 300) ||
      (request.status === 0 && request.response !== null)
        ? resolve(request.response as Blob)
        : reject(new Error(`Download failed: ${request.status}`));
    request.onerror = () => reject(new Error("Download failed: network error"));
    request.onabort = () => reject(new Error("Download aborted"));
    signal?.addEventListener("abort", () => request.abort(), { once: true });
    armStall();
    request.send();
  });
}

async function toPng(blob: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (png) => (png ? resolve(png) : reject(new Error("Could not encode PNG"))),
      "image/png",
    ),
  );
}

/** Write an image to the clipboard as PNG, converting other formats. */
export function copyImageBlob(resolveBlob: () => Promise<Blob>): Promise<void> {
  const png = resolveBlob().then((blob) =>
    blob.type === "image/png" ? blob : toPng(blob),
  );
  return navigator.clipboard.write([new ClipboardItem({ "image/png": png })]);
}

/** Save a blob under `name` through a temporary object URL. */
export function saveBlob(name: string, blob: Blob) {
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = name;
  anchor.rel = "noopener";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(href), REVOKE_DELAY);
}

/** Copy and download for one piece of media (Capy's mediaActions). */
export function mediaActions({
  kind,
  name,
  url,
  resolveBlob,
}: MediaSource): MediaActions {
  const resolve =
    (url === undefined ? undefined : () => fetchBlob(url)) ?? resolveBlob;
  return {
    copy:
      kind !== "image" || resolve === undefined
        ? undefined
        : () => {
            copyImageBlob(resolve).then(
              () => toast.success("Image copied"),
              () => toast.error("Could not copy image"),
            );
          },
    download:
      resolveBlob !== undefined
        ? () =>
            void resolveBlob()
              .then((blob) => saveBlob(name, blob))
              .catch(() => undefined)
        : url !== undefined
          ? () =>
              void fetchBlob(url)
                .then((blob) => saveBlob(name, blob))
                .catch(() => undefined)
          : undefined,
  };
}

export type MediaShortcut = "preview.copy" | "preview.download";

const SHORTCUT_KEYS: Record<MediaShortcut, string> = {
  "preview.copy": "c",
  "preview.download": "s",
};

const isMac = () =>
  typeof navigator !== "undefined" &&
  /Mac|iPhone|iPad/.test(navigator.platform);

/** The key label Capy shows for a media shortcut (mod+c, mod+s). */
export function mediaShortcutLabel(action: MediaShortcut) {
  const key = SHORTCUT_KEYS[action].toUpperCase();
  return isMac() ? `⌘${key}` : `Ctrl+${key}`;
}

/**
 * Binds mod+c (copy) or mod+s (download) while focus is inside a media
 * preview ([data-media-preview]), outside editable fields, and for copy only
 * while no text is selected, as Capy's preview.copy/preview.download do.
 */
export function useMediaShortcut(
  action: MediaShortcut,
  run: () => void,
  enabled = true,
) {
  const onRun = useEffectEvent(run);
  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const mod = isMac() ? event.metaKey : event.ctrlKey;
      if (!mod || event.altKey || event.shiftKey) return;
      if (event.key.toLowerCase() !== SHORTCUT_KEYS[action]) return;
      const active = document.activeElement;
      if (
        !(active instanceof Element) ||
        !active.closest("[data-media-preview]")
      )
        return;
      if (
        active.closest(
          "input, textarea, [contenteditable='true'], [contenteditable='plaintext-only']",
        )
      )
        return;
      if (
        action === "preview.copy" &&
        (window.getSelection()?.toString() ?? "") !== ""
      )
        return;
      event.preventDefault();
      onRun();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [action, enabled]);
}
