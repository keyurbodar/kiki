import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MessageQueue, QueuedMarker, showQueuedMarker } from "./message-queue";
import {
  type QueueRowData,
  queueRowKey,
  queueRowText,
  reconcileQueue,
  uploadProgress,
} from "./queue";

afterEach(cleanup);

const row = (id: string, text: string, extra: Partial<QueueRowData> = {}) =>
  ({
    id,
    text,
    mentions: [],
    delivery: "queue",
    actor: { type: "user", userId: "user_alex" },
    files: [],
    ...extra,
  }) satisfies QueueRowData;

describe("queue helpers", () => {
  it("keys optimistic rows by client key", () => {
    expect(queueRowKey({ id: "evt_1" })).toBe("id:evt_1");
    expect(queueRowKey({ id: null, clientKey: "c1" })).toBe("client:c1");
  });

  it("swaps excerpt mentions for their labels", () => {
    expect(
      queueRowText({
        text: "see quoted bit and other bit",
        mentions: [
          {
            kind: "excerpt",
            start: 4,
            end: 14,
            text: "quoted bit",
            label: "[1]",
          },
          {
            kind: "excerpt",
            start: 19,
            end: 28,
            text: "other bit",
            label: "[2]",
          },
          { kind: "file", start: 0, end: 3, text: "see", label: "x" },
        ],
      }),
    ).toBe("see [1] and [2]");
  });

  it("averages progress over active uploads", () => {
    expect(uploadProgress([])).toBeUndefined();
    expect(
      uploadProgress([
        { status: "uploading", progress: 40 },
        { status: "uploading", progress: 61 },
        { status: "uploaded", progress: 100 },
      ]),
    ).toBe(50);
  });

  it("keeps leaving rows in place with their reason", () => {
    const state = { exits: new Map(), shown: new Map(), order: [] as string[] };
    const a = row("a", "first");
    const b = row("b", "second");
    reconcileQueue(state, [a, b], new Map(), true);
    const leaving = reconcileQueue(
      state,
      [b],
      new Map([["id:a", "send"]]),
      true,
    );
    expect(leaving.map((entry) => [entry.key, entry.leaving])).toEqual([
      ["id:a", "send"],
      ["id:b", undefined],
    ]);
    const promoted = reconcileQueue(state, [], new Map(), true);
    expect(promoted.map((entry) => [entry.key, entry.leaving])).toEqual([
      ["id:a", "send"],
      ["id:b", "promote"],
    ]);
    const reduced = reconcileQueue(
      { exits: new Map(), shown: new Map(), order: [] },
      [a],
      new Map(),
      false,
    );
    expect(reduced).toHaveLength(1);
  });
});

describe("MessageQueue", () => {
  it("shows rows, the queued count and acts on Send now", () => {
    const act = vi.fn();
    render(
      <MessageQueue
        rows={[row("a", "Run the tests"), row("b", "Then open a PR")]}
        viewerUserId="user_alex"
        actions={{ departing: new Map(), act }}
      />,
    );
    expect(screen.getByText("Run the tests")).toBeTruthy();
    expect(screen.getByText("2 queued")).toBeTruthy();
    const sendButtons = screen.getAllByLabelText("Send now");
    const firstSend = sendButtons[0];
    if (firstSend === undefined) throw new Error("no send button");
    fireEvent.click(firstSend);
    expect(act).toHaveBeenCalledWith(
      expect.objectContaining({ id: "a" }),
      "send",
    );
  });

  it("shows who a reply quotes and drops it from the bar", () => {
    const onCancel = vi.fn();
    render(
      <MessageQueue
        rows={[]}
        actions={{ departing: new Map(), act: vi.fn() }}
        replying={{
          name: "Alex Morgan",
          text: "Add a dark mode toggle",
          onCancel,
        }}
      >
        <textarea aria-label="composer" />
      </MessageQueue>,
    );
    expect(screen.getByText("Replying to")).toBeTruthy();
    expect(screen.getByText("Add a dark mode toggle")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Cancel reply"));
    expect(onCancel).toHaveBeenCalled();
  });
});

describe("QueuedMarker", () => {
  it("shows after a minute unless the thread needs the person", () => {
    const since = new Date("2026-03-02T09:00:00Z");
    expect(
      showQueuedMarker(since, false, new Date("2026-03-02T09:00:59Z")),
    ).toBe(false);
    expect(
      showQueuedMarker(since, false, new Date("2026-03-02T09:01:00Z")),
    ).toBe(true);
    expect(
      showQueuedMarker(since, true, new Date("2026-03-02T09:05:00Z")),
    ).toBe(false);
  });

  it("renders the queued-marker slot", () => {
    const { container } = render(
      <QueuedMarker
        queuedSince={new Date("2026-03-02T09:00:00Z")}
        claudeCode
        now={new Date("2026-03-02T09:02:00Z")}
      />,
    );
    const marker = container.querySelector('[data-slot="queued-marker"]');
    expect(marker?.textContent).toContain(
      "Queued for a Claude Code slot since",
    );
  });
});
