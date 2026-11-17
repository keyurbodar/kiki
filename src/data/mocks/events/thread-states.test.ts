import { assert, describe, it, layer } from "@effect/vitest";
import { Effect, Schema } from "effect";
import { ApiClient, makeApiClientLayer } from "@/data/client/ApiClient.ts";
import { EventRow, type EventRowEncoded, TimelineRow } from "@/data/events";
import { buildTimeline } from "@/features/thread/timeline/build.ts";
import { orgId, threads } from "../fixtures/world.ts";
import { MockTransport } from "../MockServices.ts";
import { threadStateJamIds, threadStateSeeds } from "./thread-states.ts";

const decodeEvent = (event: EventRowEncoded) =>
  Schema.decodeUnknownSync(EventRow)(event);
const decodeRow = (row: unknown) => Schema.decodeUnknownSync(TimelineRow)(row);

type Payload = Record<string, unknown>;
const payloadOf = (event: EventRowEncoded) =>
  (event as { payload: Payload }).payload;
const blocksOf = (event: EventRowEncoded) =>
  (payloadOf(event).blocks ?? []) as Payload[];
const eventsFor = (jamId: string) =>
  threadStateSeeds.filter((event) => event.jamId === jamId);
const toolCall = (event: EventRowEncoded) =>
  blocksOf(event).find((block) => block.type === "tool_use");
const toolName = (event: EventRowEncoded) => toolCall(event)?.toolName;
const toolArgs = (event: EventRowEncoded) => toolCall(event)?.args as Payload;

describe("thread state mock seeds", () => {
  it.each(threadStateSeeds.map((event) => [event.id, event] as const))(
    "decodes seed %s with the A8 EventRow schema",
    (_id, encoded) => {
      const decoded = decodeEvent(encoded);
      assert.strictEqual(decoded.kind, encoded.kind);
      assert.instanceOf(decoded.createdAt, Date);
      assert.deepEqual(
        Schema.encodeSync(EventRow)(decoded),
        JSON.parse(JSON.stringify(encoded)),
      );
    },
  );

  const timelineFor = (jamId: string) =>
    buildTimeline(eventsFor(jamId).map(decodeEvent));

  const rowsOf = (jamId: string): unknown[] => {
    const rows = timelineFor(jamId).rows.flatMap((row): readonly unknown[] => {
      if (row.type === "work-group") return row.entries;
      if (row.type === "cluster") return row.members;
      return [row];
    });
    return rows.map((row) => JSON.parse(JSON.stringify(row)));
  };

  it("seeds one thread per unshootable state", () => {
    assert.equal(new Set(threadStateJamIds).size, 7);
    assert.equal(
      new Set(threadStateSeeds.map((event) => event.id)).size,
      threadStateSeeds.length,
    );
    assert.isTrue(
      threadStateSeeds.every((event) =>
        (threadStateJamIds as readonly string[]).includes(event.jamId),
      ),
    );
  });

  it("seeds a pending clarify row", () => {
    const events = eventsFor(threads.rateLimit.id);
    const clarify = events.find(
      (event) => toolName(event) === "clarify_questions",
    );
    if (clarify === undefined) throw new Error("missing clarify seed");
    assert.equal((toolArgs(clarify).questions as unknown[]).length, 1);
    assert.equal(timelineFor(threads.rateLimit.id).pendingAsk?.type, "clarify");
  });

  it("seeds an unfulfilled environment request row", () => {
    const events = eventsFor(threads.checkoutTest.id);
    const request = events.find(
      (event) => toolName(event) === "environment_request_variables",
    );
    if (request === undefined) throw new Error("missing environment seed");
    assert.deepEqual(toolArgs(request).variables, ["SAMPLE_E2E_TOKEN"]);
    assert.equal(
      timelineFor(threads.checkoutTest.id).pendingEnvironment?.type,
      "environment-request",
    );
  });

  it("seeds a settled MCP setup proposal", () => {
    const events = eventsFor(threads.darkMode.id);
    assert.isDefined(events.find((event) => toolName(event) === "mcp_add"));
    const result = events.find(
      (event) =>
        event.kind === "tool_result" &&
        payloadOf(event).toolCallId === "toolu_state_mcp",
    );
    if (result === undefined) throw new Error("missing MCP result seed");
    assert.isFalse(payloadOf(result).isError);
    assert.property(payloadOf(result).data as object, "setup");
    assert.isTrue(
      rowsOf(threads.darkMode.id).some(
        (candidate) => decodeRow(candidate).type === "mcp-setup",
      ),
    );
  });

  it("seeds both error severities", () => {
    const errors = eventsFor(threads.bundler.id).filter(
      (event) => event.kind === "error",
    );
    assert.deepEqual(errors.map((event) => payloadOf(event).retryable).sort(), [
      false,
      true,
    ]);
    for (const severity of ["warning", "error"]) {
      assert.isTrue(
        decodeRow(
          rowsOf(threads.bundler.id).find(
            (candidate) =>
              (candidate as { severity?: string }).severity === severity,
          ),
        ).type === "error",
      );
    }
  });

  it("seeds an update review row", () => {
    const review = eventsFor(threads.paginate.id).find(
      (event) =>
        event.kind === "notification" &&
        payloadOf(event).key === "review_completion",
    );
    if (review === undefined) throw new Error("missing review seed");
    assert.deepEqual(payloadOf(review).reviewCompletion, {
      prNumber: 57,
      issues: 1,
    });
    assert.isTrue(
      rowsOf(threads.paginate.id).some((candidate) => {
        const row = decodeRow(candidate);
        return row.type === "update" && row.kind === "review";
      }),
    );
  });

  it("seeds a task update row", () => {
    const task = eventsFor(threads.gettingStarted.id).find(
      (event) => event.kind === "task_completion",
    );
    if (task === undefined) throw new Error("missing task seed");
    assert.deepEqual(
      {
        outcome: payloadOf(task).outcome,
        localIndex: payloadOf(task).localIndex,
      },
      { outcome: "completed", localIndex: 1 },
    );
    assert.isTrue(
      rowsOf(threads.gettingStarted.id).some((candidate) => {
        const row = decodeRow(candidate);
        return row.type === "update" && row.kind === "task";
      }),
    );
  });

  it("seeds an interrupted agent message", () => {
    const interrupted = eventsFor(threads.incidents.id).flatMap((event) =>
      blocksOf(event).filter((block) => block.type === "interrupted_reply"),
    );
    assert.equal(interrupted.length, 1);
    assert.equal(
      interrupted[0]?.text,
      "The sample incident summary was cut short.",
    );
    assert.isTrue(
      rowsOf(threads.incidents.id).some((candidate) => {
        const row = decodeRow(candidate);
        return (
          row.type === "agent-message" &&
          row.interrupted &&
          row.text === "The sample incident summary was cut short."
        );
      }),
    );
  });
});

layer(makeApiClientLayer(MockTransport))(
  "MockServices thread state seeds",
  (it) => {
    const serve = (jamId: string, label: string) =>
      it.effect(`serves the ${label} seed for /thread/${jamId}`, () =>
        Effect.gen(function* () {
          const client = yield* ApiClient;
          const page = yield* client.events.list({
            params: { orgId, jamId },
            query: {},
          });
          const items = (page as { items: EventRowEncoded[] }).items;
          const served = items.filter((event) => event.jamId === jamId);
          const seeds = eventsFor(jamId);
          assert.isAtLeast(served.length, seeds.length);
          for (const seed of seeds) {
            const event = served.find((candidate) => candidate.id === seed.id);
            if (event === undefined)
              throw new Error(`mock did not serve ${seed.id}`);
            assert.strictEqual(decodeEvent(event).kind, seed.kind);
          }
        }),
      );

    for (const [index, jamId] of threadStateJamIds.entries())
      serve(jamId, `state ${index + 1}`);
  },
);
