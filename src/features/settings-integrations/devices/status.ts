import { DateTime } from "effect";
import type {
  Device,
  DeviceHardware,
  DeviceWorkspace,
} from "@/data/api/schemas/devices";

export type StatusColor =
  | "neutral"
  | "accent"
  | "success"
  | "danger"
  | "warning"
  | "info";

export const statusDotColors: Record<StatusColor, string> = {
  neutral: "bg-muted-foreground-3",
  accent: "bg-primary",
  success: "bg-success",
  danger: "bg-destructive",
  warning: "bg-warning",
  info: "bg-info",
};

const second = 1000;
const minute = 60 * second;
const hour = 60 * minute;
const day = 24 * hour;
const week = 7 * day;
const year = 365 * day;

const millis = (value: DateTime.DateTime | Date | number) =>
  typeof value === "number"
    ? value
    : value instanceof Date
      ? value.getTime()
      : DateTime.toEpochMillis(value);

export function formatRelative(
  value: DateTime.DateTime | Date | number,
  options?: { now?: number; minified?: boolean },
) {
  const delta = (options?.now ?? Date.now()) - millis(value);
  const minified = options?.minified === true;
  const size = Math.abs(delta);
  if (size < 5 * second) return minified ? "now" : "just now";
  const amount =
    size < minute
      ? `${Math.floor(size / second)}s`
      : size < hour
        ? `${Math.floor(size / minute)}m`
        : size < day
          ? `${Math.floor(size / hour)}h`
          : size < week
            ? `${Math.floor(size / day)}d`
            : size < year
              ? `${Math.floor(size / week)}w`
              : `${Math.floor(size / year)}y`;
  return minified ? amount : delta < 0 ? `in ${amount}` : `${amount} ago`;
}

const sameYearFormat = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});
const otherYearFormat = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function formatDateTime(
  value: DateTime.DateTime | Date | number,
  options?: { now?: number },
) {
  const date = new Date(millis(value));
  return (
    date.getFullYear() === new Date(options?.now ?? Date.now()).getFullYear()
      ? sameYearFormat
      : otherYearFormat
  ).format(date);
}

export function formatCountdown(ms: number) {
  const seconds = Math.max(0, Math.floor(ms / second));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export const countLabel = (count: number, noun: string) =>
  count === 0 ? `No ${noun}s` : count === 1 ? `1 ${noun}` : `${count} ${noun}s`;

export function deviceStatus(
  device: Pick<Device, "revokedAt" | "connected" | "lastConnectedAt">,
  options?: { now?: number },
): { color: StatusColor; label: string } {
  const live = device.revokedAt === null && device.connected;
  return {
    color: live ? "success" : "neutral",
    label: live
      ? "Connected"
      : device.lastConnectedAt === null
        ? "Never connected"
        : `Last seen ${formatRelative(device.lastConnectedAt, options)}`,
  };
}

const time = (value: DateTime.DateTime | null) =>
  value === null ? 0 : DateTime.toEpochMillis(value);

export const compareDevices = (
  a: Pick<Device, "revokedAt" | "connected" | "lastConnectedAt" | "createdAt">,
  b: Pick<Device, "revokedAt" | "connected" | "lastConnectedAt" | "createdAt">,
) =>
  Number(a.revokedAt !== null) - Number(b.revokedAt !== null) ||
  Number(b.connected) - Number(a.connected) ||
  time(b.lastConnectedAt) - time(a.lastConnectedAt) ||
  time(b.createdAt) - time(a.createdAt);

export const workspaceDiffCounts = (workspace: DeviceWorkspace) =>
  workspace.insertions === undefined ||
  workspace.deletions === undefined ||
  (workspace.insertions === 0 && workspace.deletions === 0)
    ? undefined
    : { insertions: workspace.insertions, deletions: workspace.deletions };

export const formFactorLabels = {
  laptop: "Laptop",
  desktop: "Desktop",
  server: "Server",
  cloud: "Cloud machine",
} as const;

export function hardwareRows(hardware: DeviceHardware) {
  const model =
    hardware.model === undefined
      ? hardware.modelIdentifier
      : hardware.modelIdentifier === undefined
        ? hardware.model
        : `${hardware.model}, ${hardware.modelIdentifier}`;
  const chip =
    hardware.chip === undefined
      ? undefined
      : hardware.cpuCores === undefined
        ? hardware.chip
        : `${hardware.chip}, ${hardware.cpuCores} cores`;
  const memory =
    hardware.memoryBytes === undefined
      ? undefined
      : `${Math.round(hardware.memoryBytes / 1073741824)} GB`;
  const system =
    hardware.osName === undefined
      ? undefined
      : [hardware.osName, hardware.osVersion]
          .filter((part) => part !== undefined)
          .join(" ");
  return [
    { label: "Model", value: model },
    { label: "Chip", value: chip },
    { label: "Memory", value: memory },
    { label: "System", value: system },
  ].filter(
    (row): row is { label: string; value: string } => row.value !== undefined,
  );
}

export const accessLabels = { personal: "Personal", shared: "Shared" } as const;
export const agentAccessLabels = {
  ask: "Ask each thread",
  always: "Always allow",
} as const;

export const accessDescription = (
  access: "personal" | "shared",
  orgName: string,
) =>
  access === "personal"
    ? "Only your threads run on this device; your other threads ask before using it, and teammates ask per thread to message it"
    : `Anyone in ${orgName} can run threads on this device, reach it from any thread, and message its threads, organization API keys included; everything runs under your local git identity`;

export const agentAccessDescription = (mode: "ask" | "always") =>
  mode === "ask"
    ? "A thread not created on this device asks you before Capy uses it; Always allow in that prompt switches this"
    : "Every thread of yours may use this device without asking";

export const computerUseDescription = (mode: "ask" | "always") =>
  mode === "ask"
    ? "Every thread asks you once before Capy clicks or types in applications on this device; Always allow in that prompt switches this. Looking at the screen never asks"
    : "Every thread of yours may click and type in applications on this device without asking";

export const pairingCodeFromHash = (hash: string) =>
  new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash).get(
    "code",
  ) ?? "";

export const codeNotFoundMessage = "Code not found or no longer pending";

const failureCause = (error: unknown): unknown => {
  if (typeof error !== "object" || error === null) return error;
  const cause = (error as { cause?: unknown }).cause;
  return "_tag" in error
    ? error
    : cause === undefined
      ? error
      : failureCause(cause);
};

const tagOf = (error: unknown) => {
  const cause = failureCause(error);
  return typeof cause === "object" && cause !== null && "_tag" in cause
    ? String((cause as { _tag: unknown })._tag)
    : undefined;
};

export const pairingErrorMessage = (error: unknown, fallback: string) =>
  tagOf(error) === "capy/DeviceCodeNotFound" ? codeNotFoundMessage : fallback;

const messageTags = new Set(["capy/InvalidRequest"]);

export function errorMessage(error: unknown, fallback: string) {
  const cause = failureCause(error);
  const tag = tagOf(error);
  const message =
    typeof cause === "object" && cause !== null && "message" in cause
      ? (cause as { message: unknown }).message
      : undefined;
  return tag !== undefined &&
    messageTags.has(tag) &&
    typeof message === "string" &&
    message.length > 0
    ? message
    : fallback;
}

export const checkpointsEnabled = (preferences: Record<string, unknown>) => {
  const devices = preferences.devices as
    | { checkpoints?: boolean; autoSync?: boolean; agentMoves?: boolean }
    | undefined;
  return devices?.checkpoints ?? devices?.autoSync ?? true;
};

export const agentMovesEnabled = (preferences: Record<string, unknown>) =>
  (preferences.devices as { agentMoves?: boolean } | undefined)?.agentMoves ??
  true;
