import { describe, expect, it } from "vitest";
import { sampleMcpServers } from "@/data/mocks/mcp/fixtures.ts";
import { sampleInstallations } from "@/data/mocks/plugins/fixtures.ts";
import { listSections } from "../mcp-and-plugins-page/model.ts";
import {
  healthStatus,
  listCountLabel,
  needsAttention,
  projectRef,
  serverStatus,
  statusParts,
} from "./status.ts";
import type { InstalledPlugin, McpServer } from "./types.ts";

const servers = sampleMcpServers as unknown as ReadonlyArray<McpServer>;
const plugins =
  sampleInstallations as unknown as ReadonlyArray<InstalledPlugin>;

describe("MCP status", () => {
  it("labels health states like Capy", () => {
    expect(
      healthStatus({
        state: "ready",
        toolCount: 9,
        excluded: 0,
        checkedAt: "",
      }),
    ).toBe("Connected · 9 tools");
    expect(healthStatus({ state: "unchecked" })).toBe("Not checked");
    expect(
      healthStatus({
        state: "error",
        stage: "auth",
        code: "x",
        detail: "y",
        checkedAt: "",
      }),
    ).toBe("Needs reconnect");
  });

  it("asks for a connection before reading health", () => {
    expect(
      serverStatus({
        enabled: true,
        auth: "oauth",
        connectOnDemand: false,
        credential: undefined,
        health: { state: "unchecked" },
      }),
    ).toBe("Needs connection");
    expect(
      serverStatus({
        enabled: false,
        auth: "none",
        connectOnDemand: false,
        credential: undefined,
        health: { state: "unchecked" },
      }),
    ).toBe("Disabled");
  });

  it("splits a status into badge, detail and colour", () => {
    expect(statusParts("Connected · 9 tools")).toEqual({
      label: "Connected · 9 tools",
      badge: "Connected",
      detail: "9 tools",
      color: "success",
    });
    expect(statusParts("Needs connection").color).toBe("warning");
    expect(needsAttention("Update needs you")).toBe(true);
    expect(needsAttention("Checking")).toBe(false);
  });

  it("counts list rows", () => {
    expect(listCountLabel(0)).toBe("No plugins or MCP servers");
    expect(listCountLabel(1)).toBe("1 plugin or MCP server");
    expect(listCountLabel(3)).toBe("3 plugins and MCP servers");
  });

  it("resolves project references", () => {
    const projects = [{ id: "p1", name: "Web app" }];
    expect(projectRef(null, projects, undefined)).toBeUndefined();
    expect(projectRef("p1", projects, undefined)).toEqual({
      name: "Web app",
      state: "live",
    });
    expect(projectRef("p2", projects, [{ id: "p2" }])?.state).toBe("deleted");
  });

  it("groups plugins and servers into sections, hiding plugin servers", () => {
    const sections = listSections(plugins, servers);
    const names = Object.fromEntries(
      sections.map((entry) => [
        entry.section,
        entry.rows.map((row) => row.name),
      ]),
    );
    expect(names.organization).toEqual(["Acme Search", "Error tracker"]);
    expect(names.member).toEqual([]);
    expect(names.yours).toEqual([]);
  });
});
