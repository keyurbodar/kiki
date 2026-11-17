import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { ApiClient } from "../../client/ApiClient.ts";
import { orgId, projects, serviceUsers } from "../fixtures/world.ts";

interface ServiceUser {
  readonly id: string;
  readonly name: string;
  readonly disabledAt?: string | null;
  readonly enabled?: boolean;
  readonly projectIds?: ReadonlyArray<string>;
  readonly subscriptionPlan?: string;
}

const key = `serviceUsers:${orgId}`;
const listAtom = ApiClient.query("serviceUsers", "list", {
  params: { orgId },
  reactivityKeys: [key],
});

const detailAtom = (serviceUserId: string) =>
  ApiClient.query("serviceUsers", "get", {
    params: { orgId, serviceUserId },
    reactivityKeys: [key],
  });

const run = (
  registry: Parameters<typeof AtomRegistry.getResult>[0],
  mutation: unknown,
  input: object,
) => {
  const writable = mutation as { set: (value: object) => void };
  registry.set(writable as never, { ...input, reactivityKeys: [key] });
  return AtomRegistry.getResult(registry, writable as never);
};

const rows = (value: unknown) => value as ReadonlyArray<ServiceUser>;
const detail = (value: unknown) => value as ServiceUser;

describe("serviceUsers mock", () => {
  it.effect("answers every serviceUsers endpoint and refreshes reads", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      registry.mount(listAtom as never);
      assert.isAbove(
        rows(yield* AtomRegistry.getResult(registry, listAtom)).length,
        0,
      );

      const existing = serviceUsers[0];
      assert.isDefined(existing);
      if (!existing) return;
      assert.strictEqual(
        detail(yield* AtomRegistry.getResult(registry, detailAtom(existing.id)))
          .id,
        existing.id,
      );

      const created = detail(
        yield* run(registry, ApiClient.mutation("serviceUsers", "create"), {
          params: { orgId },
          payload: { name: "Sample integration" },
        }),
      );
      assert.strictEqual(created.name, "Sample integration");
      assert.include(
        rows(
          yield* AtomRegistry.getResult(registry, listAtom, {
            suspendOnWaiting: true,
          }),
        ).map((row) => row.id),
        created.id,
      );

      yield* run(registry, ApiClient.mutation("serviceUsers", "update"), {
        params: { orgId, serviceUserId: created.id },
        payload: { description: "Refreshed description" },
      });
      assert.strictEqual(
        (
          detail(
            yield* AtomRegistry.getResult(registry, detailAtom(created.id), {
              suspendOnWaiting: true,
            }),
          ) as ServiceUser & { description: string }
        ).description,
        "Refreshed description",
      );

      const disabled = detail(
        yield* run(registry, ApiClient.mutation("serviceUsers", "disable"), {
          params: { orgId, serviceUserId: created.id },
        }),
      );
      assert.isFalse(disabled.enabled);
      assert.isNotEmpty(disabled.disabledAt);

      const restored = detail(
        yield* run(registry, ApiClient.mutation("serviceUsers", "restore"), {
          params: { orgId, serviceUserId: created.id },
        }),
      );
      assert.isTrue(restored.enabled);
      assert.isNull(restored.disabledAt);

      const withProjects = detail(
        yield* run(
          registry,
          ApiClient.mutation("serviceUsers", "replaceProjects"),
          {
            params: { orgId, serviceUserId: created.id },
            payload: { projectIds: [projects.web.id] },
          },
        ),
      );
      assert.deepStrictEqual(withProjects.projectIds, [projects.web.id]);

      const subscribed = detail(
        yield* run(
          registry,
          ApiClient.mutation("serviceUsers", "setSubscription"),
          {
            params: { orgId, serviceUserId: created.id },
            payload: { plan: "enterprise" },
          },
        ),
      );
      assert.strictEqual(subscribed.subscriptionPlan, "enterprise");
      assert.strictEqual(
        detail(
          yield* AtomRegistry.getResult(registry, detailAtom(created.id), {
            suspendOnWaiting: true,
          }),
        ).subscriptionPlan,
        "enterprise",
      );
    }),
  );
});
