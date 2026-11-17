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

export type TaskRow = {
  id: string;
  parentId: string | null;
  relationType: "task" | "side_thread";
  localIndex: number | null;
  title: string | null;
  status: string;
  modelId: string | null;
  primaryMachine: { kind: string; name?: string; size?: string } | null;
  createdAt: Date;
  updatedAt: Date;
  lastActivityAt: Date | null;
  needsYou: boolean;
  pullCount: number;
  pulls: ReadonlyArray<{ number: number; state: string }>;
};

export function parseTask(row: Row): TaskRow {
  const machine = record(row.primaryMachine);
  const kind = text(machine.kind);
  return {
    id: text(row.id),
    parentId: typeof row.parentId === "string" ? row.parentId : null,
    relationType: row.relationType === "side_thread" ? "side_thread" : "task",
    localIndex: typeof row.localIndex === "number" ? row.localIndex : null,
    title: typeof row.title === "string" ? row.title : null,
    status: text(row.status) || "idle",
    modelId: typeof row.modelId === "string" ? row.modelId : null,
    primaryMachine:
      kind === ""
        ? null
        : { kind, name: text(machine.name), size: text(machine.size) },
    createdAt: date(row.createdAt),
    updatedAt: date(row.updatedAt ?? row.createdAt),
    lastActivityAt:
      row.lastActivityAt === null || row.lastActivityAt === undefined
        ? null
        : date(row.lastActivityAt),
    needsYou: row.needsYou === true,
    pullCount: num(row.pullCount),
    pulls: array(row.pulls).map((pull) => ({
      number: num(pull.number),
      state: text(pull.state),
    })),
  };
}

export type PullRow = {
  id: string;
  jamId: string | null;
  threadId: string;
  number: number;
  url: string;
  repo: string;
  title: string;
  state: "ready" | "pending" | "draft" | "merged" | "failed" | "closed";
  baseRef: string;
  headRef: string;
  additions: number;
  deletions: number;
  createdAt: Date;
};

const PULL_STATES = [
  "ready",
  "pending",
  "draft",
  "merged",
  "failed",
  "closed",
] as const;

export function parsePull(row: Row): PullRow | undefined {
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
      ? (row.state as PullRow["state"])
      : "ready",
    baseRef: text(row.baseRef ?? row.baseRefName),
    headRef: text(row.headRef ?? row.headRefName),
    additions: num(row.additions),
    deletions: num(row.deletions),
    createdAt: date(row.createdAt),
  };
}

export type LocalPullRow = {
  id: string;
  jamId: string;
  userId: string;
  repo: string;
  number: number;
  url: string;
};

export function parseLocalPull(row: Row): LocalPullRow | undefined {
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

export type PortRow = {
  machineId: string;
  port: number;
  title: string;
};

export function parsePort(row: Row): PortRow | undefined {
  const port = num(row.port);
  if (port === 0) return undefined;
  return {
    machineId: text(row.machineId),
    port,
    title: text(row.title) || `Port ${port}`,
  };
}

export type RepoRow = {
  repo: string;
  repoFullName: string | null;
  dirtyCount: number | null;
  ahead: number;
};

export function parseRepo(row: Row): RepoRow {
  return {
    repo: text(row.repo),
    repoFullName:
      typeof row.repoFullName === "string" ? row.repoFullName : null,
    dirtyCount: typeof row.dirtyCount === "number" ? row.dirtyCount : null,
    ahead: num(row.upstream?.ahead),
  };
}

export type TurnRow = {
  fileCount: number;
  additions: number;
  deletions: number;
};

export function parseTurn(row: Row): TurnRow {
  return {
    fileCount: num(row.fileCount),
    additions: num(row.additions),
    deletions: num(row.deletions),
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
