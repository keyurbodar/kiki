import { DateTime, Effect, Ref } from "effect";
import { McpSetupId, ToolCallId } from "../../api/schemas/ids.ts";
import { McpOAuthCompletion, McpSetupView } from "../../api/schemas/mcp.ts";
import {
  fields,
  MockDb,
  newId,
  notFound,
  notFoundNamed,
} from "../db/MockDb.ts";
import { minutesAgo } from "../fixtures/time.ts";
import { mockGroup } from "../mockGroup.ts";
import {
  type McpConnection,
  type McpSecret,
  type McpSetup,
  sampleConnections,
  sampleFavicon,
  sampleRedirectUri,
  sampleSecrets,
  sampleSetups,
  sampleToolsByServer,
} from "./fixtures.ts";

const text = (value: unknown, fallback: string) =>
  typeof value === "string" && value.length > 0 ? value : fallback;

const flag = (value: unknown, fallback: boolean) =>
  typeof value === "boolean" ? value : fallback;

/** The row minus the jam it belongs to, which the view does not carry. */
const viewOf = ({ orgId: _orgId, jamId: _jamId, ...view }: McpSetup) =>
  new McpSetupView(view);

/** What a proposal becomes once the server has acted on it. */
const currentOf = (proposal: McpSetup["proposal"]) => {
  if (proposal.kind === "add") return "added";
  if (proposal.kind === "update") return "updated";
  if (proposal.kind === "connect") return "connected";
  return "ready";
};

export const McpMock = mockGroup("mcp", (handlers) =>
  Effect.gen(function* () {
    const { mcpServers } = yield* MockDb;
    const setups = yield* Ref.make<ReadonlyArray<McpSetup>>(sampleSetups);
    const connections =
      yield* Ref.make<ReadonlyArray<McpConnection>>(sampleConnections);
    const secrets = yield* Ref.make<ReadonlyArray<McpSecret>>(sampleSecrets);
    const favicons = yield* Ref.make<Readonly<Record<string, string>>>({});
    const oauthStates = yield* Ref.make<Readonly<Record<string, string>>>({});
    const oauthSessions = yield* Ref.make<Readonly<Record<string, string>>>({});

    const requireServer = (id: string) =>
      Effect.gen(function* () {
        const rows = yield* Ref.get(mcpServers);
        const server = rows.find((row) => row.id === id);
        if (!server) return yield* notFound("mcpServers", id);
        return server;
      });

    const requireSetup = (id: string) =>
      Effect.gen(function* () {
        const rows = yield* Ref.get(setups);
        const setup = rows.find((row) => row.id === id);
        if (!setup) return yield* notFoundNamed("mcp setup", id);
        return setup;
      });

    const patchSetup = (id: string, patch: Partial<McpSetup>) =>
      Effect.gen(function* () {
        const current = yield* requireSetup(id);
        const updated = { ...current, ...patch };
        yield* Ref.update(setups, (rows) =>
          rows.map((row) => (row.id === id ? updated : row)),
        );
        return updated;
      });

    const setServerStatus = (id: string, status: string) =>
      Effect.gen(function* () {
        const current = yield* requireServer(id);
        const updated = { ...current, status };
        yield* Ref.update(mcpServers, (rows) =>
          rows.map((row) => (row.id === id ? updated : row)),
        );
        return updated;
      });

    return handlers
      .handle("resolveFavicon", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const url = text(input.url, sampleFavicon.url);
          yield* Ref.update(favicons, (rows) => ({ ...rows, [url]: url }));
          return { url };
        }),
      )
      .handle("completeOAuth", ({ payload }) =>
        Effect.gen(function* () {
          const { state } = payload;
          const states = yield* Ref.get(oauthStates);
          if (!(state in states)) {
            return yield* Effect.die(
              new Error(`mcp.oauthStates: no row ${state}`),
            );
          }
          if (payload.error !== undefined) {
            return new McpOAuthCompletion({
              result: "denied",
              destination: "/settings/mcp",
            });
          }
          yield* Ref.update(oauthSessions, (rows) => ({
            ...rows,
            [state]: `oauth_session_mock_${state}`,
          }));
          return new McpOAuthCompletion({
            result: "connected",
            destination: "/settings/mcp",
          });
        }),
      )
      .handle("listSetups", ({ params }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(setups);
          return rows
            .filter(
              (setup) =>
                setup.orgId === params.orgId && setup.jamId === params.jamId,
            )
            .map(viewOf);
        }),
      )
      .handle("listServers", () =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(mcpServers);
          // The row's tool count is what the Tools section lists, so the two
          // can never disagree on screen.
          return rows.map((row) => ({
            ...row,
            // An untested server has no known tool count; only a server whose
            // tools have actually been listed can report zero.
            toolCount: sampleToolsByServer[row.id]?.length ?? null,
          }));
        }),
      )
      .handle("createServer", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const server = {
            id: newId("mcp"),
            key: text(input.key, "custom"),
            name: text(input.name, "New MCP server"),
            url: text(input.url, "https://mcp.example.com/custom"),
            transport: text(input.transport, "http"),
            status: "needs_auth",
            createdAt: DateTime.formatIso(minutesAgo(0)),
            updatedAt: DateTime.formatIso(minutesAgo(0)),
            lastCheckedAt: null,
          };
          yield* Ref.update(mcpServers, (rows) => [...rows, server]);
          return server;
        }),
      )
      .handle("updateServer", ({ params, payload }) =>
        Effect.gen(function* () {
          const current = yield* requireServer(params.serverId);
          const input = fields(payload);
          const updated = {
            ...current,
            ...(typeof input.key === "string" ? { key: input.key } : {}),
            ...(typeof input.name === "string" ? { name: input.name } : {}),
            ...(typeof input.url === "string" ? { url: input.url } : {}),
            ...(typeof input.transport === "string"
              ? { transport: input.transport }
              : {}),
          };
          yield* Ref.update(mcpServers, (rows) =>
            rows.map((row) => (row.id === current.id ? updated : row)),
          );
          return updated;
        }),
      )
      .handle("listConnections", ({ params }) =>
        Effect.gen(function* () {
          yield* requireServer(params.serverId);
          const rows = yield* Ref.get(connections);
          return rows.filter((row) => row.serverId === params.serverId);
        }),
      )
      .handle("deleteServer", ({ params }) =>
        Effect.gen(function* () {
          yield* requireServer(params.serverId);
          yield* Ref.update(mcpServers, (rows) =>
            rows.filter((row) => row.id !== params.serverId),
          );
          yield* Ref.update(connections, (rows) =>
            rows.filter((row) => row.serverId !== params.serverId),
          );
          return { ok: true };
        }),
      )
      .handle("disableServer", ({ params }) =>
        setServerStatus(params.serverId, "disabled"),
      )
      .handle("disconnectCredential", ({ params }) =>
        Effect.gen(function* () {
          yield* requireServer(params.serverId);
          yield* Ref.update(connections, (rows) =>
            rows.map((row) =>
              row.serverId === params.serverId
                ? { ...row, status: "needs_auth", credentialId: null }
                : row,
            ),
          );
          return { ok: true };
        }),
      )
      .handle("enableServer", ({ params }) =>
        setServerStatus(params.serverId, "connected"),
      )
      .handle("startOAuth", ({ params, payload }) =>
        Effect.gen(function* () {
          const server = yield* requireServer(params.serverId);
          const input = fields(payload);
          const state = `state_${server.id}`;
          const redirectUri = text(input.redirectUri, sampleRedirectUri);
          yield* Ref.update(oauthStates, (rows) => ({
            ...rows,
            [state]: redirectUri,
          }));
          return {
            state,
            authorizeUrl: `https://mcp.example.com/oauth/authorize?state=${state}`,
            redirectUri,
          };
        }),
      )
      .handle("refreshServer", ({ params }) =>
        Effect.gen(function* () {
          const server = yield* requireServer(params.serverId);
          const refreshedAt = DateTime.formatIso(minutesAgo(0));
          const next = {
            ...server,
            status: "connected",
            lastCheckedAt: refreshedAt,
          };
          yield* Ref.update(mcpServers, (rows) =>
            rows.map((row) => (row.id === server.id ? next : row)),
          );
          return { ...next, refreshedAt };
        }),
      )
      .handle("getSecretValue", ({ params }) =>
        Effect.gen(function* () {
          const server = yield* requireServer(params.serverId);
          const rows = yield* Ref.get(secrets);
          const secret = rows.find(
            (row) =>
              row.serverId === server.id &&
              row.position === params.position &&
              row.name === params.name,
          );
          if (!secret) {
            return yield* notFoundNamed(
              "mcp secret",
              `${params.serverId}/${params.position}/${params.name}`,
            );
          }
          return { value: secret.value, name: secret.name };
        }),
      )
      .handle("testServer", ({ params, payload }) =>
        Effect.gen(function* () {
          const server = yield* requireServer(params.serverId);
          const input = fields(payload);
          const verbose = flag(input.verbose, false);
          const disabled = server.status === "disabled";
          const needsAuth = server.status === "needs_auth";
          const tools = sampleToolsByServer[server.id] ?? [];
          // A test that ran is a check, and the row the page reads has to carry
          // that: the header shows the row's check time, so a result kept
          // anywhere else leaves the page reporting the last one forever.
          if (!disabled) {
            const checkedAt = DateTime.formatIso(minutesAgo(0));
            // Only the check time moves: the server page keys its body on
            // updatedAt, and a check is not an edit of the configuration.
            yield* Ref.update(mcpServers, (rows) =>
              rows.map((row) =>
                row.id === server.id
                  ? { ...row, lastCheckedAt: checkedAt }
                  : row,
              ),
            );
          }
          return {
            version: disabled ? null : "2025-06-18",
            auth: needsAuth ? "oauth" : "none",
            requestedScopes: [],
            grantedScopes: [],
            requiredScopes: null,
            passed: disabled
              ? []
              : needsAuth
                ? ["connect", "auth", "permissions", "protocol", "list"]
                : ["connect", "protocol", "list"],
            failure: disabled
              ? { stage: "connect", code: "disabled", detail: "Server is off" }
              : null,
            toolCount: disabled ? null : tools.length,
            machines: verbose ? [{ id: "machine_build", label: "build" }] : [],
          };
        }),
      )
      .handle("serverTools", ({ params }) =>
        Effect.gen(function* () {
          const server = yield* requireServer(params.serverId);
          const tools = sampleToolsByServer[server.id] ?? [];
          return [...tools];
        }),
      )
      .handle("probeDraft", ({ payload }) =>
        Effect.sync(() => {
          const input = fields(payload);
          const url = text(input.url, "https://mcp.example.com/draft");
          return {
            name: text(input.name, "Draft MCP server"),
            url,
            transport: text(input.transport, "http"),
            status: "draft",
            tools: sampleToolsByServer.mcp_sample_errors ?? [],
            favicon: sampleFavicon.url,
          };
        }),
      )
      .handle("createSetup", ({ params, payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          // The server derives the proposal from the tool call; the mock has no
          // event store to read it back from, so it starts from the sample add.
          const sample = sampleSetups[0] as McpSetup;
          const setup: McpSetup = {
            ...sample,
            id: McpSetupId.make(newId("setup")),
            orgId: params.orgId,
            jamId: text(input.jamId, sample.jamId),
            toolCallId: ToolCallId.make(
              text(input.toolCallId, "call_mock_setup"),
            ),
            state: "pending",
            current: "pending",
            expired: false,
            serverId: undefined,
            pluginInstallationId: null,
            toolCount: undefined,
            health: { state: "unchecked" },
            recovery: "none",
          };
          yield* Ref.update(setups, (rows) => [...rows, setup]);
          return viewOf(setup);
        }),
      )
      .handle("getSetup", ({ params }) =>
        Effect.map(requireSetup(params.setupId), viewOf),
      )
      .handle("completeSetup", ({ params, payload }) =>
        Effect.gen(function* () {
          const current = yield* requireSetup(params.setupId);
          const input = fields(payload);
          if (input.decision === "decline") {
            return viewOf(
              yield* patchSetup(current.id, {
                state: "declined",
                current: "declined",
                recovery: "none",
              }),
            );
          }
          const owner = input.owner;
          return viewOf(
            yield* patchSetup(current.id, {
              state: "completed",
              current: currentOf(current.proposal),
              recovery: "none",
              ...(owner === "user" || owner === "organization"
                ? { owner }
                : {}),
            }),
          );
        }),
      )
      .handle("retrySetup", ({ params }) =>
        Effect.gen(function* () {
          const current = yield* requireSetup(params.setupId);
          return viewOf(
            yield* patchSetup(current.id, {
              state: "pending",
              current: "pending",
              health: { state: "checking" },
              recovery: "automatic",
            }),
          );
        }),
      );
  }),
);
