import { assert, describe, it } from "@effect/vitest";
import { Schema } from "effect";
import { EventRow, type EventRowEncoded } from "@/data/events";
import { splitSections } from "@/features/thread/agent-message/sections.ts";
import { buildTimeline } from "@/features/thread/timeline/build.ts";
import { threads } from "../fixtures/world.ts";
import { seedEvents } from "./fixtures.ts";

const decodeEvent = (event: EventRowEncoded) =>
  Schema.decodeUnknownSync(EventRow)(event);

const rowsFor = (jamId: string) => {
  const events = seedEvents
    .filter((event) => event.jamId === jamId)
    .map(decodeEvent);
  return buildTimeline(events).rows.flatMap((row): readonly unknown[] => {
    if (row.type === "work-group") return row.entries;
    if (row.type === "cluster") return row.members;
    return [row];
  });
};

const ofType = (jamId: string, type: string) =>
  rowsFor(jamId).filter((row) => (row as { type?: string }).type === type);

/**
 * The conversation the thread routes are measured against has to be a real
 * one: a single user turn makes every component that renders inside an agent
 * turn unmeasured, and a missing element then reads as a missing component.
 */
describe("the captured thread conversation", () => {
  const jamId = threads.captureProbe.id;

  it("carries twelve messages, six from each side", () => {
    assert.lengthOf(ofType(jamId, "user-message"), 6);
    assert.lengthOf(ofType(jamId, "agent-message"), 6);
  });

  it("splits an agent turn into sections", () => {
    const sections = ofType(jamId, "agent-message").flatMap((row) =>
      splitSections((row as { text: string }).text),
    );
    assert.isAbove(sections.length, 6);
  });

  it("carries text long enough to clamp", () => {
    const long = ofType(jamId, "agent-message").filter(
      (row) => (row as { text: string }).text.length > 420,
    );
    assert.isAbove(long.length, 0);
  });

  it("carries a proposed MCP server", () => {
    const setups = ofType(jamId, "mcp-setup");
    assert.lengthOf(setups, 1);
  });

  it("carries tool activity between the turns", () => {
    const activity = ofType(jamId, "activity");
    assert.isAbove(activity.length, 3);
  });
});
