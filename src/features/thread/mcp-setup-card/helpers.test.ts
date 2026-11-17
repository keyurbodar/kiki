import { describe, expect, it } from "vitest";
import {
  canSubmitSetup,
  githubOriginLink,
  initialSecretValues,
  isQuickEdit,
  lineActivatable,
  lineLabel,
  lineOutcome,
  listingState,
  listLabel,
  pluginStatus,
  pluginStatusLabel,
  requiredSecrets,
  secretLabel,
  secretValueLabel,
  serverCountLabel,
  setupStatus,
  setupStatusLabel,
} from "./helpers";
import { decodeProposal, type McpServerProposal } from "./proposal";

const http = {
  type: "http" as const,
  url: "https://docs.example.com/mcp",
  requestHeaderNames: [] as string[],
  auth: {
    type: "headers" as const,
    credentialHeaderNames: ["Authorization"],
    clientId: null,
    clientSecretRequired: false,
  },
};

const add = {
  kind: "add",
  reason: "Read the Example Docs pages from this thread",
  project: "all",
  secrets: {},
  server: {
    serverKey: "example-docs",
    displayName: "Example Docs",
    iconUrl: null,
    transport: http,
  },
} as const;

const config = {
  serverKey: "example-docs",
  displayName: "Example Docs",
  iconUrl: null,
  projectId: "proj_1",
  enabled: true,
  transport: http,
};

const update = {
  kind: "update",
  reason: "Make Example Docs available everywhere",
  serverId: "mcp_1",
  cacheStamp: "2026-01-01T00:00:00.000Z",
  before: config,
  after: { ...config, projectId: null },
  dropsCredentials: false,
  secrets: {},
} as const;

const asServer = (input: unknown) => {
  const proposal = decodeProposal(input);
  if (proposal === undefined || proposal.kind === "plugin")
    throw new Error("expected a server proposal");
  return proposal as McpServerProposal;
};

describe("decodeProposal", () => {
  it("narrows add, update, connect and plugin proposals", () => {
    expect(decodeProposal(add)?.kind).toBe("add");
    expect(decodeProposal(update)?.kind).toBe("update");
    expect(
      decodeProposal({
        kind: "plugin",
        reason: "Adds docs tools",
        project: "current",
        source: { kind: "git", repository: "example/docs-plugin" },
      })?.kind,
    ).toBe("plugin");
  });

  it("returns undefined for unknown shapes", () => {
    expect(decodeProposal({ kind: "add" })).toBeUndefined();
    expect(decodeProposal(null)).toBeUndefined();
  });
});

describe("line labels", () => {
  it("names the proposal", () => {
    expect(lineLabel(asServer(add))).toBe(
      "Proposed the Example Docs MCP server",
    );
    expect(lineLabel(asServer(update))).toBe(
      "Proposed an update to Example Docs",
    );
    const plugin = decodeProposal({
      kind: "plugin",
      reason: "r",
      project: "all",
      source: {
        kind: "git",
        repository: "example/tools",
        path: "plugins/docs/",
      },
    });
    expect(plugin && lineLabel(plugin)).toBe("Proposed the docs plugin");
  });

  it("maps state to outcome", () => {
    const proposal = asServer(add);
    expect(lineOutcome(proposal, "added", false)).toBe("Added");
    expect(lineOutcome(proposal, "pending", true)).toBe("Waiting on you");
    expect(lineOutcome(proposal, "pending", false)).toBeUndefined();
    expect(lineOutcome(proposal, "private", true)).toBeUndefined();
    expect(lineOutcome(proposal, "changed", true)).toBe(
      "Changed since it was proposed",
    );
    expect(lineOutcome(asServer(update), "updated", true)).toBe("Updated");
    expect(lineActivatable("pending", true)).toBe(true);
    expect(lineActivatable("declined", true)).toBe(false);
  });
});

describe("card status", () => {
  it("labels pending and settled states", () => {
    const proposal = asServer(add);
    expect(setupStatusLabel(proposal, "pending", undefined, undefined)).toBe(
      "Needs setup",
    );
    expect(setupStatusLabel(proposal, "declined", undefined, undefined)).toBe(
      "Not added",
    );
    expect(
      setupStatusLabel(
        proposal,
        "added",
        { state: "ready", toolCount: 4, excluded: 0, checkedAt: 0 },
        undefined,
      ),
    ).toBe("Connected · 4 tools");
  });

  it("describes a quick edit move", () => {
    const proposal = asServer(update);
    expect(isQuickEdit(proposal)).toBe(true);
    expect(
      setupStatusLabel(proposal, "pending", undefined, {
        fromProject: "Web",
      }),
    ).toBe("Connected in Web");
    expect(
      setupStatusLabel(proposal, "declined", undefined, { fromProject: "Web" }),
    ).toBe("Not moved");
  });

  it("maps state to badge status", () => {
    expect(setupStatus("pending", undefined)).toBe("pending");
    expect(setupStatus("expired", undefined)).toBe("skipped");
    expect(setupStatus("added", undefined)).toBe("done");
    expect(
      setupStatus("added", {
        state: "error",
        stage: "auth",
        code: "x",
        detail: "y",
        checkedAt: 0,
      }),
    ).toBe("pending");
    expect(listingState({ current: "pending", expired: true })).toBe("expired");
  });
});

describe("secrets", () => {
  it("asks for missing credential headers and prefills visible ones", () => {
    const proposal = asServer({
      ...add,
      secrets: {
        "credential_header:Authorization": { kind: "visible", value: "abc" },
      },
    });
    expect(requiredSecrets(proposal).credentialHeaders).toEqual([
      "Authorization",
    ]);
    const values = initialSecretValues(proposal);
    expect(values.credentialHeaders).toEqual({ Authorization: "abc" });
    expect(canSubmitSetup(proposal, values, null, false)).toBe(true);
    expect(
      canSubmitSetup(
        proposal,
        { ...values, credentialHeaders: {} },
        null,
        false,
      ),
    ).toBe(false);
  });

  it("skips values the proposal references elsewhere", () => {
    const proposal = asServer({
      ...add,
      secrets: {
        "credential_header:Authorization": {
          kind: "project_env",
          name: "DOCS_TOKEN",
        },
      },
    });
    expect(requiredSecrets(proposal).credentialHeaders).toEqual([]);
  });

  it("labels secret keys and sources", () => {
    expect(secretLabel("env:API_KEY")).toBe("Environment API_KEY");
    expect(secretLabel("client_secret")).toBe("OAuth client secret");
    expect(secretValueLabel({ kind: "file", path: ".env", key: "TOKEN" })).toBe(
      "TOKEN in .env",
    );
  });
});

describe("plugin helpers", () => {
  it("labels status and lists", () => {
    expect(pluginStatusLabel({ state: "pending" })).toBeUndefined();
    expect(pluginStatusLabel({ state: "added" })).toBe("Added");
    expect(pluginStatus({ state: "added", needsConnection: true })).toBe(
      "pending",
    );
    expect(serverCountLabel(2)).toBe("Two MCP servers");
    expect(listLabel(["a", "b", "c", "d", "e"])).toBe("a, b, c and 2 more");
    expect(
      githubOriginLink({ repository: "example/tools", path: "/plugins/docs/" }),
    ).toEqual({
      href: "https://github.com/example/tools/tree/HEAD/plugins/docs",
      title: "github.com/example/tools/plugins/docs",
    });
  });
});
