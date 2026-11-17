import { Effect, Ref } from "effect";
import { fields } from "../db/MockDb.ts";
import { mockGroup } from "../mockGroup.ts";
import { sampleFeedbackSettings } from "./fixtures.ts";

const text = (value: unknown) =>
  typeof value === "string" && value.length > 0 ? value : undefined;

export const FeedbackSettingsMock = mockGroup("feedback-settings", (handlers) =>
  Effect.gen(function* () {
    const settings = yield* Ref.make({ ...sampleFeedbackSettings });

    return handlers
      .handle("feedbackSettings", () => Ref.get(settings))
      .handle("configureFeedback", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const current = yield* Ref.get(settings);
          const allowlist = Array.isArray(input.botAllowlist)
            ? input.botAllowlist.filter(
                (item): item is string => typeof item === "string",
              )
            : current.botAllowlist;
          const updated = {
            ...sampleFeedbackSettings,
            ...current,
            ...(text(input.humanMode)
              ? { humanMode: text(input.humanMode) }
              : {}),
            ...(text(input.botMode) ? { botMode: text(input.botMode) } : {}),
            ...(text(input.conflictMode)
              ? { conflictMode: text(input.conflictMode) }
              : {}),
            ...(text(input.ciMode) ? { ciMode: text(input.ciMode) } : {}),
            ...(typeof input.conflictMaxThreadAgeDays === "number"
              ? { conflictMaxThreadAgeDays: input.conflictMaxThreadAgeDays }
              : {}),
            ...(typeof input.prDraftDefault === "boolean"
              ? { prDraftDefault: input.prDraftDefault }
              : {}),
            ...(typeof input.prBadge === "boolean"
              ? { prBadge: input.prBadge }
              : {}),
            botAllowlist: allowlist,
          };
          yield* Ref.set(settings, updated);
          return updated;
        }),
      );
  }),
);
