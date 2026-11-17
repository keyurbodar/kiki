import { isoMinutesAgo, people, threads } from "../fixtures/world.ts";

export const sampleHandoff = {
  id: "handoff_sample_1",
  threadId: threads.checkoutTest.id,
  status: "open",
  fromUserId: people.alex.id,
  toUserId: people.sam.id,
  reason: "Review the gateway timeout before the release.",
  summary: "Checkout is still retrying once on a gateway timeout.",
  instructions: "Run the CI suite, then merge the retry branch.",
  threadTitle: threads.checkoutTest.title,
  createdAt: isoMinutesAgo(18),
  updatedAt: isoMinutesAgo(8),
  canceledAt: null,
} as const;
