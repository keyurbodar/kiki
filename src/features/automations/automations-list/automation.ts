import { isTriggerType, type Trigger } from "./triggers";

/** An automation as the list draws it: Capy's Automation plus the creator's name. */
export type AutomationRow = {
  readonly id: string;
  readonly projectId: string;
  readonly name: string;
  readonly description: string | null;
  readonly triggers: ReadonlyArray<Trigger>;
  readonly enabled: boolean;
  readonly creatorUserId: string;
  readonly creator: string;
  readonly singleJamId: string | null;
  readonly lastTriggeredAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

type Json = Record<string, unknown>;

const isRecord = (value: unknown): value is Json =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const text = (value: unknown) =>
  typeof value === "string" ? value : undefined;

const date = (value: unknown) => {
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const decodeTrigger = (value: unknown): Trigger | undefined => {
  if (!isRecord(value) || !isTriggerType(value.type)) return undefined;
  return {
    type: value.type,
    event: text(value.event),
    cron: text(value.cron),
    timezone: text(value.timezone),
  };
};

/**
 * Reads one automation from the undecoded listPage payload. The endpoint is still
 * `Undecoded` on the client, so this narrows Capy's Automation fields by hand.
 */
export const decodeAutomation = (
  value: unknown,
  nameOf: (userId: string) => string | undefined,
): AutomationRow | undefined => {
  if (!isRecord(value)) return undefined;
  const id = text(value.id);
  const name = text(value.name);
  const createdAt = date(value.createdAt);
  if (id === undefined || name === undefined || createdAt === undefined)
    return undefined;
  const creatorUserId = text(value.creatorUserId) ?? text(value.ownerId) ?? "";
  return {
    id,
    projectId: text(value.projectId) ?? "",
    name,
    description: text(value.description) ?? null,
    triggers: (Array.isArray(value.triggers) ? value.triggers : [])
      .map(decodeTrigger)
      .filter((trigger) => trigger !== undefined),
    enabled: value.enabled === true,
    creatorUserId,
    creator: nameOf(creatorUserId) ?? text(value.creator) ?? creatorUserId,
    singleJamId: text(value.singleJamId) ?? null,
    lastTriggeredAt: date(value.lastTriggeredAt) ?? null,
    createdAt,
    updatedAt: date(value.updatedAt) ?? createdAt,
  };
};

/** Items and cursor of an AutomationListPage, or a bare array. */
export const decodeAutomationPage = (
  value: unknown,
  nameOf: (userId: string) => string | undefined,
) => {
  const items = Array.isArray(value)
    ? value
    : isRecord(value) && Array.isArray(value.items)
      ? value.items
      : [];
  return {
    rows: items
      .map((item) => decodeAutomation(item, nameOf))
      .filter((row) => row !== undefined),
    cursor: isRecord(value) ? (text(value.cursor) ?? null) : null,
  };
};

/** Members of the undecoded listMembers payload, as id and display name. */
export const decodeMembers = (value: unknown) => {
  const items = Array.isArray(value)
    ? value
    : isRecord(value) && Array.isArray(value.items)
      ? value.items
      : [];
  return items.flatMap((item) => {
    if (!isRecord(item)) return [];
    const userId = text(item.userId) ?? text(item.id);
    if (userId === undefined) return [];
    const full = [text(item.firstName), text(item.lastName)]
      .filter((part) => part !== undefined && part !== "")
      .join(" ");
    return [
      {
        userId,
        name: full === "" ? (text(item.email) ?? text(item.name)) : full,
        imageUrl: text(item.imageUrl) ?? null,
      },
    ];
  });
};

/** Local edits laid over the server rows until the next fetch catches up. */
export type OptimisticAutomations = {
  readonly rows: ReadonlyMap<
    string,
    { readonly row: AutomationRow; readonly sinceBase: number }
  >;
  readonly deleted: ReadonlySet<string>;
};

export const emptyOptimistic: OptimisticAutomations = {
  rows: new Map(),
  deleted: new Set(),
};

export const withOptimisticRow = (
  state: OptimisticAutomations,
  row: AutomationRow,
  base: Date,
): OptimisticAutomations => {
  const current = state.rows.get(row.id);
  const keep =
    current !== undefined && current.row.updatedAt.getTime() === base.getTime();
  return {
    ...state,
    rows: new Map(state.rows).set(row.id, {
      row,
      sinceBase: keep ? current.sinceBase : base.getTime(),
    }),
  };
};

export const withOptimisticDeleted = (
  state: OptimisticAutomations,
  id: string,
  deleted: boolean,
): OptimisticAutomations => {
  const next = new Set(state.deleted);
  if (deleted) next.add(id);
  else next.delete(id);
  return { ...state, deleted: next };
};

/** Server rows with local edits applied, as long as the server row hasn't moved on. */
export const mergeOptimistic = (
  state: OptimisticAutomations,
  rows: ReadonlyArray<AutomationRow>,
) => {
  const ids = new Set(rows.map((row) => row.id));
  const merged = rows.map((row) => {
    const local = state.rows.get(row.id);
    return local !== undefined && row.updatedAt.getTime() === local.sinceBase
      ? local.row
      : row;
  });
  const added = [...state.rows.values()]
    .filter((entry) => !ids.has(entry.row.id))
    .map((entry) => entry.row);
  return [...merged, ...added].filter((row) => !state.deleted.has(row.id));
};

const second = 1000;
const minute = 60 * second;
const hour = 60 * minute;
const day = 24 * hour;
const week = 7 * day;
const year = 365 * day;

/** Capy's relative time; minified gives the bare unit (`5h`). */
export const formatRelativeTime = (
  value: Date,
  options: { now: number; minified?: boolean },
) => {
  const diff = options.now - value.getTime();
  const abs = Math.abs(diff);
  const minified = options.minified === true;
  if (abs < 5 * second) return minified ? "now" : "just now";
  const unit =
    abs < minute
      ? `${Math.floor(abs / second)}s`
      : abs < hour
        ? `${Math.floor(abs / minute)}m`
        : abs < day
          ? `${Math.floor(abs / hour)}h`
          : abs < week
            ? `${Math.floor(abs / day)}d`
            : abs < year
              ? `${Math.floor(abs / week)}w`
              : `${Math.floor(abs / year)}y`;
  if (minified) return unit;
  return diff < 0 ? `in ${unit}` : `${unit} ago`;
};
