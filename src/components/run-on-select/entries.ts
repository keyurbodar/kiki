export type DeviceFormFactor = "laptop" | "desktop" | "server" | "cloud";

export type DeviceHardware = {
  formFactor?: DeviceFormFactor;
  model?: string;
  chip?: string;
  modelIdentifier?: string;
};

export type DeviceWorkspace = {
  root: string;
  repos: readonly string[];
  branch?: string;
  insertions?: number;
  deletions?: number;
  missing?: boolean;
};

export type RunOnDevice = {
  id: string;
  name: string;
  description: string | null;
  hardware: DeviceHardware | null;
  ownerName: string | null;
  userId: string;
  access: "private" | "shared";
  revokedAt: Date | null;
  connected: boolean;
  lastConnectedAt: Date | null;
  createdAt: Date;
  workspaces?: readonly DeviceWorkspace[];
};

export type RunOnFolder = DeviceWorkspace & {
  needsGit: boolean;
  missingRepos: readonly string[];
};

export type RunOnEntry = {
  id: string;
  name: string;
  description: string | null;
  hardware: DeviceHardware | null;
  ownerName: string | null;
  shared: boolean;
  connected: boolean;
  lastConnectedAt: Date | null;
  folders: readonly RunOnFolder[];
  missingRepos: readonly string[];
  repoNote: string | undefined;
  setupNeeded: boolean;
  worktreeCapable: boolean;
};

export type RunOnPlacement = "worktree" | "linked";

export type ProjectCheckoutLink = { deviceId: string; root: string };

const compareDevices = (a: RunOnDevice, b: RunOnDevice) =>
  Number(a.revokedAt !== null) - Number(b.revokedAt !== null) ||
  Number(b.connected) - Number(a.connected) ||
  (b.lastConnectedAt?.getTime() ?? 0) - (a.lastConnectedAt?.getTime() ?? 0) ||
  b.createdAt.getTime() - a.createdAt.getTime();

export const repoShortName = (repoFullName: string) =>
  repoFullName.split("/").at(-1) ?? repoFullName;

export const homePath = (path: string) =>
  path.replace(/^\/(?:Users|home)\/[^/]+/, "~");

export const folderName = (path: string) =>
  path.split(/[\\/]/u).findLast((part) => part !== "") ?? path;

const lower = (value: string) => value.toLowerCase();

export function repoNote(
  workspaces: readonly DeviceWorkspace[] | undefined,
  repos: readonly string[],
): string | undefined {
  if (repos.length === 0) return undefined;
  const present = new Set(
    (workspaces ?? [])
      .filter((w) => w.missing !== true)
      .flatMap((w) => w.repos.map(lower)),
  );
  const found = repos.filter((repo) => present.has(lower(repo)));
  if (found.length === repos.length) return undefined;
  if (found.length === 0) return "No folders for this project";
  const names = found.map(repoShortName);
  return names.length <= 3
    ? `Has ${names.join(", ")}`
    : `Has ${names.slice(0, 2).join(", ")} and ${names.length - 2} more`;
}

export function toRunOnEntries(
  devices: readonly RunOnDevice[],
  userId: string | undefined,
  repos: readonly string[],
  links: readonly ProjectCheckoutLink[] = [],
): RunOnEntry[] {
  if (userId === undefined) return [];
  const projectless = repos.length === 0;
  return devices
    .filter(
      (d) =>
        (d.userId === userId || d.access === "shared") && d.revokedAt === null,
    )
    .toSorted(compareDevices)
    .map((device) => {
      const workspaces = device.workspaces ?? [];
      const present = new Set(
        workspaces
          .filter((w) => w.missing !== true)
          .flatMap((w) => w.repos.map(lower)),
      );
      const reposOf = (w: DeviceWorkspace) => new Set(w.repos.map(lower));
      const linkedRoot = links.find((l) => l.deviceId === device.id)?.root;
      const relevant = projectless
        ? workspaces.filter((w) => w.root === linkedRoot)
        : workspaces.filter((w) => {
            const has = reposOf(w);
            return repos.some((repo) => has.has(lower(repo)));
          });
      const missingRepos = repos.filter((repo) => !present.has(lower(repo)));
      return {
        id: device.id,
        name: device.name,
        description: device.description,
        hardware: device.hardware,
        ownerName: device.ownerName,
        shared: device.userId !== userId,
        connected: device.connected,
        lastConnectedAt: device.lastConnectedAt,
        folders: relevant.map((w) => {
          const has = reposOf(w);
          return {
            ...w,
            needsGit:
              w.missing !== true &&
              w.repos.length === 0 &&
              w.branch === undefined &&
              w.insertions === undefined,
            missingRepos: repos.filter((repo) => !has.has(lower(repo))),
          };
        }),
        missingRepos,
        repoNote: repoNote(workspaces, repos),
        setupNeeded: relevant.filter((w) => w.missing !== true).length === 0,
        worktreeCapable: !projectless && missingRepos.length < repos.length,
      };
    });
}

export function bestFolder(entry: Pick<RunOnEntry, "folders">) {
  return entry.folders
    .filter((f) => f.missing !== true)
    .toSorted((a, b) =>
      a.missingRepos.length === b.missingRepos.length
        ? a.root.localeCompare(b.root)
        : a.missingRepos.length - b.missingRepos.length,
    )[0];
}

export function defaultPlacement(
  entry: RunOnEntry,
): { kind: "worktree" } | { kind: "linked"; root: string } | null {
  if (entry.setupNeeded || entry.worktreeCapable) return { kind: "worktree" };
  const folder = bestFolder(entry);
  return folder === undefined ? null : { kind: "linked", root: folder.root };
}

export const folderForRepo = (
  entry: Pick<RunOnEntry, "folders">,
  repo: string,
) =>
  entry.folders.find(
    (f) => f.missing !== true && f.repos.some((r) => lower(r) === lower(repo)),
  );

export function folderDiff(
  folder: Pick<DeviceWorkspace, "insertions" | "deletions">,
) {
  if (folder.insertions === undefined || folder.deletions === undefined)
    return undefined;
  if (folder.insertions === 0 && folder.deletions === 0) return undefined;
  return { insertions: folder.insertions, deletions: folder.deletions };
}

export function deviceDescription(
  entry: Pick<RunOnEntry, "hardware" | "description">,
): string | undefined {
  const parts = [
    entry.hardware?.model ?? entry.hardware?.chip,
    entry.description ?? undefined,
  ].filter((part): part is string => part !== undefined);
  return parts.length === 0 ? undefined : parts.join(" · ");
}

const second = 1000;
const minute = 60 * second;
const hour = 60 * minute;
const day = 24 * hour;
const week = 7 * day;
const year = 365 * day;

export function relativeTime(at: Date, now = Date.now()) {
  const delta = now - at.getTime();
  const size = Math.abs(delta);
  if (size < 5 * second) return "just now";
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
  return delta < 0 ? `in ${amount}` : `${amount} ago`;
}
