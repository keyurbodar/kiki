import { Effect, Ref } from "effect";
import { fields } from "../db/MockDb.ts";
import { mockGroup } from "../mockGroup.ts";
import { type ReviewTier, sampleOrgDefaults } from "./fixtures.ts";

const tiers: ReadonlyArray<ReviewTier> = ["low", "medium", "high"];
const tierOf = (value: unknown) => tiers.find((tier) => tier === value) ?? null;

export const ReviewDefaultSettingsMock = mockGroup(
  "reviewDefaultSettings",
  (handlers) =>
    Effect.gen(function* () {
      const defaults = yield* Ref.make({ ...sampleOrgDefaults });

      return handlers
        .handle("getOrg", () => Ref.get(defaults))
        .handle("setOrg", ({ payload }) => {
          const input = fields(payload);
          return Ref.updateAndGet(defaults, (current) => {
            const tier = "tier" in input ? tierOf(input.tier) : current.tier;
            const incrementalTier =
              "incrementalTier" in input
                ? input.incrementalTier === "flex"
                  ? "flex"
                  : tierOf(input.incrementalTier)
                : current.incrementalTier;
            const effectiveTier = tier ?? "medium";
            return {
              ...current,
              tier,
              incrementalTier,
              effectiveTier,
              effectiveIncrementalTier:
                incrementalTier === null || incrementalTier === "flex"
                  ? effectiveTier
                  : incrementalTier,
            };
          });
        });
    }),
);
