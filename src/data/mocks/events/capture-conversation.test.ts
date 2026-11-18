import { assert, describe, it } from "@effect/vitest";
import { Schema } from "effect";
import { EventRow, type EventRowEncoded } from "@/data/events";
import { splitSections } from "@/features/thread/agent-message/sections.ts";
import { decodeProposal } from "@/features/thread/mcp-setup-card/proposal.ts";
import { buildTimeline } from "@/features/thread/timeline/build.ts";
import { threads } from "../fixtures/world.ts";
import { seedEvents } from "./fixtures.ts";
import { threadStateSeeds } from "./thread-states.ts";

const decodeEvent = (event: EventRowEncoded) =>
  Schema.decodeUnknownSync(EventRow)(event);

const rowsOf = (seeds: ReadonlyArray<EventRowEncoded>, jamId: string) => {
  const events = seeds
    .filter((event) => event.jamId === jamId)
    .map(decodeEvent);
  return buildTimeline(events).rows.flatMap((row): readonly unknown[] => {
    if (row.type === "work-group") return row.entries;
    if (row.type === "cluster") return row.members;
    return [row];
  });
};

const rowsFor = (jamId: string) => rowsOf(seedEvents, jamId);

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

  it("carries a proposed MCP server that decodes", () => {
    const setups = ofType(jamId, "mcp-setup");
    assert.lengthOf(setups, 1);
    const [setup] = setups as ReadonlyArray<{ proposal: unknown }>;
    assert.isDefined(decodeProposal(setup?.proposal));
  });

  it("carries tool activity between the turns", () => {
    const activity = ofType(jamId, "activity");
    assert.isAbove(activity.length, 3);
  });
});

/**
 * A proposal the card cannot decode renders nothing, which looks exactly like a
 * component that was never mounted. Every seeded MCP row therefore has to carry
 * a proposal `decodeProposal` accepts, in either seed set.
 */
describe("every seeded MCP proposal decodes", () => {
  const jams = [
    ...new Set([
      ...seedEvents.map((event) => event.jamId),
      ...threadStateSeeds.map((event) => event.jamId),
    ]),
  ];

  it.each(jams)("%s", (jamId) => {
    const seeds = [seedEvents, threadStateSeeds];
    const setups = seeds.flatMap((set) =>
      rowsOf(set, jamId).filter(
        (row) => (row as { type?: string }).type === "mcp-setup",
      ),
    );
    for (const setup of setups as ReadonlyArray<{ proposal: unknown }>) {
      assert.isDefined(decodeProposal(setup.proposal));
    }
  });
});
