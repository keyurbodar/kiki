import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AutomationWebhookBatch } from "./batch";
import { WebhookBatchList } from "./webhook-batch-list";

afterEach(cleanup);

const batch = new AutomationWebhookBatch({
  id: "batch_sample_1",
  automationId: "automation_sample",
  triggerId: "trigger_sample",
  status: "collecting",
  group: ["acme/web"],
  eventCount: 1,
  byteCount: 2048,
  firstEventAt: new Date("2026-01-01T00:00:00Z"),
  lastEventAt: new Date("2026-01-01T00:00:00Z"),
  dispatchAfter: new Date("2026-01-01T00:01:00Z"),
  maxEvents: 20,
  maxWaitSeconds: 60,
  quietPeriodSeconds: 30,
  closedAt: null,
  reason: null,
  runId: null,
  runStatus: null,
  jamId: null,
  failure: null,
});
const now = new Date("2026-01-01T00:00:10Z").getTime();

describe("WebhookBatchList", () => {
  it("shows the empty copy", () => {
    render(
      <WebhookBatchList
        items={[]}
        now={now}
        onFlush={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText("No events in this view")).toBeTruthy();
  });

  it("lists a collecting batch and starts it", () => {
    const onFlush = vi.fn();
    render(
      <WebhookBatchList
        items={[batch]}
        now={now}
        onFlush={onFlush}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText("1 event")).toBeTruthy();
    expect(screen.getByText("Waiting for more events")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Start now" }));
    expect(onFlush).toHaveBeenCalledWith(batch);
  });

  it("disables actions while a batch request is pending", () => {
    render(
      <WebhookBatchList
        items={[batch]}
        now={now}
        pendingId="batch_other"
        onFlush={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    const start = screen.getByRole("button", { name: "Start now" });
    expect(start.hasAttribute("disabled")).toBe(true);
  });

  it("opens the batch details", () => {
    render(
      <WebhookBatchList
        items={[batch]}
        now={now}
        onFlush={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Details for acme/web" }),
    );
    expect(screen.getByText("Wait ends")).toBeTruthy();
    expect(screen.getByText("Without new events")).toBeTruthy();
    expect(screen.getByText("30s")).toBeTruthy();
    expect(screen.getByText('"acme/web"')).toBeTruthy();
  });
});
