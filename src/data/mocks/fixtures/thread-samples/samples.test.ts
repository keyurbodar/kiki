import { Schema } from "effect";
import { describe, expect, it } from "vitest";
import { EVENT_KINDS, EventRow, type EventRowEncoded } from "@/data/events";
import { NOTIFICATION_KEYS } from "@/data/events/payloads";
import { MARKER_KINDS } from "@/data/events/rows";
import { samples } from "./index";

const decodeEvent = Schema.decodeUnknownSync(EventRow);

type EncodedRow = EventRowEncoded & { payload: Record<string, unknown> };
const payloadOf = (event: EventRowEncoded) => (event as EncodedRow).payload;
const toolNames = (event: EventRowEncoded) => {
  const blocks = payloadOf(event).blocks;
  if (!Array.isArray(blocks)) return [];
  return blocks.flatMap((block: { toolName?: string }) =>
    typeof block.toolName === "string" ? [block.toolName] : [],
  );
};

const toolUseNames = samples.flatMap((sample) =>
  sample.events.flatMap((event) =>
    toolNames(event).flatMap((name) =>
      ["ask_user", "request_environment", "expose_port"].includes(name)
        ? [name]
        : [],
    ),
  ),
);

const summaryPr = samples.some(
  (sample) =>
    sample.id === "docs-reports" &&
    sample.events.some(
      (event) =>
        event.kind === "thread_completion" &&
        Array.isArray(payloadOf(event).pullRequests) &&
        (payloadOf(event).pullRequests as unknown[]).length > 0,
    ),
);

const summaryPorts = samples.some(
  (sample) =>
    sample.id === "docs-reports" &&
    sample.events.some(
      (event) =>
        toolNames(event).includes("expose_port") &&
        (payloadOf(event).blocks as { args?: { port?: number } }[]).some(
          (block) => block.args?.port === 4173,
        ),
    ) &&
    sample.events.some(
      (event) =>
        event.kind === "tool_result" &&
        (payloadOf(event).data as { port?: number } | undefined)?.port === 4173,
    ),
);

describe("thread sample fixtures", () => {
  it("has six neutral sample threads", () => {
    expect(samples).toHaveLength(6);
    expect(new Set(samples.map((sample) => sample.id)).size).toBe(6);
    expect(samples.every((sample) => sample.events.length > 0)).toBe(true);
  });

  it.each(samples)("decodes every event in $id", (sample) => {
    expect(new Set(sample.events.map((event) => event.id)).size).toBe(
      sample.events.length,
    );
    for (const event of sample.events) {
      expect(decodeEvent(event).kind).toBe(event.kind);
    }
  });

  it("covers every stored event kind", () => {
    const kinds = new Set(
      samples.flatMap((sample) => sample.events.map((event) => event.kind)),
    );
    expect(
      [...kinds]
        .filter((kind) =>
          EVENT_KINDS.includes(kind as (typeof EVENT_KINDS)[number]),
        )
        .sort(),
    ).toEqual([...EVENT_KINDS].sort());
  });

  it("covers every notification key", () => {
    const keys = new Set(
      samples.flatMap((sample) =>
        sample.events
          .filter((event) => event.kind === "notification")
          .map((event) => payloadOf(event).key as string),
      ),
    );
    expect([...keys].sort()).toEqual([...NOTIFICATION_KEYS].sort());
  });

  it("covers every control command, marker context and handoff direction", () => {
    const controls = new Set(
      samples.flatMap((sample) =>
        sample.events
          .filter((event) => event.kind === "control")
          .map((event) => (payloadOf(event).command as { type: string }).type),
      ),
    );
    expect(controls.size).toBe(9);

    const contexts = new Set(
      samples.flatMap((sample) =>
        sample.events
          .filter((event) => event.kind === "context")
          .map((event) => (payloadOf(event).context as { kind?: string }).kind)
          .filter((kind): kind is string => kind !== undefined),
      ),
    );
    expect([...contexts].sort()).toEqual(
      ["takeover", "archive", "access", "side_thread"].sort(),
    );
    expect(MARKER_KINDS).toContain("compaction");

    const directions = new Set(
      samples.flatMap((sample) =>
        sample.events
          .filter((event) => event.kind === "handoff")
          .map((event) => payloadOf(event).direction as string),
      ),
    );
    expect([...directions].sort()).toEqual(
      ["device_to_cloud", "cloud_to_device"].sort(),
    );
  });

  it("covers success and failure tool results, subagent reports, takeovers, compaction and errors", () => {
    const events = samples.flatMap((sample) => sample.events);
    expect(events.some((event) => toolNames(event).length > 0)).toBe(true);
    expect(
      events.filter(
        (event) => event.kind === "tool_result" && !payloadOf(event).isError,
      ).length,
    ).toBeGreaterThan(0);
    expect(
      events.filter(
        (event) => event.kind === "tool_result" && payloadOf(event).isError,
      ).length,
    ).toBeGreaterThan(0);
    expect(events.some((event) => event.kind === "task_completion")).toBe(true);
    expect(events.some((event) => event.kind === "thread_completion")).toBe(
      true,
    );
    expect(events.some((event) => event.kind === "compact")).toBe(true);
    expect(events.some((event) => event.kind === "error")).toBe(true);
    expect(summaryPr && summaryPorts).toBe(true);
  });

  it("covers the clarify, environment and port tool calls", () => {
    expect(toolUseNames).toContain("ask_user");
    expect(toolUseNames).toContain("request_environment");
    expect(toolUseNames).toContain("expose_port");
  });
});
