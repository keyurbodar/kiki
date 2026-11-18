import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { defaultModelId } from "@/components/model-picker/catalog";
import { InvalidRequest } from "../../api/schemas/errors.ts";
import { ApiClient } from "../../client/ApiClient.ts";
import { orgId, viewer, world } from "../fixtures/world.ts";

const key = `models:${orgId}`;
const params = { orgId };

interface Credential {
  readonly id: string;
  readonly service: string;
  readonly name: string;
  readonly enabled: boolean;
  readonly status: string;
  readonly models: ReadonlyArray<string>;
}

interface Connection {
  readonly credentialId: string;
  readonly service: string;
  readonly enabled: boolean;
  readonly models: ReadonlyArray<string>;
  readonly position: number;
}

interface CompactAt {
  readonly userId?: string;
  readonly orgId?: string;
  readonly compactAt: string;
}

const listAtom = ApiClient.query("models", "list", {
  query: {},
  reactivityKeys: [key],
});
const myCompactAtom = ApiClient.query("models", "listMyCompactAt", {
  params,
  reactivityKeys: [key],
});
const orgCompactAtom = ApiClient.query("models", "listCompactAt", {
  params,
  reactivityKeys: [key],
});
const connectionsAtom = ApiClient.query("models", "connections", {
  params,
  query: {},
  reactivityKeys: [key],
});
const routingAtom = ApiClient.query("models", "routing", {
  params,
  reactivityKeys: [key],
});
const settingsAtom = ApiClient.query("models", "getSettings", {
  params,
  reactivityKeys: [key],
});

const rows = (value: unknown) => value as ReadonlyArray<unknown>;
const connections = (value: unknown) => value as ReadonlyArray<Connection>;
const compactRows = (value: unknown) => value as ReadonlyArray<CompactAt>;
const setting = (value: unknown) => value as Record<string, unknown>;

describe("models mock", () => {
  it.effect("every GET endpoint returns sensible data", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const [list, myCompact, orgCompact, connectionsList, routing, settings] =
        yield* Effect.all([
          AtomRegistry.getResult(registry, listAtom),
          AtomRegistry.getResult(registry, myCompactAtom),
          AtomRegistry.getResult(registry, orgCompactAtom),
          AtomRegistry.getResult(registry, connectionsAtom),
          AtomRegistry.getResult(registry, routingAtom),
          AtomRegistry.getResult(registry, settingsAtom),
        ]);

      const ids = rows(list).map((model) => (model as { id: string }).id);
      assert.deepStrictEqual(
        ids.slice(0, world.models.length),
        world.models.map((model) => model.id),
      );
      assert.include(ids, defaultModelId);
      assert.isAbove(ids.length, world.models.length);
      assert.isAbove(compactRows(myCompact).length, 0);
      assert.isAbove(compactRows(orgCompact).length, 0);
      assert.isAbove(connections(connectionsList).length, 0);
      assert.isAbove(Object.keys(routing as object).length, 0);
      assert.isString(setting(settings).defaultModel);
      for (const query of [
        ApiClient.query("models", "pollDevice", {
          params: { attemptId: "device_attempt_missing" },
        }),
      ]) {
        assert.isDefined(query);
      }
    }),
  );

  it.effect("credential mutations refresh the list and connections", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      registry.mount(listAtom);
      registry.mount(connectionsAtom);
      yield* AtomRegistry.getResult(registry, listAtom);
      yield* AtomRegistry.getResult(registry, connectionsAtom);

      const create = ApiClient.mutation("models", "createCredential");
      registry.set(create, {
        params,
        payload: {
          service: "google",
          name: "Extra workspace",
          models: [world.models[2].id],
        },
        reactivityKeys: [key],
      });
      const created = (yield* AtomRegistry.getResult(
        registry,
        create,
      )) as Credential;
      assert.equal(created.name, "Extra workspace");

      const afterCreateConnections = yield* AtomRegistry.getResult(
        registry,
        connectionsAtom,
        { suspendOnWaiting: true },
      );
      assert.isTrue(
        connections(afterCreateConnections).some(
          (row) => row.credentialId === created.id,
        ),
      );

      const update = ApiClient.mutation("models", "updateCredential");
      registry.set(update, {
        params: { ...params, credentialId: created.id },
        payload: { name: "Renamed workspace", enabled: false },
        reactivityKeys: [key],
      });
      const updated = (yield* AtomRegistry.getResult(
        registry,
        update,
      )) as Credential;
      assert.equal(updated.name, "Renamed workspace");
      assert.isFalse(updated.enabled);

      const setModels = ApiClient.mutation("models", "setConnectionModels");
      registry.set(setModels, {
        params: { ...params, credentialId: created.id },
        payload: { models: [world.models[3].id] },
        reactivityKeys: [key],
      });
      const withModels = (yield* AtomRegistry.getResult(
        registry,
        setModels,
      )) as Connection;
      assert.deepStrictEqual(withModels.models, [world.models[3].id]);

      const remove = ApiClient.mutation("models", "removeCredential");
      registry.set(remove, {
        params: { ...params, credentialId: created.id },
        reactivityKeys: [key],
      });
      yield* AtomRegistry.getResult(registry, remove);
      const afterRemove = yield* AtomRegistry.getResult(
        registry,
        connectionsAtom,
        { suspendOnWaiting: true },
      );
      assert.isFalse(
        connections(afterRemove).some((row) => row.credentialId === created.id),
      );
    }),
  );

  it.effect(
    "compact-at, settings, connections, and credential actions update state",
    () =>
      Effect.gen(function* () {
        const registry = AtomRegistry.make();
        registry.mount(myCompactAtom);
        registry.mount(orgCompactAtom);
        registry.mount(connectionsAtom);
        registry.mount(routingAtom);
        registry.mount(settingsAtom);
        yield* AtomRegistry.getResult(registry, myCompactAtom);
        yield* AtomRegistry.getResult(registry, orgCompactAtom);
        yield* AtomRegistry.getResult(registry, connectionsAtom);
        yield* AtomRegistry.getResult(registry, routingAtom);
        yield* AtomRegistry.getResult(registry, settingsAtom);

        const upsertMine = ApiClient.mutation("models", "upsertMyCompactAt");
        registry.set(upsertMine, {
          params,
          payload: { compactAt: "2026-03-02T08:30:00.000Z" },
          reactivityKeys: [key],
        });
        const mine = (yield* AtomRegistry.getResult(
          registry,
          upsertMine,
        )) as CompactAt;
        assert.equal(mine.userId, viewer.id);
        const afterMine = yield* AtomRegistry.getResult(
          registry,
          myCompactAtom,
          {
            suspendOnWaiting: true,
          },
        );
        assert.isTrue(
          compactRows(afterMine).some((row) => row.userId === viewer.id),
        );

        const removeMine = ApiClient.mutation("models", "removeMyCompactAt");
        registry.set(removeMine, { params, query: {}, reactivityKeys: [key] });
        yield* AtomRegistry.getResult(registry, removeMine);
        const withoutMine = yield* AtomRegistry.getResult(
          registry,
          myCompactAtom,
          {
            suspendOnWaiting: true,
          },
        );
        assert.isFalse(
          compactRows(withoutMine).some((row) => row.userId === viewer.id),
        );

        const upsertOrg = ApiClient.mutation("models", "upsertCompactAt");
        registry.set(upsertOrg, {
          params,
          payload: { compactAt: "2026-03-02T08:00:00.000Z" },
          reactivityKeys: [key],
        });
        yield* AtomRegistry.getResult(registry, upsertOrg);
        const afterOrg = yield* AtomRegistry.getResult(
          registry,
          orgCompactAtom,
          {
            suspendOnWaiting: true,
          },
        );
        assert.isTrue(compactRows(afterOrg).some((row) => row.orgId === orgId));

        const removeOrg = ApiClient.mutation("models", "removeCompactAt");
        registry.set(removeOrg, { params, query: {}, reactivityKeys: [key] });
        yield* AtomRegistry.getResult(registry, removeOrg);
        const withoutOrg = yield* AtomRegistry.getResult(
          registry,
          orgCompactAtom,
          {
            suspendOnWaiting: true,
          },
        );
        assert.isFalse(
          compactRows(withoutOrg).some((row) => row.orgId === orgId),
        );

        const setDefault = ApiClient.mutation("models", "setModelSetting");
        registry.set(setDefault, {
          params,
          payload: { defaultModel: world.models[0].id },
          reactivityKeys: [key],
        });
        const afterDefault = (yield* AtomRegistry.getResult(
          registry,
          setDefault,
        )) as Record<string, unknown>;
        assert.equal(afterDefault.defaultModel, world.models[0].id);

        const setFallback = ApiClient.mutation("models", "setFallback");
        registry.set(setFallback, {
          params,
          payload: { fallbackModel: world.models[1].id },
          reactivityKeys: [key],
        });
        yield* AtomRegistry.getResult(registry, setFallback);
        const afterFallback = yield* AtomRegistry.getResult(
          registry,
          settingsAtom,
          {
            suspendOnWaiting: true,
          },
        );
        assert.equal(setting(afterFallback).fallbackModel, world.models[1].id);

        const setMembers = ApiClient.mutation("models", "setMemberCredentials");
        registry.set(setMembers, {
          params,
          payload: { memberCredentials: "personal" },
          reactivityKeys: [key],
        });
        yield* AtomRegistry.getResult(registry, setMembers);
        const afterMembers = yield* AtomRegistry.getResult(
          registry,
          settingsAtom,
          {
            suspendOnWaiting: true,
          },
        );
        assert.equal(setting(afterMembers).memberCredentials, "personal");

        const reorder = ApiClient.mutation("models", "reorderConnections");
        const beforeReorder = connections(
          yield* AtomRegistry.getResult(registry, connectionsAtom),
        );
        const order = [...beforeReorder]
          .reverse()
          .map((row) => row.credentialId);
        registry.set(reorder, {
          params,
          payload: { order },
          reactivityKeys: [key],
        });
        yield* AtomRegistry.getResult(registry, reorder);
        const reordered = connections(
          yield* AtomRegistry.getResult(registry, connectionsAtom, {
            suspendOnWaiting: true,
          }),
        );
        assert.deepStrictEqual(
          reordered.map((row) => row.credentialId),
          order,
        );
      }),
  );

  it.effect("handles the remaining credential and provider actions", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const connectionsList = connections(
        yield* AtomRegistry.getResult(registry, connectionsAtom),
      );
      const first = connectionsList[0];
      if (!first) return yield* Effect.die("No sample connections");
      const credentialId = first.credentialId;
      const service = first.service;

      const actions: ReadonlyArray<{
        endpoint:
          | "setCredentialEnabled"
          | "startDevice"
          | "refreshClaudeSeat"
          | "connectClaudeSeat"
          | "discoverModels"
          | "upsertOrgKey"
          | "removeOrgKey"
          | "checkMediaUrl"
          | "moveToOrganization"
          | "testCredential"
          | "refreshDaybreak"
          | "disconnect";
        params: Record<string, string>;
        payload?: Record<string, unknown>;
      }> = [
        {
          endpoint: "setCredentialEnabled",
          params: { service },
          payload: { enabled: true },
        },
        { endpoint: "startDevice", params: { service } },
        { endpoint: "refreshClaudeSeat", params: { credentialId } },
        {
          endpoint: "connectClaudeSeat",
          params: {},
          payload: { service: "anthropic" },
        },
        { endpoint: "discoverModels", params, payload: { query: "claude" } },
        {
          endpoint: "upsertOrgKey",
          params: { ...params, provider: "openai" },
          payload: { secret: "sample" },
        },
        { endpoint: "removeOrgKey", params: { ...params, provider: "openai" } },
        { endpoint: "checkMediaUrl", params: { ...params, credentialId } },
        { endpoint: "moveToOrganization", params: { ...params, credentialId } },
        { endpoint: "testCredential", params: { ...params, credentialId } },
        { endpoint: "refreshDaybreak", params: { ...params, credentialId } },
        { endpoint: "disconnect", params: { service } },
      ];

      for (const action of actions) {
        const mutation = ApiClient.mutation("models", action.endpoint);
        registry.set(mutation, {
          params: action.params as { orgId: string },
          query: {},
          payload: action.payload ?? {},
          reactivityKeys: [key],
        });
        const result = yield* AtomRegistry.getResult(registry, mutation);
        assert.isDefined(result);
      }

      const discovered = rows(
        yield* AtomRegistry.getResult(
          registry,
          ApiClient.mutation("models", "discoverModels"),
        ),
      );
      assert.isAbove(discovered.length, 0);
      const afterDisconnect = connections(
        yield* AtomRegistry.getResult(registry, connectionsAtom, {
          suspendOnWaiting: true,
        }),
      );
      assert.isFalse(
        afterDisconnect.find((row) => row.service === service)?.enabled,
      );
    }),
  );

  it.effect("answers an unknown id with the declared 400", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const misses: ReadonlyArray<{
        endpoint:
          | "updateCredential"
          | "removeCredential"
          | "refreshClaudeSeat"
          | "refreshDaybreak"
          | "checkMediaUrl"
          | "moveToOrganization"
          | "testCredential"
          | "setConnectionModels"
          | "discoverModels"
          | "removeOrgKey"
          | "setCredentialEnabled"
          | "startDevice"
          | "pollDevice";
        params: Record<string, string>;
        payload?: Record<string, unknown>;
      }> = [
        {
          endpoint: "updateCredential",
          params: { ...params, credentialId: "cred_unknown" },
          payload: { name: "Renamed" },
        },
        {
          endpoint: "removeCredential",
          params: { ...params, credentialId: "cred_unknown" },
        },
        {
          endpoint: "refreshClaudeSeat",
          params: { credentialId: "cred_unknown" },
        },
        {
          endpoint: "refreshDaybreak",
          params: { ...params, credentialId: "cred_unknown" },
        },
        {
          endpoint: "checkMediaUrl",
          params: { ...params, credentialId: "cred_unknown" },
        },
        {
          endpoint: "moveToOrganization",
          params: { ...params, credentialId: "cred_unknown" },
        },
        {
          endpoint: "testCredential",
          params: { ...params, credentialId: "cred_unknown" },
        },
        {
          endpoint: "setConnectionModels",
          params: { ...params, credentialId: "cred_unknown" },
          payload: { models: [] },
        },
        {
          endpoint: "discoverModels",
          params,
          payload: { credentialId: "cred_unknown" },
        },
        {
          endpoint: "removeOrgKey",
          params: { ...params, provider: "unknown-provider" },
        },
        {
          endpoint: "setCredentialEnabled",
          params: { service: "unknown-service" },
          payload: { enabled: true },
        },
        { endpoint: "startDevice", params: { service: "unknown-service" } },
        {
          endpoint: "pollDevice",
          params: { attemptId: "device_attempt_unknown" },
        },
      ];

      for (const miss of misses) {
        const mutation = ApiClient.mutation("models", miss.endpoint);
        registry.set(mutation, {
          params: miss.params as { orgId: string },
          query: {},
          payload: miss.payload ?? {},
          reactivityKeys: [key],
        });
        const error = yield* AtomRegistry.getResult(registry, mutation).pipe(
          Effect.flip,
        );
        assert.instanceOf(error, InvalidRequest);
      }
    }),
  );
});
