import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { ApiClient } from "../../client/ApiClient.ts";
import { orgId, projects } from "../fixtures/world.ts";

const key = `cloud-access:${orgId}`;
const getAccess = ApiClient.query("cloud-access", "getCloudAccess", {
  params: { orgId },
  reactivityKeys: [key],
});
const createTarget = ApiClient.mutation(
  "cloud-access",
  "createCloudAccessTarget",
);
const updateTarget = ApiClient.mutation(
  "cloud-access",
  "updateCloudAccessTarget",
);
const deleteTarget = ApiClient.mutation(
  "cloud-access",
  "deleteCloudAccessTarget",
);

interface Access {
  readonly targets: ReadonlyArray<{
    readonly id: string;
    readonly name: string;
    readonly status: string;
  }>;
}

const names = (value: unknown) =>
  (value as Access).targets.map((row) => row.name);

describe("cloud-access mock", () => {
  it.effect("answers every cloud-access endpoint", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      assert.isAbove(
        names(yield* AtomRegistry.getResult(registry, getAccess)).length,
        0,
      );

      const check = ApiClient.mutation(
        "cloud-access",
        "checkCloudAccessTarget",
      );
      registry.set(check, {
        params: { orgId, targetId: "cat_sample_linear" },
        reactivityKeys: [key],
      });
      const result = yield* AtomRegistry.getResult(registry, check);
      assert.isTrue((result as { ok: boolean }).ok);
    }),
  );

  it.effect("refreshes cloud access after create, update and delete", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      registry.mount(getAccess);
      yield* AtomRegistry.getResult(registry, getAccess);

      registry.set(createTarget, {
        params: { orgId },
        payload: {
          name: "Acme CI",
          provider: "GitHub",
          projectId: projects.api.id,
          externalId: "acme-ci",
        },
        reactivityKeys: [key],
      });
      const created = yield* AtomRegistry.getResult(registry, createTarget);
      const id = (created as { id: string }).id;
      const afterCreate = yield* AtomRegistry.getResult(registry, getAccess, {
        suspendOnWaiting: true,
      });
      assert.include(names(afterCreate), "Acme CI");

      registry.set(updateTarget, {
        params: { orgId, targetId: id },
        payload: { name: "Acme integrations" },
        reactivityKeys: [key],
      });
      yield* AtomRegistry.getResult(registry, updateTarget);
      const afterUpdate = yield* AtomRegistry.getResult(registry, getAccess, {
        suspendOnWaiting: true,
      });
      assert.include(names(afterUpdate), "Acme integrations");
      assert.notInclude(names(afterUpdate), "Acme CI");

      registry.set(deleteTarget, {
        params: { orgId, targetId: id },
        reactivityKeys: [key],
      });
      yield* AtomRegistry.getResult(registry, deleteTarget);
      const afterDelete = yield* AtomRegistry.getResult(registry, getAccess, {
        suspendOnWaiting: true,
      });
      assert.notInclude(names(afterDelete), "Acme integrations");
    }),
  );
});
