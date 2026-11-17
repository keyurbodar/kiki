import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { ApiClient } from "../../client/ApiClient.ts";
import { orgId } from "../fixtures/world.ts";

interface Label {
  readonly id: string;
  readonly name: string;
  readonly color: string;
}

const key = `issue-labels:${orgId}`;

const labelsAtom = ApiClient.query("issue-labels", "labels", {
  params: { orgId },
  reactivityKeys: [key],
});
const createLabel = ApiClient.mutation("issue-labels", "createLabel");
const deleteLabel = ApiClient.mutation("issue-labels", "deleteLabel");

const names = (value: unknown) =>
  (value as ReadonlyArray<Label>).map((label) => label.name);

describe("issue-labels mock", () => {
  it.effect("lists the org's labels", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const labels = yield* AtomRegistry.getResult(registry, labelsAtom);
      assert.deepStrictEqual(names(labels), [
        "Bug",
        "Feature",
        "Docs",
        "Performance",
      ]);
    }),
  );

  it.effect("refetches the list after create and delete mutations", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      registry.mount(labelsAtom);
      yield* AtomRegistry.getResult(registry, labelsAtom);

      registry.set(createLabel, {
        params: { orgId },
        payload: { name: "Security", color: "danger" },
        reactivityKeys: [key],
      });
      const created = yield* AtomRegistry.getResult(registry, createLabel);
      const afterCreate = yield* AtomRegistry.getResult(registry, labelsAtom, {
        suspendOnWaiting: true,
      });
      assert.include(names(afterCreate), "Security");

      registry.set(deleteLabel, {
        params: { orgId, labelId: (created as Label).id },
        reactivityKeys: [key],
      });
      yield* AtomRegistry.getResult(registry, deleteLabel);
      const afterDelete = yield* AtomRegistry.getResult(registry, labelsAtom, {
        suspendOnWaiting: true,
      });
      assert.notInclude(names(afterDelete), "Security");
    }),
  );
});
