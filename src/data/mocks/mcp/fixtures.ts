import {
  McpServerId,
  McpSetupId,
  PluginInstallationId,
  ProjectId,
  ToolCallId,
} from "../../api/schemas/ids.ts";
import type { McpSetupView } from "../../api/schemas/mcp.ts";
import {
  isoMinutesAgo,
  orgId,
  people,
  projects,
  threads,
} from "../fixtures/world.ts";

const checkedAt = (minutes: number) => Date.parse(isoMinutesAgo(minutes));

/**
 * A setup row: Capy's `McpSetupView` plus the jam the row belongs to, which
 * only `listSetups` filters on and the view does not carry.
 */
export type McpSetup = McpSetupView & {
  readonly orgId: string;
  readonly jamId: string;
};

const httpServer = {
  serverKey: "error-tracker",
  displayName: "Error tracker",
  projectId: ProjectId.make(projects.web.id),
  iconUrl: "https://mcp.example.com/errors.png",
  enabled: true,
  privateThreadsOnly: false,
  transport: {
    type: "http" as const,
    url: "https://mcp.example.com/errors",
    requestHeaderNames: ["X-Acme-Region"],
    auth: {
      type: "oauth" as const,
      clientId: "client_sample_errors",
      clientSecretRequired: true,
    },
  },
};

export const sampleSetups: ReadonlyArray<McpSetup> = [
  {
    id: McpSetupId.make("setup_sample_errors"),
    orgId,
    jamId: threads.checkoutTest.id,
    toolCallId: ToolCallId.make("call_sample_errors"),
    proposal: {
      kind: "add",
      reason:
        "The thread asked for the error tracker so the failure can be read.",
      owner: "organization",
      server: httpServer,
      secrets: { client_secret: { value: "example-errors-secret" } },
      scopes: ["read"],
      disabledTools: [],
    },
    state: "completed",
    current: "added",
    expired: false,
    serverId: McpServerId.make("mcp_sample_errors"),
    pluginInstallationId: null,
    owner: "organization",
    toolCount: 2,
    health: {
      state: "ready",
      toolCount: 2,
      excluded: 0,
      checkedAt: checkedAt(4),
    },
    recovery: "none",
  },
  {
    id: McpSetupId.make("setup_sample_docs"),
    orgId,
    jamId: threads.checkoutTest.id,
    toolCallId: ToolCallId.make("call_sample_docs"),
    proposal: {
      kind: "connect",
      reason:
        "The docs search server is already registered; it only needs a credential.",
      serverId: McpServerId.make("mcp_sample_docs"),
      serverKey: "docs-search",
      displayName: "Docs search",
      projectId: ProjectId.make(projects.docs.id),
      cacheStamp: "cache_sample_docs",
      url: "https://mcp.example.com/docs",
      requestHeaderNames: [],
      auth: "oauth",
      clientId: "client_sample_docs",
      hasClientSecret: false,
      credentialHeaderNames: ["Authorization"],
      secrets: { "header:Authorization": { machine_env: "DOCS_TOKEN" } },
    },
    state: "pending",
    current: "pending",
    expired: false,
    serverId: McpServerId.make("mcp_sample_docs"),
    pluginInstallationId: null,
    owner: "user",
    health: {
      state: "error",
      stage: "auth",
      code: "registration_refused",
      detail: "The provider refused the client registration.",
      requiredScopes: ["docs:read"],
      checkedAt: checkedAt(15),
    },
    recovery: "exhausted",
  },
  {
    id: McpSetupId.make("setup_sample_other"),
    orgId,
    jamId: threads.darkMode.id,
    toolCallId: ToolCallId.make("call_sample_other"),
    proposal: {
      kind: "update",
      reason: "The server moved to a new host and keeps its old credential.",
      serverId: McpServerId.make("mcp_sample_errors"),
      cacheStamp: "cache_sample_other",
      before: httpServer,
      after: {
        ...httpServer,
        transport: {
          ...httpServer.transport,
          url: "https://mcp.example.com/errors-v2",
        },
      },
      dropsCredentials: false,
      secrets: {},
    },
    state: "changed",
    current: "changed",
    expired: true,
    serverId: McpServerId.make("mcp_sample_errors"),
    pluginInstallationId: null,
    owner: "organization",
    toolCount: 2,
    health: { state: "unchecked" },
    recovery: "automatic",
  },
  {
    id: McpSetupId.make("setup_sample_plugin"),
    orgId,
    jamId: threads.checkoutTest.id,
    toolCallId: ToolCallId.make("call_sample_plugin"),
    proposal: {
      kind: "plugin",
      reason: "The crew wants the docs plugin in this project.",
      owner: "user",
      projectId: ProjectId.make(projects.docs.id),
      source: { plugin: "kiki-docs", versionId: "pver_sample_docs" },
    },
    state: "private",
    current: "private",
    expired: false,
    serverId: McpServerId.make("mcp_sample_docs"),
    pluginInstallationId: PluginInstallationId.make("pins_sample_docs"),
    owner: "user",
    health: { state: "checking" },
    recovery: "none",
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
    serverId: McpServerId.make("mcp_sample_errors"),
    name: "Error tracker credential",
    status: "connected",
    credentialId: "cred_sample_errors",
    createdBy: people.alex.id,
    createdAt: isoMinutesAgo(240),
    lastUsedAt: isoMinutesAgo(4),
  },
  {
    id: "conn_sample_docs",
    serverId: McpServerId.make("mcp_sample_docs"),
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
    serverId: McpServerId.make("mcp_sample_errors"),
    position: "0",
    name: "token",
    value: "example-errors-token",
  },
  {
    serverId: McpServerId.make("mcp_sample_docs"),
    position: "0",
    name: "token",
    value: "example-docs-token",
  },
];

export const sampleFavicon = {
  url: "https://mcp.example.com/favicon.ico",
};

export const sampleRedirectUri = "https://example.com/oauth/callback";
