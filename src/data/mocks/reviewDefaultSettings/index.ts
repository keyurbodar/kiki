import { Effect, Ref } from "effect";
import { fields } from "../db/MockDb.ts";
import { projects } from "../fixtures/world.ts";
import { mockGroup } from "../mockGroup.ts";
import { sampleDefaults, updatedAt } from "./fixtures.ts";

type Settings = Record<string, unknown>;

const flag = (value: unknown, fallback: boolean) =>
  typeof value === "boolean" ? value : fallback;

const text = (value: unknown, fallback: string) =>
  typeof value === "string" && value.length > 0 ? value : fallback;

const count = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

export const ReviewDefaultSettingsMock = mockGroup(
  "reviewDefaultSettings",
  (handlers) =>
    Effect.gen(function* () {
      const defaults = yield* Ref.make<Settings>({ ...sampleDefaults });

      return handlers
        .handle("getOrg", () =>
          Effect.gen(function* () {
            const current = yield* Ref.get(defaults);
            const rows = Object.values(projects);
            const project = rows.find(
              (row) => row.id === current.defaultProjectId,
            );
            return {
              ...current,
              defaultProject: project ?? { id: current.defaultProjectId },
            };
          }),
        )
        .handle("setOrg", ({ payload }) => {
          const input = fields(payload);
          return Ref.update(defaults, (current) => ({
            ...current,
            ...(input.autoReviewEnabled === undefined
              ? {}
              : { autoReviewEnabled: flag(input.autoReviewEnabled, false) }),
            ...(input.reviewDraftPulls === undefined
              ? {}
              : { reviewDraftPulls: flag(input.reviewDraftPulls, false) }),
            ...(input.reviewerCount === undefined
              ? {}
              : { reviewerCount: count(input.reviewerCount, 1) }),
            ...(input.requireApproval === undefined
              ? {}
              : { requireApproval: flag(input.requireApproval, false) }),
            ...(input.dismissOnPush === undefined
              ? {}
              : { dismissOnPush: flag(input.dismissOnPush, false) }),
            ...(input.model === undefined
              ? {}
              : { model: text(input.model, "") }),
            ...(input.defaultProjectId === undefined
              ? {}
              : { defaultProjectId: text(input.defaultProjectId, "") }),
            ...(input.instruction === undefined
              ? {}
              : { instruction: text(input.instruction, "") }),
            updatedAt: updatedAt(),
          })).pipe(Effect.flatMap(() => Ref.get(defaults)));
        });
    }),
);
