import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { ApiClient } from "../../client/ApiClient.ts";
import { orgId, people, threads } from "../fixtures/world.ts";

const key = `plugins:${orgId}`;
const installationId = "plugininst_sample_ci";
const versionId = "plugver_sample_ci_1_4_0";
const serverKey = "logs";

const listThreadPlugins = ApiClient.query("plugins", "listThreadPlugins", {
  params: { orgId, jamId: threads.checkoutTest.id },
  reactivityKeys: [key],
});
const listInstallations = ApiClient.query("plugins", "listInstallations", {
  params: { orgId },
  reactivityKeys: [key],
});
const listRateLimitPlugins = ApiClient.query("plugins", "listThreadPlugins", {
  params: { orgId, jamId: threads.rateLimit.id },
  reactivityKeys: [key],
});
const getInstallation = ApiClient.query("plugins", "getInstallation", {
  params: { orgId, installationId },
  reactivityKeys: [key],
});
const getVersion = ApiClient.query("plugins", "getVersion", {
  params: { orgId, versionId },
});
const getVersionIcon = ApiClient.query("plugins", "getVersionIcon", {
  params: { orgId, versionId },
});
const listMarketplace = ApiClient.query("plugins", "listMarketplace", {
  params: { orgId },
  reactivityKeys: [key],
});

const addInstallation = ApiClient.mutation("plugins", "addInstallation");
const patchInstallation = ApiClient.mutation("plugins", "patchInstallation");
const removeInstallation = ApiClient.mutation("plugins", "removeInstallation");
const rollbackInstallation = ApiClient.mutation(
  "plugins",
  "rollbackInstallation",
);
const cancelRollback = ApiClient.mutation("plugins", "cancelRollback");
const connectServer = ApiClient.mutation("plugins", "connectServer");
const disconnectServer = ApiClient.mutation("plugins", "disconnectServer");
const syncInstallation = ApiClient.mutation("plugins", "syncInstallation");
const updateInstallation = ApiClient.mutation("plugins", "updateInstallation");
const fetchGitHubVersion = ApiClient.mutation("plugins", "fetchGitHubVersion");

interface Installation {
  readonly id: string;
  readonly displayName: string;
  readonly version: string;
  readonly status: string;
  readonly updateAvailable: boolean;
  readonly rollbackToVersion: string | null;
  readonly rollbackVersion: string | null;
  readonly lastSyncedAt: string;
  readonly servers: ReadonlyArray<{
    readonly serverKey: string;
    readonly status: string;
    readonly connectedBy: string | null;
  }>;
}

interface Binding {
  readonly installationId: string;
  readonly version: string;
}

interface Listing {
  readonly key: string;
  readonly installed: boolean;
}

const rows = <T>(value: unknown): ReadonlyArray<T> => value as ReadonlyArray<T>;
const one = <T>(value: unknown): T => value as T;

describe("plugins mock", () => {
  it.effect("serves every read endpoint with sensible sample data", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const threadPlugins = yield* AtomRegistry.getResult(
        registry,
        listThreadPlugins,
      );
      const installations = yield* AtomRegistry.getResult(
        registry,
        listInstallations,
      );
      const installation = yield* AtomRegistry.getResult(
        registry,
        getInstallation,
      );
      const version = yield* AtomRegistry.getResult(registry, getVersion);
      const icon = yield* AtomRegistry.getResult(registry, getVersionIcon);
      const marketplace = yield* AtomRegistry.getResult(
        registry,
        listMarketplace,
      );

      assert.isAbove(rows<Binding>(threadPlugins).length, 0);
      assert.equal(
        rows<Binding>(threadPlugins)[0]?.installationId,
        installationId,
      );
      assert.isAbove(rows<Installation>(installations).length, 0);
      assert.equal(one<Installation>(installation).displayName, "CI Helper");
      assert.equal(one<{ version: string }>(version).version, "1.4.0");
      assert.include(
        String(one<{ url: string }>(icon).url),
        "plugins.example.com",
      );
      assert.isAbove(rows<Listing>(marketplace).length, 0);
      assert.isTrue(rows<Listing>(marketplace).some((row) => row.installed));
    }),
  );

  it.effect("exposes marketplace and GitHub version metadata", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const marketplace = yield* AtomRegistry.getResult(
        registry,
        listMarketplace,
      );
      registry.set(fetchGitHubVersion, {
        params: { orgId },
        payload: { repository: "acme/ci-helper", version: "1.4.0" },
        reactivityKeys: [key],
      });
      const github = yield* AtomRegistry.getResult(
        registry,
        fetchGitHubVersion,
      );
      assert.isTrue(
        rows<Listing>(marketplace).some((row) => row.key === "ci-helper"),
      );
      assert.equal(one<{ source: string }>(github).source, "github");
      assert.equal(
        one<{ repository: string }>(github).repository,
        "acme/ci-helper",
      );
    }),
  );

  it.effect(
    "creates, patches and removes installations with reactive reads",
    () =>
      Effect.gen(function* () {
        const registry = AtomRegistry.make();
        registry.mount(listInstallations);
        registry.mount(getInstallation);
        registry.mount(listMarketplace);
        registry.mount(listThreadPlugins);
        registry.mount(listRateLimitPlugins);
        yield* AtomRegistry.getResult(registry, listInstallations);

        registry.set(addInstallation, {
          params: { orgId },
          payload: {
            versionId: "plugver_sample_docs_0_9_0",
            threadId: threads.rateLimit.id,
            installedBy: people.alex.id,
            projectId: "proj_sample_api",
          },
          reactivityKeys: [key],
        });
        const created = yield* AtomRegistry.getResult(
          registry,
          addInstallation,
        );
        const createdId = one<Installation>(created).id;
        const afterCreate = yield* AtomRegistry.getResult(
          registry,
          listInstallations,
          {
            suspendOnWaiting: true,
          },
        );
        assert.isTrue(
          rows<Installation>(afterCreate).some((row) => row.id === createdId),
        );
        const bound = yield* AtomRegistry.getResult(
          registry,
          listRateLimitPlugins,
          {
            suspendOnWaiting: true,
          },
        );
        assert.isTrue(
          rows<Binding>(bound).some((row) => row.installationId === createdId),
        );
        const marketplaceAfterCreate = yield* AtomRegistry.getResult(
          registry,
          listMarketplace,
          { suspendOnWaiting: true },
        );
        assert.isTrue(
          rows<Listing>(marketplaceAfterCreate).find(
            (row) => row.key === "docs-search",
          )?.installed === true,
        );

        registry.set(patchInstallation, {
          params: { orgId, installationId },
          payload: { displayName: "Docs Search", status: "connected" },
          reactivityKeys: [key],
        });
        const patched = yield* AtomRegistry.getResult(
          registry,
          patchInstallation,
        );
        assert.equal(one<Installation>(patched).displayName, "Docs Search");
        const afterPatch = yield* AtomRegistry.getResult(
          registry,
          getInstallation,
          {
            suspendOnWaiting: true,
          },
        );
        assert.equal(one<Installation>(afterPatch).displayName, "Docs Search");

        registry.set(removeInstallation, {
          params: { orgId, installationId: createdId },
          reactivityKeys: [key],
        });
        yield* AtomRegistry.getResult(registry, removeInstallation);
        const afterRemove = yield* AtomRegistry.getResult(
          registry,
          listInstallations,
          {
            suspendOnWaiting: true,
          },
        );
        assert.isFalse(
          rows<Installation>(afterRemove).some((row) => row.id === createdId),
        );
        const unbound = yield* AtomRegistry.getResult(
          registry,
          listRateLimitPlugins,
          {
            suspendOnWaiting: true,
          },
        );
        assert.isFalse(
          rows<Binding>(unbound).some(
            (row) => row.installationId === createdId,
          ),
        );
        const marketplaceAfterRemove = yield* AtomRegistry.getResult(
          registry,
          listMarketplace,
          { suspendOnWaiting: true },
        );
        assert.isFalse(
          rows<Listing>(marketplaceAfterRemove).find(
            (row) => row.key === "docs-search",
          )?.installed,
        );
      }),
  );

  it.effect(
    "rolls back, cancels, connects, disconnects and syncs with reactive reads",
    () =>
      Effect.gen(function* () {
        const registry = AtomRegistry.make();
        registry.mount(getInstallation);
        registry.mount(listThreadPlugins);
        yield* AtomRegistry.getResult(registry, getInstallation);

        registry.set(rollbackInstallation, {
          params: { orgId, installationId },
          payload: { version: "1.3.2" },
          reactivityKeys: [key],
        });
        const rolled = yield* AtomRegistry.getResult(
          registry,
          rollbackInstallation,
        );
        assert.equal(one<Installation>(rolled).version, "1.3.2");
        assert.equal(one<Installation>(rolled).rollbackToVersion, "1.3.2");
        const boundAfterRollback = yield* AtomRegistry.getResult(
          registry,
          listThreadPlugins,
          { suspendOnWaiting: true },
        );
        assert.isTrue(
          rows<Binding>(boundAfterRollback)
            .filter((row) => row.installationId === installationId)
            .every((row) => row.version === "1.3.2"),
        );

        registry.set(cancelRollback, {
          params: { orgId, installationId },
          payload: {},
          reactivityKeys: [key],
        });
        const cancelled = yield* AtomRegistry.getResult(
          registry,
          cancelRollback,
        );
        assert.isNull(one<Installation>(cancelled).rollbackToVersion);

        registry.set(connectServer, {
          params: { orgId, installationId, serverKey },
          payload: { connectedBy: people.sam.id },
          reactivityKeys: [key],
        });
        const connected = yield* AtomRegistry.getResult(
          registry,
          connectServer,
        );
        const connection = one<Installation>(connected).servers.find(
          (row) => row.serverKey === serverKey,
        );
        assert.equal(connection?.status, "connected");
        assert.equal(connection?.connectedBy, people.sam.id);

        registry.set(disconnectServer, {
          params: { orgId, installationId, serverKey },
          reactivityKeys: [key],
        });
        const disconnected = yield* AtomRegistry.getResult(
          registry,
          disconnectServer,
        );
        const afterDisconnect = one<Installation>(disconnected).servers.find(
          (row) => row.serverKey === serverKey,
        );
        assert.equal(afterDisconnect?.status, "disconnected");
        assert.isNull(afterDisconnect?.connectedBy);

        registry.set(syncInstallation, {
          params: { orgId, installationId },
          reactivityKeys: [key],
        });
        const synced = yield* AtomRegistry.getResult(
          registry,
          syncInstallation,
        );
        assert.isString(one<Installation>(synced).lastSyncedAt);

        registry.set(updateInstallation, {
          params: { orgId, installationId },
          payload: { versionId },
          reactivityKeys: [key],
        });
        const updated = yield* AtomRegistry.getResult(
          registry,
          updateInstallation,
        );
        assert.equal(one<Installation>(updated).version, "1.4.0");
        assert.equal(one<Installation>(updated).rollbackVersion, "1.3.2");
        const afterUpdate = yield* AtomRegistry.getResult(
          registry,
          getInstallation,
          {
            suspendOnWaiting: true,
          },
        );
        assert.equal(one<Installation>(afterUpdate).version, "1.4.0");
      }),
  );
});
