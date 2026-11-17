import { sampleBots } from "../feedback-bots/fixtures.ts";
import { isoMinutesAgo, threads } from "../fixtures/world.ts";

export const sampleHealth = sampleBots.map((bot, index) => ({
  botId: bot.id,
  name: bot.name,
  status:
    bot.status === "paused" ? "paused" : index === 1 ? "degraded" : "healthy",
  lastSeenAt: isoMinutesAgo(index === 1 ? 46 : index === 2 ? 180 : 2),
  successRate: index === 1 ? 0.91 : index === 2 ? 0.98 : 0.99,
  pendingJobs: index === 1 ? 3 : index === 2 ? 0 : 1,
  processedToday: 24 - index * 7,
  threadId: bot.threadIds[0] ?? threads.checkoutTest.id,
  message:
    index === 1
      ? "Responses are slower than usual."
      : index === 2
        ? "Paused by the owner."
        : "All checks passed.",
}));
