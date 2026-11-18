import { DateTime, Effect, Ref } from "effect";
import { McpOAuthCompletion } from "../../api/schemas/mcp.ts";
import { fields, MockDb, missing, newId } from "../db/MockDb.ts";
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
    const tests = yield* Ref.make<Readonly<Record<string, string>>>({});

    const requireServer = (id: string) =>
      Effect.gen(function* () {
        const rows = yield* Ref.get(mcpServers);
        const server = rows.find((row) => row.id === id);
        if (!server) return yield* missing("mcpServers", id);
        return server;
      });

    const requireSetup = (id: string) =>
      Effect.gen(function* () {
        const rows = yield* Ref.get(setups);
        const setup = rows.find((row) => row.id === id);
        if (!setup) {
          return yield* Effect.die(new Error(`mcp.setups: no row ${id}`));
        }
        return setup;
      });

    const patchSetup = (id: string, patch: Partial<McpSetup>) =>
      Effect.gen(function* () {
        const current = yield* requireSetup(id);
        const updated = {
          ...current,
          ...patch,
          updatedAt: isoNow(),
        };
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
          return rows.filter(
            (setup) =>
              setup.orgId === params.orgId && setup.jamId === params.jamId,
          );
        }),
      )
      .handle("listServers", () =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(mcpServers);
          // The row's tool count is what the Tools section lists, so the two
          // can never disagree on screen.
          return rows.map((row) => ({
            ...row,
            toolCount: (sampleToolsByServer[row.id] ?? []).length,
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
            lastCheckedAt: DateTime.formatIso(minutesAgo(0)),
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
          return {
            ...server,
            status: "connected",
            refreshedAt: DateTime.formatIso(minutesAgo(0)),
          };
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
            return yield* Effect.die(
              new Error(
                `mcp.secrets: no row ${params.serverId}/${params.position}/${params.name}`,
              ),
            );
          }
          return { value: secret.value, name: secret.name };
        }),
      )
      .handle("testServer", ({ params, payload }) =>
        Effect.gen(function* () {
          const server = yield* requireServer(params.serverId);
          const input = fields(payload);
          const verbose = flag(input.verbose, true);
          const disabled = server.status === "disabled";
          const tools = sampleToolsByServer[server.id] ?? [];
          const status = disabled ? "skipped" : "ok";
          yield* Ref.update(tests, (rows) => ({
            ...rows,
            [server.id]: status,
          }));
          return {
            version: disabled ? null : "2025-06-18",
            auth: server.status === "needs_auth" ? "oauth" : "none",
            requestedScopes: [],
            grantedScopes: [],
            requiredScopes: null,
            passed: disabled ? [] : ["connect", "protocol", "list"],
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
      .handle("createSetup", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const setup: McpSetup = {
            id: newId("setup"),
            orgId: text(input.orgId, sampleSetups[0]?.orgId ?? ""),
            jamId: text(input.jamId, sampleSetups[0]?.jamId ?? ""),
            name: text(input.name, "New MCP setup"),
            status: "pending",
            ownerId: text(input.ownerId, sampleSetups[0]?.ownerId ?? ""),
            attempts: 0,
            createdAt: isoNow(),
            updatedAt: isoNow(),
            completedAt: null,
          };
          yield* Ref.update(setups, (rows) => [...rows, setup]);
          return setup;
        }),
      )
      .handle("getSetup", ({ params }) => requireSetup(params.setupId))
      .handle("completeSetup", ({ params, payload }) =>
        Effect.gen(function* () {
          const current = yield* requireSetup(params.setupId);
          const input = fields(payload);
          return yield* patchSetup(current.id, {
            status: "completed",
            ...(typeof input.name === "string" ? { name: input.name } : {}),
            completedAt: isoNow(),
          });
        }),
      )
      .handle("retrySetup", ({ params }) =>
        Effect.gen(function* () {
          const current = yield* requireSetup(params.setupId);
          return yield* patchSetup(current.id, {
            status: "in_progress",
            attempts: current.attempts + 1,
          });
        }),
      );
  }),
);

const isoNow = () => DateTime.formatIso(minutesAgo(0));
