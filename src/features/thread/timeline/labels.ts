/** Copy Capy's builder renders into marker and error labels, ported from the bundle. */

const SECOND_MS = 1_000;

/** Capy's summary duration: "45s", "3m 20s", "2h 5m". */
export const formatDuration = (ms: number): string => {
  if (!Number.isFinite(ms) || ms < 0) return "—";
  const seconds = Math.max(1, Math.ceil(ms / SECOND_MS));
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const rest = seconds % 60;
    return rest === 0 ? `${minutes}m` : `${minutes}m ${rest}s`;
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
};

/** "1 minute", "12 minutes", "40 seconds" for machine episodes. */
export const formatSpan = (ms: number): string => {
  const minutes = Math.round(ms / 60_000);
  if (minutes >= 1) return minutes === 1 ? "1 minute" : `${minutes} minutes`;
  const seconds = Math.max(1, Math.round(ms / SECOND_MS));
  return seconds === 1 ? "1 second" : `${seconds} seconds`;
};

const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});
export const formatCompact = (value: number) => compact.format(value);

/** Model display name: the id after its provider prefix. */
export const modelName = (modelId: string) =>
  modelId.slice(modelId.indexOf("/") + 1);

const listNames = (names: ReadonlyArray<string>) =>
  names.length <= 2
    ? names.join(" and ")
    : `${names.slice(0, -1).join(", ")}, and ${names.at(-1)}`;

export interface AccessChange {
  readonly change: string;
  readonly byName: string;
  readonly names: ReadonlyArray<string>;
  readonly container: string;
}

export const accessLabel = (access: AccessChange, orgName: string) => {
  const names =
    access.names.length === 0 ? "a teammate" : listNames(access.names);
  switch (access.change) {
    case "personal":
      return `${access.byName} made this thread personal`;
    case "everyone":
      return `${access.byName} opened this thread to everyone at ${orgName}`;
    case "shared":
      return `${access.byName} shared this thread with ${names}`;
    case "unshared":
      return `${access.byName} removed ${names}`;
    case "owner":
      return `${access.byName} left ${orgName}, ${access.names[0] ?? "a member"} now owns this thread`;
    default:
      return `${access.byName} transferred this ${access.container === "captain" ? "Captain" : "thread"} to ${access.names[0] ?? "a member"}`;
  }
};

export interface ConnectionChange {
  readonly from: string;
  readonly to: string;
  readonly state: string;
  readonly limit?: string | undefined;
}

export const connectionLabel = (change: ConnectionChange, rejected: boolean) => {
  const reason =
    change.state === "refused"
      ? "unavailable"
      : change.state === "signed_out"
        ? rejected
          ? "was rejected"
          : "signed out"
        : change.state === "capped"
          ? "at its cap"
          : `hit its ${change.limit ?? "usage"} limit`;
  const short = (name: string) =>
    /\(([^()@]+)(?:@[^()]*)?\)$/.exec(name)?.[1] ?? name;
  return {
    label: `Switched to ${short(change.to)} · ${short(change.from)} ${reason}`,
    title: `Switched to ${change.to} · ${change.from} ${reason}`,
  };
};

const wireFeatures: Record<string, string> = {
  strict: "strict tool schemas",
  custom: "freeform tool input",
  fallbacks: "model fallbacks",
  thinking: "adaptive thinking",
  socket: "the WebSocket upgrade",
};

export const wireDroppedLabel = (dropped: ReadonlyArray<string>) =>
  `This endpoint rejected ${dropped.map((feature) => wireFeatures[feature]).join(" and ")}, so Capy ${dropped.every((feature) => feature === "strict" || feature === "custom") ? "sends plain JSON tools" : "leaves them out"}`;

export const handoffFailureLabel = (handoff: {
  readonly direction: string;
  readonly destination?: { readonly deviceName?: string | undefined } | undefined;
  readonly source?: { readonly deviceName?: string | undefined } | undefined;
  readonly result: { readonly reason?: string | undefined };
}) => {
  const toDevice = handoff.direction === "cloud_to_device";
  const destination = handoff.destination?.deviceName ?? "the device";
  return toDevice
    ? `workspace move to ${destination} failed: ${handoff.result.reason}; the workspace is still on ${handoff.source?.deviceName ?? "the cloud machine"}`
    : `workspace handoff to the cloud failed: ${handoff.result.reason}; the workspace is still on the device`;
};

export const environmentLabel = (update: {
  readonly action: string;
  readonly scope?: string | undefined;
  readonly names: ReadonlyArray<string>;
}) => {
  const more = update.names.length - 3;
  const names =
    update.names.slice(0, 3).join(", ") + (more > 0 ? ` and ${more} more` : "");
  return update.action === "removed"
    ? `Removed the thread value of ${names}`
    : update.scope === "project"
      ? `Provided ${names} to the project`
      : `Provided ${names}`;
};

export const driveNotice = (payload: {
  readonly key: string;
  readonly driveNotice?: string | undefined;
}) => {
  if (payload.key === "machine_server_outdated")
    return {
      title: "Drive not syncing on this machine",
      lines: [
        "Capy couldn't update this machine, so Drive isn't syncing here for now",
        "Capy tries again the next time the machine wakes",
      ],
    };
  if (payload.driveNotice === undefined) return undefined;
  return {
    title:
      payload.key === "drive_unmounted"
        ? "Drive not mounted"
        : payload.key === "drive_bulk_delete"
          ? "Drive deletions on hold"
          : "Drive changes not saved",
    lines: [payload.driveNotice],
  };
};

export const UNSUPPORTED_LABEL = "This update needs a newer version of Capy";
