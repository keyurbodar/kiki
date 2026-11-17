import { Option } from "effect";
import { describe, expect, it } from "vitest";
import { decodeWebhookBatchPage } from "./batch";
import {
  formatBatchDuration,
  webhookBatchGroupLabel,
  webhookBatchStartedNoThread,
  webhookBatchStatusLabel,
} from "./labels";

const at = (iso: string) => new Date(iso);
const base = {
  status: "collecting" as const,
  dispatchAfter: at("2026-01-01T00:01:00Z"),
  runStatus: null,
  group: [],
  jamId: null,
};

describe("webhook batch labels", () => {
  it("names the group", () => {
    expect(webhookBatchGroupLabel([])).toBe("All events");
    expect(webhookBatchGroupLabel(["acme/web", 42, true])).toBe(
      "acme/web, 42, true",
    );
  });

  it("describes a collecting batch before and after its wait ends", () => {
    const before = at("2026-01-01T00:00:30Z").getTime();
    const after = at("2026-01-01T00:02:00Z").getTime();
    expect(webhookBatchStatusLabel(base, before)).toBe(
      "Waiting for more events",
    );
    expect(webhookBatchStatusLabel(base, after)).toBe("Starting soon");
  });

  it("describes queued and cancelled batches", () => {
    expect(webhookBatchStatusLabel({ ...base, status: "queued" }, 0)).toBe(
      "Starting soon",
    );
    expect(
      webhookBatchStatusLabel(
        { ...base, status: "queued", runStatus: "completed" },
        0,
      ),
    ).toBe("Completed");
    expect(webhookBatchStatusLabel({ ...base, status: "cancelled" }, 0)).toBe(
      "Cancelled",
    );
  });

  it("flags a started run that made no thread", () => {
    expect(
      webhookBatchStartedNoThread({
        ...base,
        status: "queued",
        runStatus: "skipped",
      }),
    ).toBe(true);
    expect(
      webhookBatchStartedNoThread({
        ...base,
        status: "queued",
        runStatus: "queued",
      }),
    ).toBe(false);
    expect(
      webhookBatchStartedNoThread({
        ...base,
        status: "queued",
        runStatus: "failed",
        jamId: "jam_sample",
      }),
    ).toBe(false);
  });

  it("formats durations like Capy", () => {
    expect(formatBatchDuration(-1)).toBe("—");
    expect(formatBatchDuration(0)).toBe("1s");
    expect(formatBatchDuration(45_000)).toBe("45s");
    expect(formatBatchDuration(60_000)).toBe("1m");
    expect(formatBatchDuration(90_000)).toBe("1m 30s");
    expect(formatBatchDuration(3_600_000)).toBe("1h");
    expect(formatBatchDuration(5_400_000)).toBe("1h 30m");
  });
});

describe("webhook batch page decoding", () => {
  it("decodes a page and rejects a malformed one", () => {
    const page = decodeWebhookBatchPage({
      items: [
        {
          id: "batch_sample_1",
          automationId: "automation_sample",
          triggerId: "trigger_sample",
          status: "collecting",
          group: ["acme/web"],
          eventCount: 3,
          byteCount: 2048,
          firstEventAt: "2026-01-01T00:00:00.000Z",
          lastEventAt: "2026-01-01T00:00:20.000Z",
          dispatchAfter: "2026-01-01T00:01:00.000Z",
          maxEvents: 20,
          maxWaitSeconds: 60,
          quietPeriodSeconds: null,
          closedAt: null,
          reason: null,
          runId: null,
          runStatus: null,
          jamId: null,
          failure: null,
        },
      ],
      cursor: null,
    });
    expect(Option.isSome(page)).toBe(true);
    const items = Option.getOrThrow(page).items;
    expect(items[0]?.dispatchAfter.toISOString()).toBe(
      "2026-01-01T00:01:00.000Z",
    );
    expect(Option.isNone(decodeWebhookBatchPage({ items: [{}] }))).toBe(true);
  });
});
