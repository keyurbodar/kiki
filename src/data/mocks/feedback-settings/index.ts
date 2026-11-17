import { Effect, Ref } from "effect";
import { fields } from "../db/MockDb.ts";
import { mockGroup } from "../mockGroup.ts";
import { sampleFeedbackSettings } from "./fixtures.ts";

type Row = Record<string, unknown>;

export const FeedbackSettingsMock = mockGroup("feedback-settings", (handlers) =>
  Effect.gen(function* () {
    const settings = yield* Ref.make<Row>(
      structuredClone({ ...sampleFeedbackSettings }) as Row,
    );
    return handlers
      .handle("feedbackSettings", () => Ref.get(settings))
      .handle("configureFeedback", ({ payload }) =>
        Ref.updateAndGet(settings, (current) => ({
          ...current,
          ...fields(payload),
        })),
      );
  }),
);
