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
import { members, people } from "../fixtures/world.ts";

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
