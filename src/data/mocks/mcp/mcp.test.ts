import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import type { Atom } from "effect/reactivity";
import { AtomRegistry as Registry } from "effect/reactivity";
import { ApiClient } from "../../client/ApiClient.ts";
import { orgId, threads } from "../fixtures/world.ts";

interface Server {
  readonly id: string;
  readonly name: string;
  readonly status: string;
}

interface Setup {
  readonly id: string;
  readonly name: string;
  readonly status: string;
  readonly attempts: number;
}

const key = `mcp:${orgId}`;
const serverId = "mcp_sample_errors";
const setupId = "setup_sample_errors";

const serversAtom = ApiClient.query("mcp", "listServers", {
  params: { orgId },
  reactivityKeys: [key],
});
const setupsAtom = ApiClient.query("mcp", "listSetups", {
  params: { orgId, jamId: threads.checkoutTest.id },
  reactivityKeys: [key],
});
const connectionsAtom = ApiClient.query("mcp", "listConnections", {
  params: { orgId, serverId },
  reactivityKeys: [key],
});
const toolsAtom = ApiClient.query("mcp", "serverTools", {
  params: { orgId, serverId },
  reactivityKeys: [key],
});
const secretAtom = ApiClient.query("mcp", "getSecretValue", {
  params: { orgId, serverId, position: "0", name: "token" },
  reactivityKeys: [key],
});
const setupAtom = ApiClient.query("mcp", "getSetup", {
  params: { orgId, setupId },
  reactivityKeys: [key],
});

const createServer = ApiClient.mutation("mcp", "createServer");
const updateServer = ApiClient.mutation("mcp", "updateServer");
const deleteServer = ApiClient.mutation("mcp", "deleteServer");
const createSetup = ApiClient.mutation("mcp", "createSetup");
const completeSetup = ApiClient.mutation("mcp", "completeSetup");
const retrySetup = ApiClient.mutation("mcp", "retrySetup");
const resolveFavicon = ApiClient.mutation("mcp", "resolveFavicon");
const startOAuth = ApiClient.mutation("mcp", "startOAuth");
const completeOAuth = ApiClient.mutation("mcp", "completeOAuth");
const probeDraft = ApiClient.mutation("mcp", "probeDraft");
const testServer = ApiClient.mutation("mcp", "testServer");
const refreshServer = ApiClient.mutation("mcp", "refreshServer");
const disableServer = ApiClient.mutation("mcp", "disableServer");
const disconnectCredential = ApiClient.mutation("mcp", "disconnectCredential");
const enableServer = ApiClient.mutation("mcp", "enableServer");

const read = <A>(
  registry: ReturnType<typeof Registry.make>,
  atom: Atom.Atom<unknown>,
) =>
  Registry.getResult(registry, atom as never, {
    suspendOnWaiting: true,
  }) as Effect.Effect<A, unknown>;

const names = (value: unknown) =>
  (value as ReadonlyArray<{ name: string }>).map((row) => row.name);
const ids = (value: unknown) =>
  (value as ReadonlyArray<Server>).map((server) => server.id);

describe("mcp mock", () => {
  it.effect("returns sensible data from every read endpoint", () =>
    Effect.gen(function* () {
      const registry = Registry.make();
      assert.deepStrictEqual(ids(yield* read(registry, serversAtom)), [
        "mcp_sample_errors",
        "mcp_sample_docs",
        "mcp_sample_untested",
      ]);
      assert.include(
        names(yield* read(registry, setupsAtom)),
        "Error tracker setup",
      );
      assert.isAbove(
        (yield* read<ReadonlyArray<unknown>>(registry, connectionsAtom)).length,
        0,
      );
      assert.include(
        names(yield* read(registry, toolsAtom)),
        "list_recent_errors",
      );
      assert.equal(
        (yield* read<{ value: string }>(registry, secretAtom)).value,
        "example-errors-token",
      );
      assert.equal((yield* read<Setup>(registry, setupAtom)).id, setupId);
    }),
  );

  it.effect("refetches servers after create, update and delete", () =>
    Effect.gen(function* () {
      const registry = Registry.make();
      registry.mount(serversAtom as any)();
      yield* Registry.getResult(registry, serversAtom as any);

      registry.set(createServer, {
        params: { orgId },
        payload: {
          key: "custom",
          name: "Custom MCP server",
          url: "https://mcp.example.com/custom",
          transport: "http",
        },
        reactivityKeys: [key],
      });
      const created = (yield* Registry.getResult(
        registry,
        createServer as any,
        {
          suspendOnWaiting: true,
        },
      )) as unknown as Server;
      assert.include(ids(yield* read(registry, serversAtom)), created.id);

      registry.set(updateServer, {
        params: { orgId, serverId: created.id },
        payload: { name: "Renamed MCP server" },
        reactivityKeys: [key],
      });
      yield* Registry.getResult(registry, updateServer as any);
      const afterUpdate = yield* read<ReadonlyArray<Server>>(
        registry,
        serversAtom,
      );
      assert.equal(
        afterUpdate.find((row) => row.id === created.id)?.name,
        "Renamed MCP server",
      );

      registry.set(deleteServer, {
        params: { orgId, serverId: created.id },
        reactivityKeys: [key],
      });
      yield* Registry.getResult(registry, deleteServer as any);
      assert.notInclude(ids(yield* read(registry, serversAtom)), created.id);
    }),
  );

  it.effect("records a test on the row the page reads", () =>
    Effect.gen(function* () {
      const registry = Registry.make();
      registry.mount(serversAtom as any)();
      const before = yield* read<
        ReadonlyArray<Server & { lastCheckedAt: string | null }>
      >(registry, serversAtom);
      assert.isNull(
        before.find((row) => row.id === "mcp_sample_untested")?.lastCheckedAt,
      );

      registry.set(testServer, {
        params: { orgId, serverId: "mcp_sample_untested" },
        payload: {},
        reactivityKeys: [key],
      });
      const diagnosis = (yield* Registry.getResult(
        registry,
        testServer as any,
        { suspendOnWaiting: true },
      )) as unknown as { passed: ReadonlyArray<string> };

      const after = yield* read<
        ReadonlyArray<Server & { lastCheckedAt: string | null }>
      >(registry, serversAtom);
      // A test that ran is a check, so the refetch the page does has to carry it.
      assert.isNotNull(
        after.find((row) => row.id === "mcp_sample_untested")?.lastCheckedAt,
      );
      // An authenticated server reports the stages it actually went through.
      assert.deepStrictEqual(diagnosis.passed, ["connect", "protocol", "list"]);

      registry.set(testServer, {
        params: { orgId, serverId: "mcp_sample_docs" },
        payload: {},
        reactivityKeys: [key],
      });
      const authed = (yield* Registry.getResult(registry, testServer as any, {
        suspendOnWaiting: true,
      })) as unknown as { passed: ReadonlyArray<string> };
      assert.deepStrictEqual(authed.passed, [
        "connect",
        "auth",
        "permissions",
        "protocol",
        "list",
      ]);
    }),
  );

  it.effect("creates, completes and retries a setup", () =>
    Effect.gen(function* () {
      const registry = Registry.make();
      const setupsAfterMutationsAtom = ApiClient.query("mcp", "listSetups", {
        params: { orgId, jamId: threads.checkoutTest.id },
        reactivityKeys: [key],
      });
      registry.mount(setupsAfterMutationsAtom as any)();
      yield* Registry.getResult(registry, setupsAfterMutationsAtom as any);
      registry.set(createSetup, {
        params: { orgId },
        payload: { name: "Added MCP setup" },
        reactivityKeys: [key],
      });
      const created = (yield* Registry.getResult(registry, createSetup as any, {
        suspendOnWaiting: true,
      })) as unknown as Setup;

      registry.set(completeSetup, {
        params: { orgId, setupId: created.id },
        payload: {},
        reactivityKeys: [key],
      });
      yield* Registry.getResult(registry, completeSetup as any);

      registry.set(retrySetup, {
        params: { orgId, setupId: created.id },
        reactivityKeys: [key],
      });
      yield* Registry.getResult(registry, retrySetup as any);

      const after = yield* read<ReadonlyArray<Setup>>(
        registry,
        setupsAfterMutationsAtom,
      );
      assert.equal(
        after.find((row) => row.id === created.id)?.status,
        "in_progress",
      );
      assert.equal(after.find((row) => row.id === created.id)?.attempts, 1);
    }),
  );

  it.effect("answers the remaining mutations with plain JSON", () =>
    Effect.gen(function* () {
      const registry = Registry.make();

      registry.set(resolveFavicon, {
        payload: { url: "https://mcp.example.com/favicon.ico" },
      });
      const favicon = yield* Registry.getResult(
        registry,
        resolveFavicon as any,
        {
          suspendOnWaiting: true,
        },
      );
      assert.equal(
        (favicon as { url: string }).url,
        "https://mcp.example.com/favicon.ico",
      );

      registry.set(startOAuth, { params: { orgId, serverId }, payload: {} });
      const start = (yield* Registry.getResult(registry, startOAuth as any, {
        suspendOnWaiting: true,
      })) as unknown as { state: string };
      registry.set(completeOAuth, { payload: { state: start.state } });
      const done = yield* Registry.getResult(registry, completeOAuth as any, {
        suspendOnWaiting: true,
      });
      assert.strictEqual((done as { result: string }).result, "connected");
      assert.strictEqual(
        (done as { destination: string }).destination,
        "/settings/mcp",
      );

      registry.set(probeDraft, {
        params: { orgId },
        payload: { url: "https://mcp.example.com/draft" },
      });
      assert.isNotEmpty(
        yield* Registry.getResult(registry, probeDraft as any, {
          suspendOnWaiting: true,
        }),
      );

      registry.set(testServer, { params: { orgId, serverId }, payload: {} });
      const tested = yield* Registry.getResult(registry, testServer as any, {
        suspendOnWaiting: true,
      });
      const diagnosis = tested as {
        version: string | null;
        failure: unknown;
        passed: ReadonlyArray<string>;
        toolCount: number | null;
      };
      assert.isNull(diagnosis.failure);
      assert.include(diagnosis.passed, "list");
      assert.strictEqual(diagnosis.toolCount, 2);
      assert.isString(diagnosis.version);

      registry.set(refreshServer, { params: { orgId, serverId } });
      const refreshed = yield* Registry.getResult(
        registry,
        refreshServer as any,
        {
          suspendOnWaiting: true,
        },
      );
      assert.equal((refreshed as Server).status, "connected");

      registry.set(disableServer, { params: { orgId, serverId } });
      const disabled = yield* Registry.getResult(
        registry,
        disableServer as any,
        {
          suspendOnWaiting: true,
        },
      );
      assert.equal((disabled as Server).status, "disabled");

      registry.set(disconnectCredential, { params: { orgId, serverId } });
      const disconnected = yield* Registry.getResult(
        registry,
        disconnectCredential as any,
        {
          suspendOnWaiting: true,
        },
      );
      assert.isTrue((disconnected as { ok: boolean }).ok);

      registry.set(enableServer, { params: { orgId, serverId } });
      const enabled = yield* Registry.getResult(registry, enableServer as any, {
        suspendOnWaiting: true,
      });
      assert.equal((enabled as Server).status, "connected");
    }),
  );
});
