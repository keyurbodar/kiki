import { DateTime } from "effect";
import { minutesAgo } from "../fixtures/time.ts";

const iso = (minutes: number) => DateTime.formatIso(minutesAgo(minutes));

const server = (options: {
  readonly id: string;
  readonly serverKey: string;
  readonly displayName: string;
  readonly url: string;
  readonly owner: "organization" | "user";
  readonly connection?: "organization" | "member";
  readonly projectId?: string | null;
  readonly auth?: "none" | "headers" | "oauth";
  readonly toolCount: number;
  readonly pluginInstallationId?: string | null;
  readonly checkedMinutesAgo: number;
}) => ({
  id: options.id,
  owner:
    options.owner === "organization"
      ? { kind: "organization" }
      : { kind: "user", userId: "user_sample_alex" },
  projectId: options.projectId ?? null,
  serverKey: options.serverKey,
  displayName: options.displayName,
  iconUrl: null,
  placement: "backend",
  transport: "http",
  deviceId: null,
  pluginInstallationId: options.pluginInstallationId ?? null,
  connection: options.connection ?? "organization",
  privateThreadsOnly: false,
  url: options.url,
  command: null,
  args: [],
  cwd: null,
  env: {},
  requestHeaders: {},
  credentialHeaders: {},
  auth: options.auth ?? "none",
  clientId: null,
  clientSecret: null,
  clientIdentity: "auto",
  connectOnDemand: false,
  scopes: null,
  disabledTools: null,
  allowedTools: null,
  readOnlyTools: null,
  hint: null,
  enabled: true,
  credential:
    options.auth === undefined || options.auth === "none"
      ? null
      : {
          status: "active",
          authRequiredReason: null,
          grantedScopes: [],
          requiredScopes: null,
          updatedAt: iso(options.checkedMinutesAgo),
        },
  toolCount: options.toolCount as number | null,
  health: {
    state: "ready",
    toolCount: options.toolCount as number | null,
    excluded: 0,
    checkedAt: iso(options.checkedMinutesAgo),
  },
  createdAt: iso(60 * 24 * 7),
  updatedAt: iso(options.checkedMinutesAgo),
});

export const sampleMcpServers = [
  server({
    id: "mcp_sample_status",
    serverKey: "status-board",
    displayName: "Status board",
    url: "https://status.example.com/mcp",
    owner: "organization",
    projectId: "proj_sample_web",
    toolCount: 9,
    checkedMinutesAgo: 52,
  }),
  server({
    id: "mcp_sample_search",
    serverKey: "acme-search",
    displayName: "Acme Search",
    url: "https://search.example.com/mcp",
    owner: "organization",
    auth: "oauth",
    toolCount: 12,
    pluginInstallationId: "plugin_inst_sample_search",
    checkedMinutesAgo: 30,
  }),
  server({
    id: "mcp_sample_notes",
    serverKey: "notes",
    displayName: "Notes",
    url: "https://notes.example.com/mcp",
    owner: "user",
    connection: "member",
    auth: "oauth",
    toolCount: 14,
    checkedMinutesAgo: 75,
  }),
];

export const sampleMcpTools = {
  tools: [
    { name: "list_incidents", description: "List open incidents" },
    { name: "get_incident", description: "Read one incident by id" },
    { name: "post_update", description: "Post a status update" },
  ],
  instructions: null,
  observedAt: iso(52),
};
