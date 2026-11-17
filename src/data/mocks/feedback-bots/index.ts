import { Effect } from "effect";
import { fields } from "../db/MockDb.ts";
import { mockGroup } from "../mockGroup.ts";
import { sampleFeedbackBots } from "./fixtures.ts";

export const FeedbackBotsMock = mockGroup("feedback-bots", (handlers) =>
  Effect.succeed(
    handlers.handle("feedbackBots", ({ query }) => {
      const searchValue = fields(query).search;
      const search =
        typeof searchValue === "string" ? searchValue.toLowerCase() : undefined;
      return Effect.succeed(
        sampleFeedbackBots.filter(
          (bot) =>
            search === undefined || bot.login.toLowerCase().includes(search),
        ),
      );
    }),
  ),
);
