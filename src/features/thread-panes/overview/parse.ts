import type { LocalPull } from "@/features/thread/local-pull-rows";
import type { OverviewPull, OverviewTask, OverviewThreadStatus } from "./model";

type Row = Record<string, unknown>;

const record = (value: unknown): Row =>
  typeof value === "object" && value !== null ? (value as Row) : {};

const array = (value: unknown): ReadonlyArray<Row> =>
  Array.isArray(value) ? value.map(record) : [];

const text = (value: unknown) =>
  typeof value === "string"
    ? value
    : typeof value === "number"
      ? String(value)
      : "";

const num = (value: unknown) =>
  typeof value === "number"
    ? value
    : typeof value === "string"
      ? Number(value)
      : 0;

const date = (value: unknown) => {
  if (value instanceof Date) return value;
  if (typeof value === "number") return new Date(value);
  if (typeof value === "string") return new Date(value);
  return new Date(0);
};

const THREAD_STATUSES: ReadonlyArray<OverviewThreadStatus> = [
  "idle",
  "working",
  "waiting",
  "needs_you",
  "done",
  "failed",
  "draft",
  "archived",
];

const threadStatus = (value: unknown): OverviewThreadStatus => {
  const status = text(value);
  return THREAD_STATUSES.find((candidate) => candidate === status) ?? "idle";
};

export function parseTask(row: Row): OverviewTask {
  const machine = record(row.primaryMachine);
  const kind = text(machine.kind);
  return {
    id: text(row.id),
    parentJamId:
      typeof row.parentJamId === "string"
        ? row.parentJamId
        : typeof row.parentId === "string"
          ? row.parentId
          : null,
    relationType: row.relationType === "side_thread" ? "side_thread" : "task",
    localIndex: typeof row.localIndex === "number" ? row.localIndex : null,
    title: typeof row.title === "string" ? row.title : null,
    status: threadStatus(row.status),
    modelId: typeof row.modelId === "string" ? row.modelId : null,
    machine:
      kind === "device"
        ? { kind: "device", name: text(machine.name) || "device" }
        : kind === ""
          ? null
          : { kind: "cloud", size: text(machine.size) || null },
    createdAt: date(row.createdAt),
    lastActivityAt:
      row.lastActivityAt === null || row.lastActivityAt === undefined
        ? null
        : date(row.lastActivityAt),
  };
}

const PULL_STATES = [
  "ready",
  "pending",
  "draft",
  "merged",
  "failed",
  "closed",
] as const;

export function parsePull(row: Row): OverviewPull | undefined {
  const url = text(row.url);
  if (url === "") return undefined;
  return {
    id: text(row.id) || url,
    jamId: typeof row.jamId === "string" ? row.jamId : null,
    threadId: text(row.threadId),
    number: num(row.number),
    url,
    repo: text(row.repo),
    title: text(row.title),
    state: PULL_STATES.includes(row.state as (typeof PULL_STATES)[number])
      ? (row.state as OverviewPull["state"])
      : "ready",
    baseRef: text(row.baseRef ?? row.baseRefName),
    headRef: text(row.headRef ?? row.headRefName),
    additions: num(row.additions),
    deletions: num(row.deletions),
    createdAt: date(row.createdAt),
  };
}

export function parseLocalPull(row: Row): LocalPull | undefined {
  const url = text(row.url);
  if (url === "") return undefined;
  return {
    id: text(row.id) || url,
    jamId: text(row.jamId),
    userId: text(row.userId),
    repo: text(row.repo),
    number: num(row.number),
    url,
  };
}

export function valueList(value: unknown): ReadonlyArray<Row> {
  if (Array.isArray(value)) return array(value);
  if (typeof value === "object" && value !== null) {
    const entries = (value as Row).entries;
    if (Array.isArray(entries)) return array(entries);
  }
  return [];
}
