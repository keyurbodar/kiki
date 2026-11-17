import { isoMinutesAgo, orgId, people, threads } from "../fixtures/world.ts";

export interface McpSetup {
  readonly id: string;
  readonly orgId: string;
  readonly jamId: string;
  readonly name: string;
  readonly status: "pending" | "in_progress" | "completed" | "failed";
  readonly ownerId: string;
  readonly attempts: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly completedAt: string | null;
}

export const sampleSetups: ReadonlyArray<McpSetup> = [
  {
    id: "setup_sample_errors",
    orgId,
    jamId: threads.checkoutTest.id,
    name: "Error tracker setup",
    status: "completed",
    ownerId: people.alex.id,
    attempts: 1,
    createdAt: isoMinutesAgo(180),
    updatedAt: isoMinutesAgo(120),
    completedAt: isoMinutesAgo(120),
  },
  {
    id: "setup_sample_docs",
    orgId,
    jamId: threads.checkoutTest.id,
    name: "Docs search setup",
    status: "failed",
    ownerId: people.sam.id,
    attempts: 2,
    createdAt: isoMinutesAgo(90),
    updatedAt: isoMinutesAgo(15),
    completedAt: null,
  },
  {
    id: "setup_sample_other",
    orgId,
    jamId: threads.darkMode.id,
    name: "Docs indexing setup",
    status: "in_progress",
    ownerId: people.priya.id,
    attempts: 1,
    createdAt: isoMinutesAgo(45),
    updatedAt: isoMinutesAgo(5),
    completedAt: null,
  },
];

export interface McpConnection {
  readonly id: string;
  readonly serverId: string;
  readonly name: string;
  readonly status: "connected" | "needs_auth" | "disabled";
  readonly credentialId: string | null;
  readonly createdBy: string;
  readonly createdAt: string;
  readonly lastUsedAt: string | null;
}

export const sampleConnections: ReadonlyArray<McpConnection> = [
  {
    id: "conn_sample_errors",
    serverId: "mcp_sample_errors",
    name: "Error tracker credential",
    status: "connected",
    credentialId: "cred_sample_errors",
    createdBy: people.alex.id,
    createdAt: isoMinutesAgo(240),
    lastUsedAt: isoMinutesAgo(4),
  },
  {
    id: "conn_sample_docs",
    serverId: "mcp_sample_docs",
    name: "Docs search credential",
    status: "needs_auth",
    credentialId: null,
    createdBy: people.sam.id,
    createdAt: isoMinutesAgo(120),
    lastUsedAt: null,
  },
];

export interface McpTool {
  readonly name: string;
  readonly description: string;
}

export const sampleToolsByServer: Readonly<
  Record<string, ReadonlyArray<McpTool>>
> = {
  mcp_sample_errors: [
    {
      name: "list_recent_errors",
      description: "Lists the most recent errors reported by the app.",
    },
    {
      name: "search_errors",
      description: "Searches error reports by message or release.",
    },
  ],
  mcp_sample_docs: [
    {
      name: "search_docs",
      description: "Searches the Acme documentation for a phrase.",
    },
    {
      name: "get_page",
      description: "Returns the contents of one documentation page.",
    },
  ],
};

export interface McpSecret {
  readonly serverId: string;
  readonly position: string;
  readonly name: string;
  readonly value: string;
}

export const sampleSecrets: ReadonlyArray<McpSecret> = [
  {
    serverId: "mcp_sample_errors",
    position: "0",
    name: "token",
    value: "example-errors-token",
  },
  {
    serverId: "mcp_sample_docs",
    position: "0",
    name: "token",
    value: "example-docs-token",
  },
];

export const sampleFavicon = {
  url: "https://mcp.example.com/favicon.ico",
};

export const sampleRedirectUri = "https://example.com/oauth/callback";
