import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { ApiClient } from "../../client/ApiClient.ts";
import { orgId, projects } from "../fixtures/world.ts";

interface ServiceUser {
  readonly id: string;
  readonly name: string;
  readonly projectIds: ReadonlyArray<string>;
  readonly disabledAt: string | null;
}

const key = `serviceUsers:${orgId}`;
const listAtom = ApiClient.query("serviceUsers", "list", {
  params: { orgId },
  reactivityKeys: [key],
});
const getAtom = ApiClient.query("serviceUsers", "get", {
  params: { orgId, serviceUserId: "svc_sample_release" },
  reactivityKeys: [key],
});

describe("serviceUsers mock", () => {
  it.effect("lists and gets service users with project access", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const rows = (yield* AtomRegistry.getResult(
        registry,
        listAtom,
      )) as ReadonlyArray<ServiceUser>;
      const detail = (yield* AtomRegistry.getResult(
        registry,
        getAtom,
      )) as ServiceUser;
      assert.strictEqual(rows[0]?.name, "Release bot");
      assert.include(detail.projectIds, projects.web.id);
      assert.isNull(detail.disabledAt);
    }),
  );

  it.effect(
    "creates, updates, disables, restores and scopes a service user",
    () =>
      Effect.gen(function* () {
        const registry = AtomRegistry.make();
        const create = ApiClient.mutation("serviceUsers", "create");
        registry.set(create, {
          params: { orgId },
          payload: { name: "Docs publisher", description: "Publishes guides." },
          reactivityKeys: [key],
        });
        const created = (yield* AtomRegistry.getResult(
          registry,
          create,
        )) as ServiceUser;
        assert.strictEqual(created.name, "Docs publisher");

        const update = ApiClient.mutation("serviceUsers", "update");
        registry.set(update, {
          params: { orgId, serviceUserId: "svc_sample_release" },
          payload: { name: "Docs bot" },
          reactivityKeys: [key],
        });
        yield* AtomRegistry.getResult(registry, update);

        const replace = ApiClient.mutation("serviceUsers", "replaceProjects");
        registry.set(replace, {
          params: { orgId, serviceUserId: "svc_sample_release" },
          payload: { projectIds: [projects.docs.id] },
          reactivityKeys: [key],
        });
        yield* AtomRegistry.getResult(registry, replace);

        const disable = ApiClient.mutation("serviceUsers", "disable");
        registry.set(disable, {
          params: { orgId, serviceUserId: "svc_sample_release" },
          reactivityKeys: [key],
        });
        const disabled = (yield* AtomRegistry.getResult(
          registry,
          disable,
        )) as ServiceUser;
        assert.isNotNull(disabled.disabledAt);

        const restore = ApiClient.mutation("serviceUsers", "restore");
        registry.set(restore, {
          params: { orgId, serviceUserId: "svc_sample_release" },
          reactivityKeys: [key],
        });
        const restored = (yield* AtomRegistry.getResult(
          registry,
          restore,
        )) as ServiceUser;
        assert.isNull(restored.disabledAt);

        const after = (yield* AtomRegistry.getResult(registry, listAtom, {
          suspendOnWaiting: true,
        })) as ReadonlyArray<ServiceUser>;
        assert.deepStrictEqual(
          after.find((row) => row.id === "svc_sample_release")?.projectIds,
          [projects.docs.id],
        );
      }),
  );

  it.effect("saves a subscription for the sample service user", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const subscription = ApiClient.mutation(
        "serviceUsers",
        "setSubscription",
      );
      registry.set(subscription, {
        params: { orgId, serviceUserId: "svc_sample_release" },
        payload: { name: "Release feed", event: "pull.merged" },
        reactivityKeys: [key],
      });
      const value = yield* AtomRegistry.getResult(registry, subscription);
      assert.strictEqual((value as { name: string }).name, "Release feed");
    }),
  );
});
