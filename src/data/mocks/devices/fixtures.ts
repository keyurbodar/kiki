import { DateTime } from "effect";
import {
  Device,
  type DeviceAccess,
  type DeviceAgentAccessMode,
  type DeviceArch,
  type DeviceHardware,
  DeviceId,
  type DeviceOs,
  type DeviceWorkspace,
  MachineId,
} from "../../api/schemas/devices.ts";
import { UserId } from "../../api/schemas/ids.ts";
import type { Row } from "../db/MockDb.ts";
import { fixtureNow, minutesAgo } from "../fixtures/time.ts";
import {
  devices as deviceRows,
  members,
  orgId,
  people,
  projects,
  repos,
  threads,
} from "../fixtures/world.ts";

const day = 24 * 60;

/** Device fields the shared `world.devices` rows don't carry. */
export interface DeviceDetails {
  readonly hostname: string;
  readonly description: string | null;
  readonly hardware: DeviceHardware | null;
  readonly tokenHint: string;
  readonly agentAccess: DeviceAgentAccessMode;
  readonly computerUseAccess: DeviceAgentAccessMode;
  readonly workspaces: ReadonlyArray<DeviceWorkspace> | null;
  readonly revokedAt: DateTime.Utc | null;
  readonly createdAt: DateTime.Utc;
}

export const deviceDetails: Record<string, DeviceDetails> = {
  machine_sample_laptop: {
    hostname: "alex-laptop",
    description: "Daily driver for front-end work",
    hardware: {
      formFactor: "laptop",
      vendor: "Apple",
      model: "MacBook Pro",
      chip: "Apple M3 Pro",
      cpuCores: 10,
      memoryBytes: 32 * 1024 ** 3,
      osName: "macOS",
      osVersion: "15.1",
    },
    tokenHint: "dev_sample…a1b2",
    agentAccess: "ask",
    computerUseAccess: "ask",
    workspaces: [
      {
        root: "/Users/alex/code/web",
        repos: ["acme/web"],
        branch: "main",
        insertions: 12,
        deletions: 3,
      },
      {
        root: "/Users/alex/code/shared",
        repos: ["acme/shared"],
        branch: "feature/tokens",
      },
    ],
    revokedAt: null,
    createdAt: minutesAgo(30 * day),
  },
  machine_sample_buildbox: {
    hostname: "build-box",
    description: null,
    hardware: {
      formFactor: "server",
      model: "Rack server",
      chip: "AMD EPYC",
      cpuCores: 16,
      memoryBytes: 64 * 1024 ** 3,
      osName: "Ubuntu",
      osVersion: "24.04",
    },
    tokenHint: "dev_sample…c3d4",
    agentAccess: "always",
    computerUseAccess: "ask",
    workspaces: [
      { root: "/home/sam/api", repos: ["acme/api"], branch: "main" },
    ],
    revokedAt: null,
    createdAt: minutesAgo(60 * day),
  },
  machine_sample_desktop: {
    hostname: "jordan-desktop",
    description: null,
    hardware: {
      formFactor: "desktop",
      chip: "Intel Core i7",
      cpuCores: 8,
      memoryBytes: 16 * 1024 ** 3,
      osName: "Windows",
      osVersion: "11",
    },
    tokenHint: "dev_sample…e5f6",
    agentAccess: "ask",
    computerUseAccess: "ask",
    workspaces: [],
    revokedAt: null,
    createdAt: minutesAgo(14 * day),
  },
};

export interface PendingCode {
  readonly hostname: string;
  readonly os: DeviceOs;
  readonly arch: DeviceArch;
}

/** Pairing codes a machine is showing right now, keyed by normalized code. */
export const pendingCodes: Record<string, PendingCode> = {
  "BCDF-GHJK": { hostname: "casey-laptop", os: "darwin", arch: "arm64" },
};

export const normalizeCode = (code: string) => code.trim().toUpperCase();

export const deviceRowOs = (os: string): DeviceOs =>
  os === "macos" || os === "darwin"
    ? "darwin"
    : os === "windows" || os === "win32"
      ? "win32"
      : "linux";

const ownerName = (userId: string) => {
  const person = members.find((member) => member.id === userId);
  return person === undefined ? null : `${person.firstName} ${person.lastName}`;
};

export const toDevice = (row: Row<"devices">, details: DeviceDetails): Device =>
  new Device({
    id: DeviceId.make(row.id),
    machineId: MachineId.make(row.id),
    name: row.name,
    description: details.description,
    hardware: details.hardware,
    hostname: details.hostname,
    os: deviceRowOs(row.os),
    arch: row.arch === "arm64" ? "arm64" : "x86_64",
    tokenHint: details.tokenHint,
    userId: UserId.make(row.ownerId),
    ownerName: ownerName(row.ownerId),
    access: (row.sharedWithOrg ? "shared" : "personal") satisfies DeviceAccess,
    agentAccess: details.agentAccess,
    computerUseAccess: details.computerUseAccess,
    connected: details.revokedAt === null && row.online,
    workspaces: details.workspaces,
    revokedAt: details.revokedAt,
    lastConnectedAt: DateTime.makeUnsafe(row.lastSeenAt),
    createdAt: details.createdAt,
  });

export const pairedDetails = (hostname: string): DeviceDetails => ({
  hostname,
  description: null,
  hardware: null,
  tokenHint: "dev_sample…0000",
  agentAccess: "ask",
  computerUseAccess: "ask",
  workspaces: [],
  revokedAt: null,
  createdAt: fixtureNow,
});

export const viewerId = people.alex.id;

export type AccessStatus =
  | "pending"
  | "approved"
  | "denied"
  | "granted"
  | "revoked"
  | "withdrawn";

export interface DeviceAccessRequest {
  readonly id: string;
  readonly deviceId: string;
  readonly requesterId: string;
  readonly reason: string;
  readonly scope: string;
  readonly status: AccessStatus;
  readonly createdAt: string;
  readonly decidedAt: string | null;
  readonly decidedBy: string | null;
}

export interface DeviceAgentAccess {
  readonly id: string;
  readonly deviceId: string;
  readonly threadId: string;
  readonly agentId: string;
  readonly grantedBy: string;
  readonly status: "granted" | "denied" | "revoked";
  readonly updatedAt: string;
}

export interface DeviceComputerUse {
  readonly id: string;
  readonly deviceId: string;
  readonly requesterId: string;
  readonly status: "pending" | "granted" | "denied" | "revoked";
  readonly updatedAt: string;
}

export interface DeviceCheckout {
  readonly id: string;
  readonly deviceId: string;
  readonly projectId: string;
  readonly repo: string;
  readonly path: string;
  readonly branch: string;
  readonly available: boolean;
}

export interface DeviceFolder {
  readonly id: string;
  readonly name: string;
  readonly path: string;
}

export interface DeviceCode {
  readonly code: string;
  readonly status: "pending" | "approved" | "denied";
  readonly deviceId: string;
  readonly createdAt: string;
}

const isoMinutes = (minutes: number) => DateTime.formatIso(minutesAgo(minutes));

const laptop = deviceRows[0];
const buildBox = deviceRows[1];
const desktop = deviceRows[2];

export const accessRequests: ReadonlyArray<DeviceAccessRequest> = [
  {
    id: "dac_sample_web",
    deviceId: buildBox.id,
    requesterId: people.priya.id,
    reason: "Need to inspect the web checkout during the release",
    scope: "read",
    status: "pending",
    createdAt: isoMinutes(12),
    decidedAt: null,
    decidedBy: null,
  },
  {
    id: "dac_sample_docs",
    deviceId: laptop.id,
    requesterId: people.jordan.id,
    reason: "Review docs screenshots",
    scope: "read",
    status: "approved",
    createdAt: isoMinutes(60),
    decidedAt: isoMinutes(52),
    decidedBy: people.alex.id,
  },
  {
    id: "dac_sample_api",
    deviceId: desktop.id,
    requesterId: people.casey.id,
    reason: "Run the API load test",
    scope: "write",
    status: "denied",
    createdAt: isoMinutes(240),
    decidedAt: isoMinutes(230),
    decidedBy: people.sam.id,
  },
] as const;

export const agentAccess: ReadonlyArray<DeviceAgentAccess> = [
  {
    id: "dag_sample_checkout",
    deviceId: buildBox.id,
    threadId: threads.checkoutTest.id,
    agentId: people.alex.id,
    grantedBy: people.sam.id,
    status: "granted",
    updatedAt: isoMinutes(9),
  },
  {
    id: "dag_sample_dark_mode",
    deviceId: laptop.id,
    threadId: threads.darkMode.id,
    agentId: people.sam.id,
    grantedBy: people.alex.id,
    status: "granted",
    updatedAt: isoMinutes(35),
  },
  {
    id: "dag_sample_bundler",
    deviceId: desktop.id,
    threadId: threads.bundler.id,
    agentId: people.priya.id,
    grantedBy: people.jordan.id,
    status: "denied",
    updatedAt: isoMinutes(300),
  },
] as const;

export const computerUse: ReadonlyArray<DeviceComputerUse> = [
  {
    id: "dcu_sample_build",
    deviceId: buildBox.id,
    requesterId: people.priya.id,
    status: "pending",
    updatedAt: isoMinutes(8),
  },
  {
    id: "dcu_sample_laptop",
    deviceId: laptop.id,
    requesterId: people.jordan.id,
    status: "granted",
    updatedAt: isoMinutes(42),
  },
] as const;

export const checkouts: ReadonlyArray<DeviceCheckout> = [
  {
    id: "dco_sample_laptop_web",
    deviceId: laptop.id,
    projectId: projects.web.id,
    repo: repos[0].fullName,
    path: "/work/acme/web",
    branch: "feat/dark-mode",
    available: true,
  },
  {
    id: "dco_sample_build_api",
    deviceId: buildBox.id,
    projectId: projects.api.id,
    repo: repos[1].fullName,
    path: "/work/acme/api",
    branch: "feat/orders-cursor",
    available: true,
  },
  {
    id: "dco_sample_build_docs",
    deviceId: buildBox.id,
    projectId: projects.docs.id,
    repo: repos[3].fullName,
    path: "/work/acme/docs",
    branch: "docs/quickstart",
    available: false,
  },
] as const;

export const folders: ReadonlyArray<DeviceFolder> = [
  { id: "folder_sample_work", name: "Work", path: "/work" },
  { id: "folder_sample_projects", name: "Projects", path: "/work/acme" },
  { id: "folder_sample_notes", name: "Notes", path: "/home/alex/notes" },
] as const;

export const linkedFolderIds: Readonly<Record<string, ReadonlyArray<string>>> =
  {
    [laptop.id]: ["folder_sample_work", "folder_sample_projects"],
    [buildBox.id]: ["folder_sample_projects"],
    [desktop.id]: [],
  };

export const descriptions: Readonly<Record<string, string>> = {
  [laptop.id]: "Alex's primary laptop",
  [buildBox.id]: "Shared build machine for Acme projects",
  [desktop.id]: "Windows test desktop",
};

export const workspaceIndex = {
  organizationId: orgId,
  root: "/work/acme",
  projects: [projects.web, projects.api, projects.docs].map((project) => ({
    id: project.id,
    code: project.code,
    name: project.name,
    repos: project.repos,
    path: `/work/acme/${project.code.toLowerCase()}`,
  })),
  updatedAt: isoMinutes(4),
};

export const worktrees = [
  {
    id: "wt_sample_web_dark",
    deviceId: buildBox.id,
    repo: repos[0].fullName,
    path: "/work/acme/web/.worktrees/dark-mode",
    branch: "feat/dark-mode",
    status: "clean",
  },
  {
    id: "wt_sample_api_orders",
    deviceId: buildBox.id,
    repo: repos[1].fullName,
    path: "/work/acme/api/.worktrees/orders-cursor",
    branch: "feat/orders-cursor",
    status: "changes",
  },
  {
    id: "wt_sample_laptop_docs",
    deviceId: laptop.id,
    repo: repos[3].fullName,
    path: "/work/acme/docs/.worktrees/quickstart",
    branch: "docs/quickstart",
    status: "clean",
  },
] as const;

export const localPulls: ReadonlyArray<{
  readonly id: string;
  readonly number: number;
  readonly title: string;
  readonly state: string;
  readonly repo: string;
  readonly branch: string;
  readonly authorId: string;
  readonly threadId: string;
  readonly updatedAt: string;
}> = [
  {
    id: "localpull_sample_214",
    number: 214,
    title: "Polish the dark mode toggle",
    state: "draft",
    repo: repos[0].fullName,
    branch: "feat/dark-mode",
    authorId: people.sam.id,
    threadId: threads.darkMode.id,
    updatedAt: isoMinutes(18),
  },
  {
    id: "localpull_sample_215",
    number: 215,
    title: "Retry checkout on gateway timeouts",
    state: "ready",
    repo: repos[0].fullName,
    branch: "fix/checkout-timeout",
    authorId: people.alex.id,
    threadId: threads.checkoutTest.id,
    updatedAt: isoMinutes(4),
  },
] as const;

export const localPullDiff = {
  files: [
    {
      path: "src/checkout/retry.ts",
      additions: 24,
      deletions: 6,
      patch:
        "@@ -1,4 +1,6 @@\n export const retry = async () => {\n+  await delay(retryDelay);\n };\n",
    },
  ],
  additions: 24,
  deletions: 6,
};
