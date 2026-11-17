import { Effect, Ref } from "effect";
import { fields } from "../db/MockDb.ts";
import { projects } from "../fixtures/world.ts";
import { mockGroup } from "../mockGroup.ts";
import { sampleFeedbackSettings, updatedAt } from "./fixtures.ts";

type Settings = Record<string, unknown>;

const flag = (value: unknown, fallback: boolean) =>
  typeof value === "boolean" ? value : fallback;

const text = (value: unknown, fallback: string) =>
  typeof value === "string" && value.length > 0 ? value : fallback;

const number = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

export const FeedbackSettingsMock = mockGroup("feedback-settings", (handlers) =>
  Effect.gen(function* () {
    const settings = yield* Ref.make<Settings>({ ...sampleFeedbackSettings });

    const withProject = (
      current: Settings,
      rows: ReadonlyArray<{ id: string; name: string }>,
    ) => ({
      ...current,
      project: rows.find((row) => row.id === current.projectId) ?? null,
    });

    return handlers
      .handle("feedbackSettings", () =>
        Effect.gen(function* () {
          const current = yield* Ref.get(settings);
          const rows = Object.values(projects);
          return withProject(current, rows);
        }),
      )
      .handle("configureFeedback", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          yield* Ref.update(settings, (current) => ({
            ...current,
            ...(input.enabled === undefined
              ? {}
              : { enabled: flag(input.enabled, false) }),
            ...(input.channel === undefined
              ? {}
              : { channel: text(input.channel, "thread") }),
            ...(input.destinationId === undefined
              ? {}
              : { destinationId: text(input.destinationId, "") }),
            ...(input.projectId === undefined
              ? {}
              : { projectId: text(input.projectId, "") }),
            ...(input.prompt === undefined
              ? {}
              : { prompt: text(input.prompt, "") }),
            ...(input.notifyOwner === undefined
              ? {}
              : { notifyOwner: flag(input.notifyOwner, false) }),
            ...(input.weeklyDigest === undefined
              ? {}
              : { weeklyDigest: flag(input.weeklyDigest, false) }),
            ...(input.responseSlaMinutes === undefined
              ? {}
              : { responseSlaMinutes: number(input.responseSlaMinutes, 60) }),
            updatedAt: updatedAt(),
          }));
          const current = yield* Ref.get(settings);
          const rows = Object.values(projects);
          return withProject(current, rows);
        }),
      );
  }),
);
