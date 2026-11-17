import { describe, expect, it } from "vitest";
import {
  batchDismissals,
  type CrewAsk,
  crewAsksLabel,
  crewAsksShortLabel,
  dismissCrewAsks,
  groupCrewAsks,
} from "./crew-asks-model";

const ask = (overrides: Partial<CrewAsk> = {}): CrewAsk => ({
  threadId: "thread_a",
  key: "ask_1",
  causeKey: null,
  text: "Need a decision on Thread A",
  askedAt: new Date("2026-01-01T00:00:00.000Z"),
  stale: false,
  ...overrides,
});

describe("groupCrewAsks", () => {
  it("filters stale and captain asks and sorts newest first", () => {
    const items = groupCrewAsks(
      [
        ask({
          threadId: "thread_a",
          key: "old",
          askedAt: new Date("2026-01-01T00:00:00Z"),
        }),
        ask({
          threadId: "captain",
          key: "own",
          askedAt: new Date("2026-01-05T00:00:00Z"),
        }),
        ask({
          threadId: "thread_b",
          key: "stale",
          stale: true,
          askedAt: new Date("2026-01-06T00:00:00Z"),
        }),
        ask({
          threadId: "thread_b",
          key: "new",
          askedAt: new Date("2026-01-04T00:00:00Z"),
        }),
      ],
      [
        { id: "thread_a", title: "Thread A" },
        { id: "thread_b", title: "Thread B" },
      ],
      "captain",
    );
    expect(items.map((item) => item.id)).toEqual([
      "thread_b:new",
      "thread_a:old",
    ]);
  });

  it("groups asks by cause and titles the group with the thread count", () => {
    const items = groupCrewAsks(
      [
        ask({ threadId: "thread_a", key: "one", causeKey: "cause" }),
        ask({ threadId: "thread_b", key: "two", causeKey: "cause" }),
      ],
      [
        { id: "thread_a", title: "Thread A" },
        { id: "thread_b", title: "Thread B" },
      ],
      "captain",
    );
    expect(items).toHaveLength(1);
    expect(items[0]?.title).toBe("2 threads");
    expect(items[0]?.asks).toEqual([
      { threadId: "thread_a", key: "one" },
      { threadId: "thread_b", key: "two" },
    ]);
  });

  it("falls back to an untitled thread and preview text", () => {
    const items = groupCrewAsks(
      [ask({ text: null })],
      [{ id: "thread_a", title: null, preview: "Preview text" }],
      "captain",
    );
    expect(items[0]?.title).toBe("Untitled thread");
    expect(items[0]?.text).toBe("Preview text");
  });
});

describe("batchDismissals", () => {
  it("splits batches after 100 distinct thread ids", () => {
    const asks = Array.from({ length: 101 }, (_, index) => ({
      threadId: `thread_${index}`,
      key: "ask_1",
    }));
    const batches = batchDismissals(asks);
    expect(batches).toHaveLength(2);
    expect(batches[0]?.threadIds.size).toBe(100);
    expect(batches[1]?.threadIds).toEqual(new Set(["thread_100"]));
  });
});

describe("dismissCrewAsks", () => {
  const askKeys = Array.from({ length: 101 }, (_, index) => ({
    threadId: `thread_${index}`,
    key: "ask_1",
  }));

  it("keeps earlier dismissals when a later batch fails", async () => {
    let call = 0;
    const onDismiss = async (batch: {
      threadIds: string[];
      keys: string[];
    }) => {
      call += 1;
      if (call === 2) throw new Error("offline");
      return batch.threadIds.map((threadId) => ({
        threadId,
        key: batch.keys[0] ?? "",
      }));
    };
    const { dismissed, failed } = await dismissCrewAsks(askKeys, onDismiss);
    expect(failed).toBe(true);
    expect(dismissed).toHaveLength(100);
    expect(dismissed[0]).toEqual({ threadId: "thread_0", key: "ask_1" });
  });

  it("reports no failure when every batch succeeds", async () => {
    const onDismiss = async (batch: { threadIds: string[] }) =>
      batch.threadIds.map((threadId) => ({ threadId, key: "ask_1" }));
    const { dismissed, failed } = await dismissCrewAsks(askKeys, onDismiss);
    expect(failed).toBe(false);
    expect(dismissed).toHaveLength(101);
  });
});

describe("crew ask labels", () => {
  it("uses singular and plural labels", () => {
    expect(crewAsksLabel(1)).toBe("1 crew ask");
    expect(crewAsksLabel(2)).toBe("2 crew asks");
    expect(crewAsksShortLabel(1)).toBe("1 ask");
    expect(crewAsksShortLabel(2)).toBe("2 asks");
  });
});
