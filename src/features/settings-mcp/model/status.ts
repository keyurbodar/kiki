import type {
  InstalledPlugin,
  McpAuth,
  McpCredentialState,
  McpHealth,
  McpServer,
} from "./types.ts";

export type StatusColor = "success" | "neutral" | "warning";

export interface StatusParts {
  readonly label: string;
  readonly badge: string;
  readonly detail: string | undefined;
  readonly color: StatusColor;
}

export const pluralize = (count: number, noun: string) =>
  `${count} ${noun}${count === 1 ? "" : "s"}`;

export const healthStatus = (health: McpHealth): string => {
  if (health.state === "ready") return `Connected · ${health.toolCount} tools`;
  if (health.state === "empty") return "Connected · no tools";
  if (health.state === "unchecked") return "Not checked";
  if (health.state === "checking") return "Checking";
  if (health.stage === "permissions") return "Missing permissions";
  if (health.stage === "auth") return "Needs reconnect";
  return "Unavailable";
};

export const serverStatus = (server: {
  readonly enabled: boolean;
  readonly auth: McpAuth;
  readonly connectOnDemand: boolean;
  readonly credential: McpCredentialState | undefined;
  readonly health: McpHealth;
}): string => {
  if (!server.enabled) return "Disabled";
  if (server.auth !== "none") {
    if (server.credential === undefined)
      return server.auth === "oauth" && server.connectOnDemand
        ? healthStatus(server.health)
        : "Needs connection";
    if (server.credential.status === "auth_required") {
      if (server.credential.authRequiredReason === "issuer_moved")
        return "Needs reconnect · the provider moved its authorization server";
      if (server.credential.authRequiredReason === "registration_refused")
        return "Registration refused";
      return "Needs connection";
    }
  }
  return healthStatus(server.health);
};

export const statusParts = (label: string): StatusParts => {
  const [badge = label, ...rest] = label.split(" · ");
  return {
    label,
    badge,
    detail: rest.length === 0 ? undefined : rest.join(" · "),
    color: label.startsWith("Connected")
      ? "success"
      : label === "Not checked" || label === "Checking" || label === "Disabled"
        ? "neutral"
        : "warning",
  };
};

export const needsAttention = (status: string | null) =>
  status !== null &&
  (status === "Update needs you" || statusParts(status).color === "warning");

export const serverStatusParts = (server: McpServer) =>
  statusParts(
    serverStatus({
      enabled: server.enabled,
      auth: server.auth,
      connectOnDemand: server.connectOnDemand,
      credential: server.credential ?? undefined,
      health: server.health,
    }),
  );

export const memberStatus = (status: string) =>
  status === "Needs connection" ? "Connect your account" : status;

export type McpSection = "organization" | "member" | "yours";

export const mcpSections: ReadonlyArray<McpSection> = [
  "organization",
  "member",
  "yours",
];

export const sectionCopy: Record<
  McpSection,
  { readonly title: string; readonly description: string }
> = {
  organization: {
    title: "Shared by your organization",
    description:
      "Connected once for everyone; every thread uses the organization's connection",
  },
  member: {
    title: "Connect your own account",
    description:
      "Added by your organization; each member connects their own account, and your threads use yours",
  },
  yours: {
    title: "Added by you",
    description: "Visible only to you; your threads use your account",
  },
};

export const isMemberTemplate = (server: McpServer) =>
  server.owner.kind === "organization" &&
  server.connection === "member" &&
  server.pluginInstallationId === null;

export const isMemberConnection = (server: McpServer) =>
  server.owner.kind === "user" &&
  server.connection === "member" &&
  server.pluginInstallationId === null;

export const serverSection = (server: McpServer): McpSection =>
  server.owner.kind === "user"
    ? "yours"
    : server.connection === "member"
      ? "member"
      : "organization";

export const memberConnectionFor = (
  server: McpServer,
  servers: ReadonlyArray<McpServer>,
) =>
  isMemberTemplate(server)
    ? servers.find(
        (other) =>
          isMemberConnection(other) &&
          other.serverKey === server.serverKey &&
          other.projectId === server.projectId,
      )
    : undefined;

export const pluginSection = (
  plugin: InstalledPlugin,
  servers: ReadonlyArray<McpServer>,
): McpSection =>
  plugin.owner === "me"
    ? "yours"
    : servers.some(
          (server) =>
            server.pluginInstallationId === plugin.id &&
            server.owner.kind === "organization" &&
            server.connection === "member",
        )
      ? "member"
      : "organization";

export const pluginCounts = (plugin: InstalledPlugin) =>
  [
    plugin.toolCount > 0 ? pluralize(plugin.toolCount, "tool") : undefined,
    plugin.skillCount > 0 ? pluralize(plugin.skillCount, "skill") : undefined,
  ]
    .filter((part) => part !== undefined)
    .join(", ");

export const listCountLabel = (count: number) =>
  count === 0
    ? "No plugins or MCP servers"
    : count === 1
      ? "1 plugin or MCP server"
      : `${count} plugins and MCP servers`;

export type ProjectRef =
  | { readonly name: string; readonly state: "live" }
  | { readonly name: string; readonly state: "deleted" }
  | { readonly name: string; readonly state: "unknown" };

export const projectRef = (
  projectId: string | null,
  projects: ReadonlyArray<{ readonly id: string; readonly name: string }> | undefined,
  deleted: ReadonlyArray<{ readonly id: string }> | undefined,
): ProjectRef | undefined => {
  if (projectId === null) return undefined;
  const name = projects?.find((project) => project.id === projectId)?.name;
  if (name !== undefined) return { name, state: "live" };
  return deleted?.some((project) => project.id === projectId) === true
    ? { name: "Deleted project", state: "deleted" }
    : { name: "Project", state: "unknown" };
};
