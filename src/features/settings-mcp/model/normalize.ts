import type {
  InstalledPlugin,
  InstalledPluginDetail,
  MarketplacePlugin,
  McpServer,
  McpServerTools,
  McpTransport,
  PluginVersion,
} from "./types.ts";

type Loose = Record<string, unknown>;

const str = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;
const strOrNull = (value: unknown) =>
  typeof value === "string" ? value : null;
const num = (value: unknown) => (typeof value === "number" ? value : null);

export const toServer = (raw: unknown): McpServer => {
  const row = raw as Loose;
  if ("serverKey" in row) return row as unknown as McpServer;
  const status = str(row.status);
  const createdAt = str(row.createdAt, new Date(0).toISOString());
  return {
    id: str(row.id),
    owner: { kind: "organization" },
    projectId: strOrNull(row.projectId),
    serverKey: str(row.key),
    displayName: str(row.name),
    iconUrl: null,
    placement: "backend",
    transport: (str(row.transport, "http") as McpTransport) ?? "http",
    deviceId: null,
    pluginInstallationId: null,
    connection: "organization",
    privateThreadsOnly: false,
    url: strOrNull(row.url),
    command: null,
    args: [],
    cwd: null,
    env: {},
    requestHeaders: {},
    credentialHeaders: {},
    auth: status === "needs_auth" ? "oauth" : "none",
    clientId: null,
    clientSecret: null,
    clientIdentity: "auto",
    connectOnDemand: false,
    scopes: null,
    disabledTools: null,
    allowedTools: null,
    readOnlyTools: null,
    hint: null,
    enabled: status !== "disabled",
    credential: null,
    toolCount: num(row.toolCount),
    health:
      status === "connected"
        ? { state: "empty", checkedAt: createdAt }
        : { state: "unchecked" },
    createdAt,
    updatedAt: str(row.updatedAt, createdAt),
  };
};

export const toServerTools = (raw: unknown): McpServerTools | null => {
  if (raw === null || raw === undefined) return null;
  if (Array.isArray(raw))
    return {
      tools: raw.map((tool) => ({
        name: str((tool as Loose).name),
        description: strOrNull((tool as Loose).description),
      })),
      instructions: null,
      observedAt: new Date(0).toISOString(),
    };
  return raw as McpServerTools;
};

export const toVersion = (raw: unknown): PluginVersion => {
  const row = raw as Loose;
  if ("servers" in row && "skills" in row)
    return row as unknown as PluginVersion;
  return {
    id: str(row.id),
    source: "marketplace",
    pluginId: strOrNull(row.pluginId),
    name: str(row.pluginKey ?? row.key),
    version: str(row.version ?? row.latestVersion),
    displayName: str(row.displayName),
    description: str(row.description ?? row.changelog),
    hasIcon: false,
    servers: [],
    skills: [],
    warnings: [],
    repository: str(row.repository),
    path: "",
    notes: strOrNull(row.changelog),
    maker: typeof row.author === "string" ? { name: row.author } : null,
    createdAt: str(row.publishedAt ?? row.updatedAt, new Date(0).toISOString()),
  };
};

const legacyStatus: Record<string, string> = {
  connected: "Connected",
  needs_review: "Update needs you",
  updating: "Checking",
  failed: "Unavailable",
};

export const toInstallation = (raw: unknown): InstalledPlugin => {
  const row = raw as Loose;
  if ("pluginName" in row) return row as unknown as InstalledPlugin;
  const status = str(row.status);
  return {
    id: str(row.id),
    pluginId: null,
    pluginName: str(row.pluginKey),
    displayName: str(row.displayName),
    description: "",
    versionId: str(row.versionId),
    version: str(row.version),
    hasIcon: false,
    source: "marketplace",
    repository: "",
    owner: "organization",
    projectId: strOrNull(row.projectId),
    enabled: true,
    toolCount: 0,
    skillCount: 0,
    status: legacyStatus[status] ?? null,
    updateNeedsYou: status === "needs_review",
    createdAt: str(row.installedAt, new Date(0).toISOString()),
    updatedAt: str(row.updatedAt, new Date(0).toISOString()),
  };
};

export const toInstallationDetail = (raw: unknown): InstalledPluginDetail => {
  const row = raw as Loose;
  if ("installation" in row) return row as unknown as InstalledPluginDetail;
  const installation = toInstallation(row);
  const servers = Array.isArray(row.servers) ? (row.servers as Loose[]) : [];
  return {
    installation,
    version: toVersion({
      id: installation.versionId,
      pluginKey: installation.pluginName,
      displayName: installation.displayName,
      version: installation.version,
      publishedAt: installation.createdAt,
    }),
    pending: null,
    canRollBack: false,
    pendingIsRollback: false,
    held: false,
    removedFromMarketplace: false,
    sourceRef: null,
    servers: servers.map((server) => ({
      serverId: `${installation.id}:${str(server.serverKey)}`,
      ownServerId: null,
      entry: str(server.serverKey),
      serverKey: str(server.serverKey),
      displayName: str(server.name),
      placement: "backend",
      transport: "http",
      auth: str(server.status) === "needs_auth" ? "oauth" : "none",
      connection: "organization",
      status:
        str(server.status) === "connected" ? "Connected" : "Needs connection",
      connected: str(server.status) === "connected",
      toolCount: null,
    })),
  };
};

export const toMarketplacePlugin = (raw: unknown): MarketplacePlugin => {
  const row = raw as Loose;
  if ("version" in row && typeof row.version === "object")
    return row as unknown as MarketplacePlugin;
  return {
    pluginId: str(row.id),
    name: str(row.key),
    category: str(row.category),
    featured: row.featured === true,
    verified: true,
    maker: typeof row.author === "string" ? { name: row.author } : null,
    stars: null,
    setup: null,
    version: toVersion({ ...row, id: row.latestVersionId }),
    installationId: null,
  };
};
