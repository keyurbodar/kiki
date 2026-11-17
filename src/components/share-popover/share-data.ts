import { Atom } from "effect/reactivity";
import type { DriveShareId, VolumeId } from "@/data/api/schemas/drive";
import type { OrgId } from "@/data/api/schemas/ids";
import { ApiClient } from "@/data/client/ApiClient";
import type { ShareVisibility } from "./share-visibility";

export interface DriveShareRow {
  readonly id: string;
  readonly path: string;
  readonly url: string;
  readonly visibility: ShareVisibility;
  readonly createdBy: string | null;
  readonly manageable: boolean;
  readonly changedAt: string | null;
  readonly projectId: string | null;
  readonly userId: string | null;
  readonly automationId: string | null;
  readonly captainJamId: string | null;
}

export interface DriveSharePage {
  readonly items: ReadonlyArray<DriveShareRow>;
  readonly total: number;
  readonly page: number;
  readonly pageCount: number;
}

type Fields = Record<string, unknown>;

const record = (value: unknown): Fields =>
  typeof value === "object" && value !== null ? (value as Fields) : {};

const text = (value: unknown) => (typeof value === "string" ? value : null);

const count = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

export const toVisibility = (value: unknown): ShareVisibility =>
  value === "public" || value === "org" || value === "private"
    ? value
    : "private";

export const decodeShareRow = (value: unknown): DriveShareRow => {
  const row = record(value);
  return {
    id: text(row.id) ?? "",
    path: text(row.path) ?? "",
    url: text(row.url) ?? "",
    visibility: toVisibility(row.visibility),
    createdBy: text(row.createdBy),
    manageable: row.manageable !== false,
    changedAt: text(row.changedAt),
    projectId: text(row.projectId),
    userId: text(row.userId),
    automationId: text(row.automationId),
    captainJamId: text(row.captainJamId),
  };
};

export const decodeShareList = (value: unknown): ReadonlyArray<DriveShareRow> =>
  (Array.isArray(value)
    ? value
    : ((record(value).items as unknown[]) ?? [])
  ).map(decodeShareRow);

export const decodeSharePage = (value: unknown): DriveSharePage => {
  if (Array.isArray(value)) {
    const items = value.map(decodeShareRow);
    return { items, total: items.length, page: 1, pageCount: 1 };
  }
  const page = record(value);
  const items = Array.isArray(page.items) ? page.items.map(decodeShareRow) : [];
  return {
    items,
    total: count(page.total, items.length),
    page: count(page.page, 1),
    pageCount: count(page.pageCount, 1),
  };
};

const shareKey = (orgId: string) => `drive-share:${orgId}`;
const keyed = (value: unknown) => JSON.stringify(value);

const volumeSharesFamily = Atom.family((key: string) => {
  const { orgId, volumeId } = JSON.parse(key) as {
    orgId: OrgId;
    volumeId: VolumeId;
  };
  return ApiClient.query("volumes", "listShares", {
    params: { orgId, volumeId },
    reactivityKeys: [shareKey(orgId)],
    timeToLive: "5 minutes",
  });
});

export const volumeSharesAtom = (orgId: OrgId, volumeId: VolumeId) =>
  volumeSharesFamily(keyed({ orgId, volumeId }));

const orgSharesFamily = Atom.family((key: string) => {
  const { orgId, page } = JSON.parse(key) as { orgId: OrgId; page: number };
  return ApiClient.query("volumes", "listOrgShares", {
    params: { orgId },
    query: { page },
    reactivityKeys: [shareKey(orgId)],
    timeToLive: "5 minutes",
  });
});

export const orgSharesAtom = (orgId: OrgId, page = 1) =>
  orgSharesFamily(keyed({ orgId, page }));

export const createShareAtom = ApiClient.mutation("volumes", "createShare");

export type { DriveShareId };
export const updateShareAtom = ApiClient.mutation("volumes", "updateShare");
export const revokeShareAtom = ApiClient.mutation("volumes", "revokeShare");
