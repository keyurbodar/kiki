import { isoMinutesAgo, machines, people, threads } from "../fixtures/world.ts";

export interface MachinePort {
  readonly id: string;
  readonly machineId: string;
  readonly port: string;
  readonly protocol: string;
  readonly label: string;
  readonly status: "open" | "closed";
  readonly url: string | null;
}

export interface ServicePreview {
  readonly id: string;
  readonly machineId: string;
  readonly port: string;
  readonly label: string;
  readonly url: string;
  readonly token: string;
  readonly status: "running" | "stopped";
  readonly createdAt: string;
}

export interface MachineConnection {
  readonly machineId: string;
  readonly provider: string;
  readonly repoFullName: string;
  readonly connectedAt: string;
}

export interface Reservation {
  readonly machineId: string;
  readonly reservedUntil: string;
}

export interface Phone {
  readonly id: string;
  readonly machineId: string;
  readonly deviceId: string;
  readonly attachedAt: string;
  readonly sleeping: boolean;
  readonly lastAction: string | null;
}

export interface SetupRun {
  readonly machineId: string;
  readonly entryId: string;
  readonly startedAt: string;
}

export const ports: ReadonlyArray<MachinePort> = [
  {
    id: "port_sample_web",
    machineId: machines[0].id,
    port: "3000",
    protocol: "http",
    label: "Web preview",
    status: "closed",
    url: null,
  },
  {
    id: "port_sample_api",
    machineId: machines[0].id,
    port: "8080",
    protocol: "http",
    label: "API",
    status: "open",
    url: "https://preview.example.com/8080",
  },
  {
    id: "port_sample_docs",
    machineId: machines[1].id,
    port: "4173",
    protocol: "http",
    label: "Docs preview",
    status: "closed",
    url: null,
  },
];

export const previews: ReadonlyArray<ServicePreview> = [
  {
    id: "prev_sample_web",
    machineId: machines[0].id,
    port: "8080",
    label: "Web preview",
    url: "https://preview.example.com/8080",
    token: "capy_preview_sample_web",
    status: "running",
    createdAt: isoMinutesAgo(45),
  },
  {
    id: "prev_sample_docs",
    machineId: machines[1].id,
    port: "4173",
    label: "Docs preview",
    url: "https://preview.example.com/4173",
    token: "capy_preview_sample_docs",
    status: "running",
    createdAt: isoMinutesAgo(6 * 60),
  },
];

export const connections: ReadonlyArray<MachineConnection> = [
  {
    machineId: machines[0].id,
    provider: "GitHub",
    repoFullName: "acme/web",
    connectedAt: isoMinutesAgo(2 * 60),
  },
];

export const reservations: ReadonlyArray<Reservation> = [
  {
    machineId: machines[0].id,
    reservedUntil: isoMinutesAgo(-30),
  },
];

export const phones: ReadonlyArray<Phone> = [
  {
    id: "phone_sample_1",
    machineId: machines[0].id,
    deviceId: "machine_sample_laptop",
    attachedAt: isoMinutesAgo(90),
    sleeping: false,
    lastAction: null,
  },
];

export const setupRuns: ReadonlyArray<SetupRun> = [
  {
    machineId: machines[0].id,
    entryId: "setup_sample_browser",
    startedAt: isoMinutesAgo(3 * 60),
  },
];

export const sessions: ReadonlyArray<{
  readonly id: string;
  readonly machineId: string;
  readonly kind: string;
  readonly label: string;
  readonly startedAt: string;
  /** A browser session's address and page title; absent for a shell. */
  readonly url?: string;
  readonly title?: string;
}> = [
  {
    id: "sess_sample_browser",
    machineId: machines[0].id,
    kind: "browser",
    label: "Browser",
    startedAt: isoMinutesAgo(90),
    url: "https://example.com/acme/web",
    title: "acme/web",
  },
  {
    id: "sess_sample_shell",
    machineId: machines[0].id,
    kind: "shell",
    label: "Shell",
    startedAt: isoMinutesAgo(2 * 60),
  },
  {
    id: "sess_sample_agent",
    machineId: machines[0].id,
    kind: "agent",
    label: "Agent",
    startedAt: isoMinutesAgo(60),
  },
];

export const phoneEvents: ReadonlyArray<{
  readonly id: string;
  readonly machineId: string;
  readonly kind: string;
  readonly message: string;
  readonly at: string;
}> = [
  {
    id: "ph_sample_ready",
    machineId: machines[0].id,
    kind: "status",
    message: "Phone is ready to take actions",
    at: isoMinutesAgo(8),
  },
  {
    id: "ph_sample_ask",
    machineId: machines[0].id,
    kind: "ask",
    message: "Approve running the checkout test?",
    at: isoMinutesAgo(3),
  },
];

export const setupEntries: ReadonlyArray<{
  readonly id: string;
  readonly name: string;
  readonly description: string;
}> = [
  {
    id: "setup_sample_browser",
    name: "Open a browser",
    description: "Open the preview in a browser tab",
  },
  {
    id: "setup_sample_checkout",
    name: "Install dependencies",
    description: "Install the project's dependencies",
  },
];

export const machineSizes = [
  {
    id: "small",
    name: "Small",
    cpu: 1,
    memoryGb: 4,
    description: "Short edits and quick checks",
  },
  {
    id: "medium",
    name: "Medium",
    cpu: 2,
    memoryGb: 8,
    description: "Everyday threads",
  },
  {
    id: "large",
    name: "Large",
    cpu: 4,
    memoryGb: 16,
    description: "Builds and parallel work",
  },
  {
    id: "ultra",
    name: "Ultra",
    cpu: 8,
    memoryGb: 32,
    description: "Heavy builds and test matrices",
  },
] as const;

export const metrics = [
  {
    machineId: machines[0].id,
    cpuPercent: 24,
    memoryPercent: 47,
    diskPercent: 31,
    sampledAt: isoMinutesAgo(1),
  },
  {
    machineId: machines[1].id,
    cpuPercent: 3,
    memoryPercent: 18,
    diskPercent: 22,
    sampledAt: isoMinutesAgo(4),
  },
  {
    machineId: machines[2].id,
    cpuPercent: 0,
    memoryPercent: 0,
    diskPercent: 29,
    sampledAt: isoMinutesAgo(20),
  },
] as const;

export const handoffOwner = people.alex;
export const handoffThread = threads.checkoutTest;
