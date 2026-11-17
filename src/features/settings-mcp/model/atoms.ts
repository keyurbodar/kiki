import { Atom } from "effect/reactivity";
import type { OrgId } from "@/data/api/schemas/ids.ts";
import { queryTimeToLive } from "@/data/atoms/conventions.ts";
import { ApiClient } from "@/data/client/ApiClient.ts";

export const mcpKeys = {
  servers: (orgId: string) => `mcp-servers:${orgId}`,
  server: (orgId: string, serverId: string) =>
    `mcp-server:${orgId}:${serverId}`,
  plugins: (orgId: string) => `plugin-installations:${orgId}`,
  plugin: (orgId: string, installationId: string) =>
    `plugin-installation:${orgId}:${installationId}`,
  marketplace: (orgId: string) => `plugins:${orgId}`,
} as const;

const splitKey = (key: string) => key.split("/") as [OrgId, string];

export const mcpServersAtom = Atom.family((orgId: OrgId) =>
  ApiClient.query("mcp", "listServers", {
    params: { orgId },
    reactivityKeys: [mcpKeys.servers(orgId)],
    timeToLive: queryTimeToLive,
  }),
);

export const mcpServerToolsAtom = Atom.family((key: string) => {
  const [orgId, serverId] = splitKey(key);
  return ApiClient.query("mcp", "serverTools", {
    params: { orgId, serverId },
    reactivityKeys: [mcpKeys.servers(orgId), mcpKeys.server(orgId, serverId)],
    timeToLive: queryTimeToLive,
  });
});

export const mcpConnectionsAtom = Atom.family((key: string) => {
  const [orgId, serverId] = splitKey(key);
  return ApiClient.query("mcp", "listConnections", {
    params: { orgId, serverId },
    reactivityKeys: [mcpKeys.server(orgId, serverId)],
    timeToLive: queryTimeToLive,
  });
});

export const pluginInstallationsAtom = Atom.family((orgId: OrgId) =>
  ApiClient.query("plugins", "listInstallations", {
    params: { orgId },
    reactivityKeys: [mcpKeys.plugins(orgId)],
    timeToLive: queryTimeToLive,
  }),
);

export const pluginInstallationAtom = Atom.family((key: string) => {
  const [orgId, installationId] = splitKey(key);
  return ApiClient.query("plugins", "getInstallation", {
    params: { orgId, installationId },
    reactivityKeys: [
      mcpKeys.plugins(orgId),
      mcpKeys.plugin(orgId, installationId),
    ],
    timeToLive: queryTimeToLive,
  });
});

export const pluginVersionAtom = Atom.family((key: string) => {
  const [orgId, versionId] = splitKey(key);
  return ApiClient.query("plugins", "getVersion", {
    params: { orgId, versionId },
    timeToLive: queryTimeToLive,
  });
});

export const marketplaceAtom = Atom.family((orgId: OrgId) =>
  ApiClient.query("plugins", "listMarketplace", {
    params: { orgId },
    reactivityKeys: [mcpKeys.marketplace(orgId)],
    timeToLive: queryTimeToLive,
  }),
);

export const familyKey = (orgId: OrgId, id: string) => `${orgId}/${id}`;

export const mcpMutation = {
  createServer: ApiClient.mutation("mcp", "createServer"),
  updateServer: ApiClient.mutation("mcp", "updateServer"),
  deleteServer: ApiClient.mutation("mcp", "deleteServer"),
  enableServer: ApiClient.mutation("mcp", "enableServer"),
  disableServer: ApiClient.mutation("mcp", "disableServer"),
  refreshServer: ApiClient.mutation("mcp", "refreshServer"),
  testServer: ApiClient.mutation("mcp", "testServer"),
  probeDraft: ApiClient.mutation("mcp", "probeDraft"),
  disconnectCredential: ApiClient.mutation("mcp", "disconnectCredential"),
  startOAuth: ApiClient.mutation("mcp", "startOAuth"),
  getSecretValue: ApiClient.mutation("mcp", "getSecretValue"),
} as const;

export const pluginMutation = {
  fetchGitHubVersion: ApiClient.mutation("plugins", "fetchGitHubVersion"),
  addInstallation: ApiClient.mutation("plugins", "addInstallation"),
  patchInstallation: ApiClient.mutation("plugins", "patchInstallation"),
  removeInstallation: ApiClient.mutation("plugins", "removeInstallation"),
  updateInstallation: ApiClient.mutation("plugins", "updateInstallation"),
  syncInstallation: ApiClient.mutation("plugins", "syncInstallation"),
  rollbackInstallation: ApiClient.mutation("plugins", "rollbackInstallation"),
  cancelRollback: ApiClient.mutation("plugins", "cancelRollback"),
  connectServer: ApiClient.mutation("plugins", "connectServer"),
  disconnectServer: ApiClient.mutation("plugins", "disconnectServer"),
} as const;
