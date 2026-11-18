import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { decodeCatalog } from "@/features/settings-models/model-routing/decode";
import { ApiClient } from "../client/ApiClient";
import { orgId } from "../mocks/fixtures/world";
import { agentModelsAtom } from "./agent-context";
import { modelsAtom } from "./models";

/**
 * One endpoint, one shape. `models` changed from `{ models, credentials, services }`
 * to the bare array Capy serves, and an atom that still decoded the envelope
 * silently emptied the Instructions preview and its Model picker. These cases read
 * the mock's own response through every consumer, so a shape change fails here
 * rather than in a settings test four PRs later.
 */
describe("the models catalog's shape", () => {
  const listAtom = ApiClient.query("models", "list", {
    query: {},
    reactivityKeys: ["models:shape"],
  });

  it.effect("is the bare array Capy serves", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const list = yield* AtomRegistry.getResult(registry, listAtom);
      assert.isArray(list);
      assert.isAbove((list as ReadonlyArray<unknown>).length, 0);
    }),
  );

  it.effect("decodes through the agent-context atom the preview reads", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const models = yield* AtomRegistry.getResult(registry, agentModelsAtom);
      assert.isAbove(models.length, 0);
      assert.isString(models[0]?.id);
      assert.isString(models[0]?.name);
    }),
  );

  it.effect("decodes through the picker atom", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const models = yield* AtomRegistry.getResult(registry, modelsAtom(orgId));
      assert.isAbove((models as ReadonlyArray<unknown>).length, 0);
    }),
  );

  it.effect("decodes through the settings-models catalog reader", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const raw = yield* AtomRegistry.getResult(registry, listAtom);
      const catalog = decodeCatalog(raw);
      assert.isAbove(catalog.length, 0);
    }),
  );
});
