export type WorkspaceKind = "worktree" | "checkout";

export type DeviceViewerAccess =
  | "owner"
  | "granted"
  | "requested"
  | "revoked"
  | "none";

export type ThreadDevice = {
  deviceId: string;
  name: string;
  rootJamId: string;
  workspaceRoot: string;
  workspaceKind: WorkspaceKind;
  viewerAccess: DeviceViewerAccess;
  viewerAccessId?: string | null;
  viewerHeldText?: string | null;
  ownerName: string | null;
};

export type MachineState =
  | "creating"
  | "waking"
  | "running"
  | "asleep"
  | "gone";

export type MachineAttachment = { jamId: string; checkpointStaged?: boolean };

export type ThreadMachine = {
  state: MachineState;
  stateChangedAt: Date | null;
  goneReason?: string | null;
  device: { connected: boolean } | null;
  attachments: ReadonlyArray<MachineAttachment>;
};

export type MachineLifetime = {
  jamId: string;
  machine: ThreadMachine | null | undefined;
  wake: () => void;
  waking: boolean;
};

export const RECONNECT_GRACE_MS = 60_000;

export type DevicePresence =
  | { kind: "connected" }
  | { kind: "offline" }
  | { kind: "reconnecting"; until: Date | null };

export const workspaceKindLabel = (kind: WorkspaceKind) =>
  kind === "worktree" ? "Worktree" : "Current checkout";

export function devicePresence(
  machine: ThreadMachine,
  now: number,
): DevicePresence {
  if (machine.device === null || machine.device.connected) {
    return { kind: "connected" };
  }
  if (machine.state === "creating" || machine.state === "waking") {
    return { kind: "reconnecting", until: null };
  }
  const changedAt = machine.stateChangedAt ?? null;
  if (
    machine.state !== "gone" ||
    machine.goneReason !== "disconnected" ||
    changedAt === null
  ) {
    return { kind: "offline" };
  }
  const until = changedAt.getTime() + RECONNECT_GRACE_MS;
  return until > now
    ? { kind: "reconnecting", until: new Date(until) }
    : { kind: "offline" };
}

export function presenceLabel(presence: DevicePresence, now: number) {
  if (presence.kind === "connected") return "Connected";
  if (presence.kind === "offline") return "Offline";
  if (presence.until === null) return "Reconnecting";
  const seconds = Math.max(
    0,
    Math.ceil((presence.until.getTime() - now) / 1000),
  );
  return `Reconnecting, ${seconds}s`;
}

export type StatusColor =
  | "neutral"
  | "accent"
  | "success"
  | "danger"
  | "warning"
  | "info";

export const presenceColor = (presence: DevicePresence): StatusColor =>
  presence.kind === "connected"
    ? "success"
    : presence.kind === "reconnecting"
      ? "warning"
      : "neutral";

export const offlineHint = (device: ThreadDevice) =>
  device.viewerAccess === "owner"
    ? `Open the Capy desktop app on ${device.name} to reconnect`
    : `${device.ownerName ?? "Its owner"} needs to open the Capy desktop app on ${device.name}`;
