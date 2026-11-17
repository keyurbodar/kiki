import { isoMinutesAgo, people, threads, world } from "../fixtures/world.ts";

export const sampleRestore = {
  id: "restore_sample_1",
  orgId: world.org.id,
  status: "ready",
  snapshotAt: isoMinutesAgo(2 * 60),
  items: [
    {
      kind: "thread",
      id: threads.checkoutTest.id,
      title: threads.checkoutTest.title,
      deletedAt: isoMinutesAgo(3 * 60),
    },
    {
      kind: "issue",
      id: world.issues[1]?.id ?? "iss_sample_2",
      title: world.issues[1]?.title ?? "Checkout test times out on CI",
      deletedAt: isoMinutesAgo(4 * 60),
    },
    {
      kind: "pull",
      id: world.pulls[1]?.id ?? "pr_sample_131",
      title: world.pulls[1]?.title ?? "Retry checkout on gateway timeouts",
      deletedAt: isoMinutesAgo(5 * 60),
    },
  ],
  requestedBy: people.alex.id,
  createdAt: isoMinutesAgo(2 * 60),
} as const;
