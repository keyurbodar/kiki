import { Effect, Ref } from "effect";
import { fields } from "../db/MockDb.ts";
import { mockGroup } from "../mockGroup.ts";
import { sampleOrgDefaults } from "./fixtures.ts";

const text = (value: unknown) =>
  typeof value === "string" && value.length > 0 ? value : undefined;

export const ReviewDefaultSettingsMock = mockGroup(
  "reviewDefaultSettings",
  (handlers) =>
    Effect.gen(function* () {
      const defaults = yield* Ref.make({ ...sampleOrgDefaults });

      return handlers
        .handle("getOrg", () => Ref.get(defaults))
        .handle("setOrg", ({ payload }) =>
          Effect.gen(function* () {
            const input = fields(payload);
            const tier = text(input.tier) ?? null;
            const incrementalTier = text(input.incrementalTier) ?? null;
            const updated = {
              ...sampleOrgDefaults,
              tier,
              incrementalTier,
              effectiveTier: tier,
              effectiveIncrementalTier: incrementalTier,
            };
            yield* Ref.set(defaults, updated);
            return updated;
          }),
        );
    }),
);
