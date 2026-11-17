export type AccessStatus = "requested" | "granted" | "denied" | "revoked";

type Timed = {
  status: AccessStatus;
  requestedAt: Date;
  resolvedAt: Date | null;
};

export type MessageAccessRow = Timed & {
  id: string;
  member: string;
  heldText: string | null;
};

export type AgentAccessTarget =
  | {
      kind: "device";
      capability: "execution" | "computer_use";
      deviceId: string;
    }
  | { kind: "slack_user_read" };

export type AgentAccessRow = Timed & {
  id: string;
  target: AgentAccessTarget;
  title: string;
  call?: { label: string; toolName: string; detail: string };
  summary?: string;
};

export type AccessAction = "grant" | "deny" | "revoke";

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const YEAR = 365 * DAY;

export function relativeTime(date: Date | number, now = Date.now()): string {
  const diff = now - (typeof date === "number" ? date : date.getTime());
  const abs = Math.abs(diff);
  if (abs < 5 * SECOND) return "just now";
  const amount =
    abs < MINUTE
      ? `${Math.floor(abs / SECOND)}s`
      : abs < HOUR
        ? `${Math.floor(abs / MINUTE)}m`
        : abs < DAY
          ? `${Math.floor(abs / HOUR)}h`
          : abs < WEEK
            ? `${Math.floor(abs / DAY)}d`
            : abs < YEAR
              ? `${Math.floor(abs / WEEK)}w`
              : `${Math.floor(abs / YEAR)}y`;
  return diff < 0 ? `in ${amount}` : `${amount} ago`;
}

export function accessStatusLine(row: Timed, now = Date.now()): string {
  switch (row.status) {
    case "requested":
      return `Asked ${relativeTime(row.requestedAt, now)}`;
    case "granted":
      return `Allowed ${relativeTime(row.resolvedAt ?? row.requestedAt, now)}`;
    case "denied":
      return `Denied ${relativeTime(row.resolvedAt ?? row.requestedAt, now)}`;
    case "revoked":
      return `Revoked ${relativeTime(row.resolvedAt ?? row.requestedAt, now)}`;
  }
}

const statusRank = (status: AccessStatus) =>
  status === "requested" ? 0 : status === "granted" ? 1 : 2;

export const byAccessOrder = (a: Timed, b: Timed) =>
  statusRank(a.status) - statusRank(b.status) ||
  b.requestedAt.getTime() - a.requestedAt.getTime();

export const SLACK_READ_SUMMARY =
  "Read-only, with your Slack access, in this thread";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const listOf = (value: unknown): Record<string, unknown>[] => {
  const list = Array.isArray(value)
    ? value
    : isRecord(value)
      ? (value.rows ?? value.items ?? value.access ?? value.requests)
      : undefined;
  return Array.isArray(list) ? list.filter(isRecord) : [];
};

const toDate = (value: unknown): Date | null => {
  if (value instanceof Date) return value;
  if (typeof value !== "string" && typeof value !== "number") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const toStatus = (value: unknown): AccessStatus | null =>
  value === "pending"
    ? "requested"
    : value === "requested" ||
        value === "granted" ||
        value === "denied" ||
        value === "revoked"
      ? value
      : null;

const timestamp = (
  row: Record<string, unknown>,
  keys: ReadonlyArray<string>,
) => {
  for (const key of keys) {
    const date = toDate(row[key]);
    if (date !== null) return date;
  }
  return null;
};

export type RawDeviceAccess = {
  id: string;
  threadId: string;
  userId: string;
  status: AccessStatus;
  requestedAt: Date;
  resolvedAt: Date | null;
  held: { text: string; fileCount: number } | null;
};

export function parseDeviceAccess(value: unknown): RawDeviceAccess[] {
  return listOf(value).flatMap((row) => {
    const status = toStatus(row.status);
    const requestedAt = timestamp(row, [
      "requestedAt",
      "createdAt",
      "updatedAt",
    ]);
    if (typeof row.id !== "string" || status === null || requestedAt === null) {
      return [];
    }
    const held = isRecord(row.held) ? row.held : null;
    return [
      {
        id: row.id,
        threadId: String(row.threadId ?? row.jamId ?? ""),
        userId: String(row.userId ?? row.requesterId ?? ""),
        status,
        requestedAt,
        resolvedAt: timestamp(row, ["resolvedAt", "decidedAt"]),
        held:
          held === null
            ? null
            : {
                text: String(held.text ?? ""),
                fileCount:
                  typeof held.fileCount === "number" ? held.fileCount : 0,
              },
      },
    ];
  });
}

export const messageAccessRows = (
  rows: ReadonlyArray<RawDeviceAccess>,
  rootJamId: string,
  memberName: (userId: string) => string | undefined,
): MessageAccessRow[] =>
  rows.flatMap((row) =>
    row.threadId !== rootJamId
      ? []
      : [
          {
            id: row.id,
            member: memberName(row.userId) ?? "A teammate",
            status: row.status,
            requestedAt: row.requestedAt,
            resolvedAt: row.resolvedAt,
            heldText: row.held?.text ?? null,
          },
        ],
  );

export type RawAgentAccess = {
  id: string;
  capability: "execution" | "computer_use";
  deviceId: string;
  deviceName: string;
  workspaceRoot: string;
  toolName: string;
  toolInput: unknown;
  status: AccessStatus;
  requestedAt: Date;
  resolvedAt: Date | null;
};

export function parseAgentAccess(value: unknown): RawAgentAccess[] {
  return listOf(value).flatMap((row) => {
    const status = toStatus(row.status);
    const requestedAt = toDate(row.requestedAt);
    if (typeof row.id !== "string" || status === null || requestedAt === null) {
      return [];
    }
    return [
      {
        id: row.id,
        capability:
          row.capability === "computer_use" ? "computer_use" : "execution",
        deviceId: String(row.deviceId ?? ""),
        deviceName: String(row.deviceName ?? ""),
        workspaceRoot: String(row.workspaceRoot ?? ""),
        toolName: String(row.toolName ?? ""),
        toolInput: row.toolInput,
        status,
        requestedAt,
        resolvedAt: timestamp(row, ["resolvedAt", "updatedAt", "decidedAt"]),
      },
    ];
  });
}

export function permissionCallDetail(row: {
  capability: "execution" | "computer_use";
  workspaceRoot: string;
  toolInput: unknown;
}): string {
  if (row.capability === "execution") return row.workspaceRoot;
  const input = (isRecord(row.toolInput) ? row.toolInput : {}) as {
    target?: { app?: { name?: unknown; bundleId?: unknown }; kind?: unknown };
    app?: { name?: unknown };
    launch?: { name?: unknown };
  };
  const name =
    input.target?.app?.name ??
    input.target?.app?.bundleId ??
    input.app?.name ??
    input.launch?.name;
  if (typeof name === "string") return name;
  return input.target?.kind === "screen"
    ? "the screen"
    : "the active application";
}

export const deviceAgentRow = (row: RawAgentAccess): AgentAccessRow => ({
  id: row.id,
  target: {
    kind: "device",
    capability: row.capability,
    deviceId: row.deviceId,
  },
  title:
    row.capability === "execution"
      ? row.deviceName
      : `Computer use on ${row.deviceName}`,
  call: {
    label: row.toolName,
    toolName: row.toolName,
    detail: permissionCallDetail(row),
  },
  status: row.status,
  requestedAt: row.requestedAt,
  resolvedAt: row.resolvedAt,
});

export const slackReadRow = (row: {
  id: string;
  status: AccessStatus;
  requestedAt: Date;
  resolvedAt: Date | null;
}): AgentAccessRow => ({
  id: row.id,
  target: { kind: "slack_user_read" },
  title: "Read Slack as you",
  summary: SLACK_READ_SUMMARY,
  status: row.status,
  requestedAt: row.requestedAt,
  resolvedAt: row.resolvedAt,
});

export const accessFailure = (action: AccessAction) =>
  action === "grant"
    ? "Could not allow access"
    : action === "deny"
      ? "Could not deny access"
      : "Could not revoke access";
