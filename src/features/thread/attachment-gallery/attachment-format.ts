import type { FileRef } from "@/data/events";

export type AttachmentFile = FileRef;

export type AttachmentEntry = {
  file: AttachmentFile;
  title?: string;
  key?: string;
  open?: () => void;
};

export type KeyedAttachment = AttachmentEntry & { key: string };

export type MediaKind = "image" | "video";

export type GalleryItem = {
  key: string;
  label: string;
  kind: MediaKind;
  entry: KeyedAttachment;
};

const videoExtensions = new Set(["mp4", "webm", "mov", "m4v"]);
const audioExtensions = new Set(["mp3", "wav", "ogg", "m4a", "flac", "aac"]);

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  const unit = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)) - 1,
    units.length - 1,
  );
  const value = bytes / 1024 ** (unit + 1);
  return `${value >= 10 ? Math.round(value) : value.toFixed(1)} ${units[unit]}`;
}

export const fileTypeLabel = (
  file: Pick<AttachmentFile, "name" | "mediaType">,
) =>
  (file.name.includes(".")
    ? file.name.split(".").at(-1)?.toUpperCase()
    : undefined) ||
  file.mediaType.split("/").at(-1) ||
  "file";

export const fileMeta = (
  file: Pick<AttachmentFile, "name" | "mediaType" | "sizeBytes">,
) => `${formatBytes(file.sizeBytes)} · ${fileTypeLabel(file)}`;

const extensionOf = (name: string) =>
  name.includes(".") ? name.split(".").at(-1)?.toLowerCase() : undefined;

export function attachmentKind(
  file: Pick<AttachmentFile, "name" | "mediaType">,
): MediaKind | "audio" | undefined {
  const type = file.mediaType.toLowerCase();
  if (type.startsWith("image/")) return "image";
  if (type.startsWith("video/")) return "video";
  if (type.startsWith("audio/")) return "audio";
  const extension = extensionOf(file.name);
  if (extension === undefined) return undefined;
  if (videoExtensions.has(extension)) return "video";
  if (audioExtensions.has(extension)) return "audio";
  return undefined;
}

export function keyAttachments(
  entries: ReadonlyArray<AttachmentEntry>,
): KeyedAttachment[] {
  const byKey = new Map<string, KeyedAttachment>();
  for (const entry of entries) {
    const key = JSON.stringify([
      entry.file.fileId,
      entry.title ?? entry.file.name,
    ]);
    byKey.set(key, { ...entry, key });
  }
  return [...byKey.values()];
}

export type SplitAttachments = {
  media: GalleryItem[];
  audio: KeyedAttachment[];
  files: KeyedAttachment[];
};

export function splitAttachments(
  entries: ReadonlyArray<KeyedAttachment>,
): SplitAttachments {
  const split: SplitAttachments = { media: [], audio: [], files: [] };
  for (const entry of entries) {
    const kind = attachmentKind(entry.file);
    if (kind === undefined) split.files.push(entry);
    else if (kind === "audio") split.audio.push(entry);
    else
      split.media.push({
        key: entry.key,
        label: entry.title ?? entry.file.name,
        kind,
        entry,
      });
  }
  return split;
}

const previewTypes = new Set(["image/jpeg", "image/png"]);

export const previewVariant = (item: GalleryItem) =>
  item.kind === "image" &&
  previewTypes.has(item.entry.file.mediaType.toLowerCase())
    ? "preview"
    : "display";

export const mediaSizeOf = (item: GalleryItem) =>
  item.kind === "image" &&
  item.entry.file.width !== undefined &&
  item.entry.file.height !== undefined
    ? { width: item.entry.file.width, height: item.entry.file.height }
    : undefined;

export function formatClock(milliseconds: number): string {
  const total = Math.max(0, Math.floor(milliseconds / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

export type ComposerUpload = {
  localId: string;
  name: string;
  mediaType: string;
  sizeBytes: number;
  status: "uploading" | "failed" | "done";
  progress?: number;
  previewUrl?: string;
  lost?: boolean;
  kept?: boolean;
};

export function composerUploadStatus(upload: ComposerUpload): string {
  if (
    upload.lost === true ||
    (upload.status === "uploading" && upload.kept === false)
  )
    return "Not kept across reload";
  if (upload.status === "failed") return "Upload failed";
  if (upload.status === "uploading") {
    if (upload.progress === undefined) return "Preparing";
    return upload.progress === 100 ? "Finishing" : `${upload.progress}%`;
  }
  return fileTypeLabel(upload);
}

export function uploadPercent(loaded: number, total: number) {
  return Math.min(100, Math.floor((loaded / total) * 100));
}
