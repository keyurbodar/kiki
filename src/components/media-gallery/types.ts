import type { FileRef } from "@/data/events/common";

/** A stored file plus the title a message gave it (A8's `TitledFile`). */
export type GalleryEntry = {
  readonly file: FileRef;
  readonly title?: string;
  /** A resolved URL for the entry, when the caller already has one. */
  readonly url?: string;
  /** The entry's URL could not be resolved; tiles show the unavailable state. */
  readonly unavailable?: boolean;
};

export type MediaKind = "image" | "video" | "audio";

export type MediaItem = {
  readonly key: string;
  readonly label: string;
  readonly kind: MediaKind;
  readonly entry: GalleryEntry;
};

export const entryKey = (entry: GalleryEntry) =>
  JSON.stringify([entry.file.fileId, entry.title ?? entry.file.name]);

export const mediaLabel = (entry: GalleryEntry) =>
  entry.title ?? entry.file.name;

export const mediaKind = (entry: GalleryEntry): MediaKind | undefined => {
  const mediaType = entry.file.mediaType.toLowerCase();
  if (mediaType.startsWith("image/")) return "image";
  if (mediaType.startsWith("video/")) return "video";
  if (mediaType.startsWith("audio/")) return "audio";
  return undefined;
};

const previewMediaTypes = new Set(["image/jpeg", "image/png"]);

/** JPEG and PNG have real previews; everything else reads the display copy. */
export const mediaSize = (entry: GalleryEntry) => {
  const { width, height } = entry.file;
  return width === undefined || height === undefined
    ? undefined
    : { width, height };
};

/** JPEG and PNG read their preview copy; every other image reads display. */
export const mediaVariant = (entry: GalleryEntry) =>
  previewMediaTypes.has(entry.file.mediaType.toLowerCase())
    ? ("preview" as const)
    : ("display" as const);

/** Media the gallery lays out as tiles: images and video, in order. */
export const mediaItems = (
  entries: ReadonlyArray<GalleryEntry>,
): ReadonlyArray<MediaItem> =>
  entries.flatMap((entry) => {
    const kind = mediaKind(entry);
    if (kind === undefined || kind === "audio") return [];
    return [{ key: entryKey(entry), label: mediaLabel(entry), kind, entry }];
  });

/** The entries the gallery draws as audio players. */
export const audioEntries = (entries: ReadonlyArray<GalleryEntry>) =>
  entries.filter((entry) => mediaKind(entry) === "audio");

/** The entries with no media rendering: documents, sheets, archives. */
export const fileEntries = (entries: ReadonlyArray<GalleryEntry>) =>
  entries.filter((entry) => mediaKind(entry) === undefined);
