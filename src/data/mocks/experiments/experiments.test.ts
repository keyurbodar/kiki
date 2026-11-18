import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { InvalidRequest } from "../../api/schemas/errors.ts";
import { ApiClient } from "../../client/ApiClient.ts";
import { orgId } from "../fixtures/world.ts";

interface Experiment {
  readonly feature: string;
  readonly name: string;
  readonly enabled: boolean;
  readonly updatedAt: string;
  readonly updatedBy: string;
}

const key = `experiments:${orgId}`;
const params = { orgId };

const listAtom = ApiClient.query("experiments", "listExperiments", {
  params,
  reactivityKeys: [key],
});
const setExperiment = ApiClient.mutation("experiments", "setExperiment");

const rows = (value: unknown) => value as ReadonlyArray<Experiment>;
const byFeature = (value: unknown, feature: string) =>
  rows(value).find((row) => row.feature === feature);

describe("experiments mock", () => {
  it.effect("lists the org's experiments", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const experiments = rows(
        yield* AtomRegistry.getResult(registry, listAtom),
      );
      assert.isAbove(experiments.length, 0);
      for (const experiment of experiments) {
        assert.isString(experiment.feature);
        assert.isString(experiment.name);
        assert.isBoolean(experiment.enabled);
        assert.isString(experiment.updatedAt);
        assert.isString(experiment.updatedBy);
      }
      assert.isTrue(byFeature(experiments, "review-insights")?.enabled);
    }),
  );

  it.effect("sets an experiment and refreshes the list", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      registry.mount(listAtom);
      yield* AtomRegistry.getResult(registry, listAtom);

      registry.set(setExperiment, {
        params: { ...params, feature: "review-insights" },
        payload: { enabled: false },
        reactivityKeys: [key],
      });
      const updated = (yield* AtomRegistry.getResult(
        registry,
        setExperiment,
      )) as Experiment;
      assert.equal(updated.feature, "review-insights");
      assert.isFalse(updated.enabled);

      const after = yield* AtomRegistry.getResult(registry, listAtom, {
        suspendOnWaiting: true,
      });
      assert.isFalse(byFeature(after, "review-insights")?.enabled);

      const create = ApiClient.mutation("experiments", "setExperiment");
      registry.set(create, {
        params: { ...params, feature: "new-feature" },
        payload: { enabled: true, name: "New feature" },
        reactivityKeys: [key],
      });
      yield* AtomRegistry.getResult(registry, create);
    }),
  );

  it.effect("answers an unknown feature with the declared 400", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      registry.set(setExperiment, {
        params: { ...params, feature: "no-such-experiment" },
        payload: { enabled: true },
        reactivityKeys: [key],
      });
      const error = yield* AtomRegistry.getResult(registry, setExperiment).pipe(
        Effect.flip,
      );
      assert.instanceOf(error, InvalidRequest);
    }),
  );
});
