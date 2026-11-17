import { DateTime } from "effect";
import type { VolumeVersionRow } from "@/data/api/schemas/drive";
import { formatBytes, formatRelativeTime } from "@/features/drive/lib/format";

/** Change rows a version's changes list reveals per "Show more". */
export const changePageSize = 50;

export const changeLabels = {
  added: "Added",
  modified: "Modified",
  deleted: "Deleted",
} as const;

export const holdKinds = [
  "live",
  "staged",
  "pin",
  "lease",
  "conflict",
  "retained",
] as const;

export type HoldKind = (typeof holdKinds)[number];

export const holdCopy: Record<HoldKind, { word: string; detail: string }> = {
  live: { word: "Live", detail: "A file exists at this path again" },
  staged: { word: "Staged", detail: "An unfinished commit writes this path" },
  pin: { word: "Pinned", detail: "A pinned version holds this name" },
  lease: { word: "Leased", detail: "An open read holds this name" },
  conflict: { word: "Conflict", detail: "An open conflict keeps this name" },
  retained: {
    word: "Retained",
    detail: "A version still in history holds this name",
  },
};

export interface PurgeHold {
  readonly kind: HoldKind;
  readonly seq: number | null;
}

export interface PurgeRefusal {
  readonly reason: string;
  readonly holds: ReadonlyArray<PurgeHold>;
}

/** Capy's `capy/DrivePurgeNameRefused` error, as the purge mutation rejects with it. */
export const isPurgeRefusal = (
  error: unknown,
): error is PurgeRefusal & { readonly _tag: string } =>
  typeof error === "object" &&
  error !== null &&
  "_tag" in error &&
  error._tag === "capy/DrivePurgeNameRefused";

/** Holds grouped by kind in Capy's order, each with the version seqs it names. */
export const groupHolds = (holds: ReadonlyArray<PurgeHold>) =>
  holdKinds.flatMap((kind) => {
    const matching = holds.filter((hold) => hold.kind === kind);
    return matching.length === 0
      ? []
      : [
          {
            kind,
            seqs: matching.flatMap((hold) =>
              hold.seq === null ? [] : [hold.seq],
            ),
          },
        ];
  });

export const holdSeqLabel = (seqs: ReadonlyArray<number>) =>
  seqs.length === 1 ? `seq ${seqs[0]}` : `${seqs.length} versions`;

type VersionRow = Pick<
  VolumeVersionRow,
  | "createdAt"
  | "fileCount"
  | "totalBytes"
  | "kind"
  | "threadId"
  | "threadTitle"
  | "authorName"
>;

export const versionTitle = (version: VersionRow) =>
  version.threadTitle ??
  version.authorName ??
  (version.threadId === null ? "Edited in the browser" : "Untitled thread");

export const versionMeta = (
  version: VersionRow,
  options: { readonly now: number; readonly current: boolean },
) =>
  [
    formatRelativeTime(DateTime.toEpochMillis(version.createdAt), {
      now: options.now,
    }),
    `${version.fileCount} ${version.fileCount === 1 ? "file" : "files"}`,
    formatBytes(version.totalBytes),
    ...(version.kind === "autosave" ? ["autosave"] : []),
    ...(options.current ? ["current"] : []),
  ].join(" · ");
