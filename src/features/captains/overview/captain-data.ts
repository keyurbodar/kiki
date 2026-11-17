import { Atom } from "effect/reactivity";
import type { DriveEntry, DriveVolume } from "@/components/drive-file-pane";
import { queryTimeToLive } from "@/data/atoms/conventions";
import { ApiClient } from "@/data/client/ApiClient";

/** A Captain's avatar: a preset Capy mark, an emoji, or an uploaded image. */
export type CaptainAvatarValue = {
  kind: "preset" | "emoji";
  value: string;
  background?: string;
  image?: string;
};

export type Captain = {
  id: string;
  name: string;
  description: string | null;
  avatar: CaptainAvatarValue | undefined;
};

export type CrewThreadStatus = "working" | "waiting" | "idle";

export type CrewThread = {
  id: string;
  title: string | null;
  code: string | null;
  status: CrewThreadStatus;
  needsYou: boolean;
  unread: boolean;
  modelName: string | null;
  pulls: { number: number; state: string }[];
  pullCount: number;
  lastActivityAt: Date | null;
  updatedAt: Date;
};

export type CaptainDriveFile = DriveEntry & { updatedAt: Date | null };

/** A Captain's drive: its artifacts volume and the files at its head. */
export type CaptainDrive = { volume: DriveVolume; files: CaptainDriveFile[] };

/** The preset a Captain shows until someone picks an avatar. */
export const defaultCaptainAvatar: CaptainAvatarValue = {
  kind: "preset",
  value: "capy-avatar-1",
};

export const captainPresetUrl = (value: string) => `/avatars/${value}.png`;

export const captainReactivityKeys = (orgId: string, jamId: string) => [
  `captain:${jamId}`,
  `captain:${orgId}`,
  `captains:${orgId}`,
  `jam:${jamId}`,
  `jam:${orgId}`,
];

type Json = Record<string, unknown>;

const record = (value: unknown): Json =>
  typeof value === "object" && value !== null ? (value as Json) : {};
const text = (value: unknown) => (typeof value === "string" ? value : null);
const date = (value: unknown) => {
  if (value instanceof Date) return value;
  if (typeof value !== "string" && typeof value !== "number") return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

function toAvatar(json: Json): CaptainAvatarValue | undefined {
  const avatar = record(record(json.face).avatar ?? json.avatar);
  const kind = avatar.kind;
  const value = text(avatar.value);
  const image = text(avatar.image) ?? text(json.imageUrl) ?? undefined;
  if ((kind === "preset" || kind === "emoji") && value !== null) {
    return {
      kind,
      value,
      background: text(avatar.background) ?? undefined,
      image,
    };
  }
  return image === undefined ? undefined : { ...defaultCaptainAvatar, image };
}

/** Reads the undecoded captains.get response. */
export function toCaptain(value: unknown): Captain | undefined {
  const json = record(value);
  const face = record(json.face);
  const id = text(json.id);
  if (id === null) return undefined;
  return {
    id,
    name: text(face.name) ?? text(json.name) ?? text(json.title) ?? "",
    description: text(face.description) ?? text(json.description),
    avatar: toAvatar(json),
  };
}

const statuses: readonly CrewThreadStatus[] = ["working", "waiting", "idle"];

/** Reads one row of the undecoded captains.crew response. */
export function toCrewThread(value: unknown): CrewThread | undefined {
  const json = record(value);
  const id = text(json.id);
  if (id === null) return undefined;
  const pulls = Array.isArray(json.pulls)
    ? json.pulls.map(record).map((pull) => ({
        number: Number(pull.number ?? pull.prNumber ?? 0),
        state: text(pull.state) ?? "open",
      }))
    : [];
  const status = statuses.find((s) => s === json.status) ?? "idle";
  return {
    id,
    title: text(json.title),
    code: text(json.code),
    status,
    needsYou: json.needsYou === true,
    unread: json.unread === true || json.hasUnreads === true,
    modelName: text(json.modelName) ?? text(record(json.model).name),
    pulls,
    pullCount:
      typeof json.pullCount === "number" ? json.pullCount : pulls.length,
    lastActivityAt: date(json.lastActivityAt),
    updatedAt: date(json.updatedAt) ?? date(json.createdAt) ?? new Date(0),
  };
}

/** Reads the undecoded drive listing scoped to one Captain. */
export function toCaptainDrive(value: unknown): CaptainDrive | null {
  const isList = Array.isArray(value);
  const volumes = isList ? value : [value];
  const json = record(volumes[0]);
  const source = record(json.volume ?? (isList ? json : {}));
  const id = text(json.volumeId) ?? text(source.id) ?? text(json.id);
  if (id === null) return null;
  const volume: DriveVolume = {
    id,
    namespace: text(source.namespace) ?? "artifacts",
    name: text(source.name) ?? "artifacts",
    headVersionId: text(source.headVersionId) ?? text(json.versionId),
  };
  const rows = Array.isArray(json.items)
    ? json.items
    : Array.isArray(json.files)
      ? json.files
      : [];
  const files = (isList ? [] : rows.map(record)).flatMap(
    (row): CaptainDriveFile[] => {
      const entry = record(row.entry ?? row);
      const path = text(entry.path);
      if (path === null) return [];
      return [
        {
          path,
          volume,
          versionId: text(row.versionId) ?? volume.headVersionId ?? "",
          sha256: text(entry.sha256) ?? "",
          sizeBytes: Number(entry.sizeBytes ?? entry.size ?? 0),
          updatedAt: date(entry.updatedAt ?? row.changedAt),
        },
      ];
    },
  );
  return { volume, files };
}

const crewRank = (thread: CrewThread) =>
  thread.status === "working" ? 0 : thread.status === "waiting" ? 1 : 2;

const activity = (thread: CrewThread) =>
  (thread.lastActivityAt ?? thread.updatedAt).getTime();

/** Working threads first, then waiting, then idle; newest activity first. */
export const sortCrew = (crew: readonly CrewThread[]) =>
  crew.toSorted(
    (a, b) => crewRank(a) - crewRank(b) || activity(b) - activity(a),
  );

/** Files the drive strip shows: most recently changed first, capped. */
export const recentDriveFiles = (
  files: readonly CaptainDriveFile[],
  limit: number,
) => {
  const ordered = files.toSorted(
    (a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0),
  );
  return { shown: ordered.slice(0, limit), total: ordered.length };
};

/** Whether a Captain's overview has a crew or drive section to show. */
export const hasCaptainOverviewContent = (
  crew: readonly CrewThread[] | undefined,
  drive: CaptainDrive | null | undefined,
) => (crew?.length ?? 0) > 0 || (drive?.files.length ?? 0) > 0;

/** The toast description after a thread leaves a Captain's crew. */
export const crewRemovedDescription = (title: string, captainName?: string) =>
  captainName === undefined ? title : `${title} left ${captainName}`;

const key = (orgId: string, jamId: string) => `${orgId}/${jamId}`;
const split = (value: string) => {
  const slash = value.indexOf("/");
  return { orgId: value.slice(0, slash), jamId: value.slice(slash + 1) };
};

const captainQuery = Atom.family((value: string) => {
  const { orgId, jamId } = split(value);
  return ApiClient.query("captains", "get", {
    params: { orgId, jamId },
    reactivityKeys: [`captain:${jamId}`, `jam:${jamId}`],
    timeToLive: queryTimeToLive,
  });
});

const crewQuery = Atom.family((value: string) => {
  const { orgId, jamId } = split(value);
  return ApiClient.query("captains", "crew", {
    params: { orgId, jamId },
    reactivityKeys: [`captain:${jamId}`, `jam_relation:${jamId}`],
    timeToLive: queryTimeToLive,
  });
});

const driveQuery = Atom.family((value: string) => {
  const { orgId, jamId } = split(value);
  return ApiClient.query("volumes", "list", {
    params: { orgId },
    query: { captainJamId: jamId, exactScope: "true" },
    reactivityKeys: [`captain-drive:${jamId}`],
    timeToLive: queryTimeToLive,
  });
});

export const captainAtom = (orgId: string, jamId: string) =>
  captainQuery(key(orgId, jamId));
export const captainCrewAtom = (orgId: string, jamId: string) =>
  crewQuery(key(orgId, jamId));
export const captainDriveAtom = (orgId: string, jamId: string) =>
  driveQuery(key(orgId, jamId));
export const captainDriveKey = (jamId: string) => `captain-drive:${jamId}`;

export const updateCaptainAtom = ApiClient.mutation("captains", "update");
export const leaveCrewAtom = ApiClient.mutation("captains", "leaveCrew");
