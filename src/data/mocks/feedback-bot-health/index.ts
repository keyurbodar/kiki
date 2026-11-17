import { Effect } from "effect";
import { fields } from "../db/MockDb.ts";
import { mockGroup } from "../mockGroup.ts";
import { sampleFeedbackBotHealth } from "./fixtures.ts";

export const FeedbackBotHealthMock = mockGroup(
  "feedback-bot-health",
  (handlers) =>
    Effect.succeed(
      handlers.handle("feedbackBotHealth", ({ query }) => {
        const value = fields(query).logins;
        const logins = Array.isArray(value)
          ? value.flatMap((item) =>
              typeof item === "string" ? item.split(",") : [],
            )
          : typeof value === "string"
            ? value.split(",")
            : [];
        return Effect.succeed(
          sampleFeedbackBotHealth.filter(
            (bot) => logins.length === 0 || logins.includes(bot.login),
          ),
        );
      }),
    ),
);
