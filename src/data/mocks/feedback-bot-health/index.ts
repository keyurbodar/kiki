import { Effect } from "effect";
import { mockGroup } from "../mockGroup.ts";
import { sampleHealth } from "./fixtures.ts";

const queryText = (query: Record<string, unknown>, key: string) => {
  const value = query[key];
  if (Array.isArray(value)) return typeof value[0] === "string" ? value[0] : "";
  return typeof value === "string" ? value : "";
};

export const FeedbackBotHealthMock = mockGroup(
  "feedback-bot-health",
  (handlers) =>
    Effect.succeed(
      handlers.handle("feedbackBotHealth", ({ query }) => {
        const botId = queryText(query, "botId");
        return Effect.succeed(
          sampleHealth.filter((row) => !botId || row.botId === botId),
        );
      }),
    ),
);
