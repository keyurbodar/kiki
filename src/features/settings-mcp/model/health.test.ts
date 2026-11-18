import { describe, expect, it } from "vitest";
import { toServer } from "./normalize.ts";
import { serverStatus, statusParts } from "./status.ts";

const row = {
  id: "mcp_a",
  key: "errors",
  name: "Error tracker",
  url: "https://mcp.example.com/errors",
  transport: "http",
  status: "connected",
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-11-18T00:00:00.000Z",
};

const line = (raw: Record<string, unknown>) => {
  const server = toServer({ ...row, ...raw });
  return statusParts(
    serverStatus({ ...server, credential: server.credential ?? undefined }),
  ).label;
};

describe("MCP server status line", () => {
  it("reports a checked server's tools and check time", () => {
    expect(
      line({ toolCount: 2, lastCheckedAt: "2026-11-18T05:00:00.000Z" }),
    ).toBe("Connected · 2 tools");
  });

  it("says not checked for a server that has never been tested", () => {
    expect(line({ toolCount: 2, lastCheckedAt: null })).toBe("Not checked");
  });

  it("does not pass the creation time off as a check", () => {
    const server = toServer({ ...row, toolCount: 2, lastCheckedAt: null });
    expect(server.health).toEqual({ state: "unchecked" });
  });

  it("keeps empty for a checked server with no tools", () => {
    expect(
      line({ toolCount: 0, lastCheckedAt: "2026-11-18T05:00:00.000Z" }),
    ).toBe("Connected · no tools");
  });

  it("treats a checked server with tools as ready, not empty", () => {
    const server = toServer({
      ...row,
      toolCount: 3,
      lastCheckedAt: "2026-11-18T05:00:00.000Z",
    });
    expect(server.health).toMatchObject({ state: "ready", toolCount: 3 });
  });
});
