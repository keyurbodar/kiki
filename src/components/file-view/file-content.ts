import type { MediaKind } from "./file-kind";

export type FileDownload = { loaded: number; total?: number };

export type FileContent =
  | { kind: "symlink"; target: string }
  | { kind: "no_preview" }
  | ({ kind: "downloading" } & FileDownload)
  | { kind: "gated"; sizeBytes: number; onLoad: () => void }
  | {
      kind: "media";
      media: MediaKind;
      url: string;
      label: string;
      onFailed?: () => void;
    }
  | {
      kind: "text";
      text: string;
      truncatedFrom?: number;
      downloading?: FileDownload;
    };

export type FileHome =
  | { kind: "repo"; repo: string; branch?: string | null }
  | { kind: "machine"; jamId: string; name?: string }
  | { kind: "device"; name: string }
  | { kind: "folder"; name: string }
  | { kind: "drive"; location: string }
  | { kind: "upload" };

export type FileVersion = { value: string; label: string; detail?: string };

export type FileVersions = {
  list: readonly FileVersion[];
  current: string;
  onPick: (value: string) => void;
  compare?: (base: string, head: string) => import("react").ReactNode;
};

export const textReady = (content: FileContent | undefined) =>
  content !== undefined &&
  content.kind !== "downloading" &&
  (content.kind !== "text" || content.downloading === undefined);
