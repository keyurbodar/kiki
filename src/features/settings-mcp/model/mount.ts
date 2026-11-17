import type { McpMount } from "./types.ts";

export const serverPath = (mount: McpMount, serverId: string) =>
  mount.kind === "project"
    ? {
        to: "/settings/projects/$projectId/mcp/$serverId" as const,
        params: { projectId: mount.projectId, serverId },
      }
    : { to: "/settings/mcp/$serverId" as const, params: { serverId } };

export const listPath = (mount: McpMount) =>
  mount.kind === "project"
    ? {
        to: "/settings/projects/$projectId" as const,
        params: { projectId: mount.projectId },
      }
    : { to: "/settings/mcp" as const, params: {} };
