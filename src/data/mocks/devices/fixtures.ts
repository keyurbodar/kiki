import { DateTime } from "effect";
import { fixtureNow } from "../fixtures/time.ts";

import {
  devices,
  orgId,
  people,
  projects,
  repos,
  threads,
} from "../fixtures/world.ts";

const isoMinutes = (minutes: number) =>
  DateTime.formatIso(DateTime.subtract(fixtureNow, { minutes }));

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

const laptop = devices[0];
const buildBox = devices[1];
const desktop = devices[2];

export const deviceCodes = [
  {
    code: "ABCD-1234",
    status: "pending",
    deviceId: laptop.id,
    createdAt: isoMinutes(2),
  },
  {
    code: "EFGH-5678",
    status: "approved",
    deviceId: buildBox.id,
    createdAt: isoMinutes(18),
  },
] as const;

export const accessRequests = [
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

export const agentAccess = [
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

export const computerUse = [
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

export const checkouts = [
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

export const folders = [
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

export const localPulls = [
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
