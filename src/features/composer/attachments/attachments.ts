import type { FileId, FileUploadDeclaration } from "@/data/api/schemas/files";
import {
  fileSizeLimitBytes,
  messageFilesLimitBytes,
} from "@/data/api/schemas/files";

export type AttachmentRef = FileUploadDeclaration & { readonly fileId: FileId };

export type AttachmentStatus =
  | { readonly phase: "uploading"; readonly progress?: number }
  | { readonly phase: "ready"; readonly ref: AttachmentRef }
  | { readonly phase: "failed"; readonly message: string };

export type AttachmentEntry = {
  readonly localId: string;
  readonly name: string;
  readonly mediaType: string;
  readonly sizeBytes: number;
  readonly previewUrl?: string;
  readonly original?: File;
  readonly status: AttachmentStatus;
};

export const attachmentMessages = {
  empty: "Empty file",
  tooLarge: "Over the 250 MB file limit",
  overTotal: "Over the 2 GiB total limit",
  unavailable: "Upload unavailable",
  failed: "Upload failed",
  noTarget: "Upload failed: no target",
  aborted: "Upload aborted",
  network: "Upload failed: network error",
} as const;

const nonPreviewableImages = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "image/webp",
  "image/avif",
  "image/bmp",
  "image/svg+xml",
  "image/x-icon",
  "image/vnd.microsoft.icon",
  "image/apng",
]);

/** True for anything a browser can show without a server-made preview. */
export const isBrowserRenderable = (mediaType: string) => {
  const type = mediaType.toLowerCase();
  return !type.startsWith("image/") || nonPreviewableImages.has(type);
};

/** Browsers report HEIC/HEIF with an empty type. */
export const inferMediaType = (name: string) => {
  const extension = name.split(".").at(-1)?.toLowerCase();
  return extension === "heic" || extension === "heif"
    ? `image/${extension}`
    : undefined;
};

export const declareFile = (file: File): FileUploadDeclaration => ({
  name: file.name === "" ? "file" : file.name,
  mediaType:
    file.type === ""
      ? (inferMediaType(file.name) ?? "application/octet-stream")
      : file.type,
  sizeBytes: file.size,
});

/** Bytes already committed to the message: every entry that hasn't failed. */
export const committedBytes = (entries: ReadonlyArray<AttachmentEntry>) =>
  entries.reduce(
    (total, entry) =>
      entry.status.phase === "failed" ? total : total + entry.sizeBytes,
    0,
  );

/** Why a file can't be uploaded, checked in Capy's order, or undefined. */
export const rejectReason = (
  sizeBytes: number,
  committed: number,
  canUpload: boolean,
) => {
  if (sizeBytes === 0) return attachmentMessages.empty;
  if (sizeBytes > fileSizeLimitBytes) return attachmentMessages.tooLarge;
  if (committed + sizeBytes > messageFilesLimitBytes)
    return attachmentMessages.overTotal;
  if (!canUpload) return attachmentMessages.unavailable;
  return undefined;
};

export const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)) - 1,
    units.length - 1,
  );
  const value = bytes / 1024 ** (index + 1);
  return `${value >= 10 ? Math.round(value) : value.toFixed(1)} ${units[index]}`;
};

export const fileKindLabel = (
  entry: Pick<AttachmentEntry, "name" | "mediaType">,
) =>
  (entry.name.includes(".")
    ? entry.name.split(".").at(-1)?.toUpperCase()
    : undefined) ||
  entry.mediaType.split("/").at(-1) ||
  "file";

/** The second line of a chip: size, then progress, failure or kind. */
export const statusLabel = (entry: AttachmentEntry) => {
  const { status } = entry;
  const detail =
    status.phase === "failed"
      ? status.message
      : status.phase === "uploading"
        ? status.progress === undefined
          ? "Preparing"
          : status.progress === 100
            ? "Finishing"
            : `${status.progress}%`
        : fileKindLabel(entry);
  return `${formatBytes(entry.sizeBytes)} · ${detail}`;
};

export const hasFiles = (transfer: DataTransfer | null | undefined) =>
  transfer?.types.includes("Files") === true;

export const filesFromTransfer = (transfer: DataTransfer | null) =>
  transfer === null ? [] : Array.from(transfer.files);

/**
 * Capy pastes rich clipboard content as plain text when it carries text and
 * HTML but no inline image, and the clipboard also holds files or a table
 * (spreadsheets put a PNG of the cells beside the text). Returns that text, or
 * undefined when the paste should go through normally.
 */
export const pastedPlainText = (clipboard: DataTransfer | null) => {
  if (clipboard === null) return undefined;
  const html = clipboard.getData("text/html");
  const text = clipboard
    .getData("text/plain")
    .replace(/\r\n?/g, "\n")
    .replace(/\n$/, "");
  if (text.trim() === "" || html === "" || /<img\b/i.test(html))
    return undefined;
  return clipboard.files.length > 0 || /<table\b/i.test(html)
    ? text
    : undefined;
};

export const readyRefs = (entries: ReadonlyArray<AttachmentEntry>) =>
  entries.flatMap((entry) =>
    entry.status.phase === "ready" ? [entry.status.ref] : [],
  );
