import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { ApiClient } from "../../client/ApiClient.ts";
import { orgId, threads } from "../fixtures/world.ts";

interface StoredEvent {
  readonly id: string;
  readonly kind: string;
  readonly state: string;
  readonly text?: string;
}

interface EventList {
  readonly items: ReadonlyArray<StoredEvent>;
  readonly cursor: string | null;
}

const jamId = threads.checkoutTest.id;
const messageEventId = "evt_sample_message";
const key = `events:${orgId}:${jamId}`;

const listAtom = ApiClient.query("events", "list", {
  params: { orgId, jamId },
  query: {},
  reactivityKeys: [key],
});
const message = ApiClient.mutation("events", "message");
const cancelMessage = ApiClient.mutation("events", "cancelMessage");
const sendNowMessage = ApiClient.mutation("events", "sendNowMessage");

const eventsOf = (result: unknown) => (result as EventList).items;

describe("events mock", () => {
  it.effect("serves every read endpoint for a thread", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const read = <A>(atom: Parameters<typeof AtomRegistry.getResult>[1]) =>
        AtomRegistry.getResult(registry, atom as never) as Effect.Effect<A>;

      const list = yield* read<EventList>(listAtom);
      assert.isAbove(list.items.length, 0);
      assert.isString(list.cursor);

      const usage = yield* read<{ usedTokens: number; budgetTokens: number }>(
        ApiClient.query("events", "contextUsage", {
          params: { orgId, jamId },
        }),
      );
      const outline = yield* read<ReadonlyArray<{ label: string }>>(
        ApiClient.query("events", "outline", { params: { orgId, jamId } }),
      );
      const versions = yield* read<{
        root: string;
        versions: ReadonlyArray<{ text: string }>;
      }>(
        ApiClient.query("events", "messageVersions", {
          params: { orgId, jamId, eventId: messageEventId },
        }),
      );
      assert.isAbove(usage.usedTokens, 0);
      assert.isAbove(outline.length, 0);
      assert.equal(versions.root, messageEventId);
      assert.isAbove(versions.versions.length, 0);
    }),
  );

  it.effect("streams NDJSON page, event and end lines", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const lines = yield* AtomRegistry.getResult(
        registry,
        ApiClient.query("events", "stream", {
          params: { orgId, jamId },
          query: {},
          responseMode: "response-only",
        }),
      );
      assert.include(
        (lines as { headers: Record<string, string> }).headers[
          "content-type"
        ] ?? "",
        "application/x-ndjson",
      );
    }),
  );

  it.effect("applies mutations and refreshes the event list", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      registry.mount(listAtom);
      yield* AtomRegistry.getResult(registry, listAtom);

      registry.set(message, {
        params: { orgId, jamId },
        payload: { text: "Please check the staging timeout." },
        reactivityKeys: [key],
      });
      const admitted = (yield* AtomRegistry.getResult(registry, message)) as {
        id: string;
        deduped: boolean;
      };
      assert.isFalse(admitted.deduped);
      const afterMessage = eventsOf(
        yield* AtomRegistry.getResult(registry, listAtom, {
          suspendOnWaiting: true,
        }),
      );
      assert.isTrue(afterMessage.some((event) => event.id === admitted.id));

      registry.set(sendNowMessage, {
        params: { orgId, jamId, eventId: admitted.id },
        reactivityKeys: [key],
      });
      const sent = (yield* AtomRegistry.getResult(
        registry,
        sendNowMessage,
      )) as { outcome: string };
      assert.equal(sent.outcome, "sent");

      registry.set(cancelMessage, {
        params: { orgId, jamId, eventId: admitted.id },
        reactivityKeys: [key],
      });
      const cancelled = (yield* AtomRegistry.getResult(
        registry,
        cancelMessage,
      )) as { outcome: string };
      assert.equal(cancelled.outcome, "cancelled");

      const atom = (endpoint: string) =>
        ApiClient.mutation("events" as never, endpoint as never);
      const mutate = <A>(
        mutation: ReturnType<typeof atom>,
        request: unknown,
      ) => {
        registry.set(mutation, request as never);
        return AtomRegistry.getResult(
          registry,
          mutation,
        ) as unknown as Effect.Effect<A>;
      };

      const compacted = yield* mutate<{ id: string; deduped: boolean }>(
        atom("compact"),
        { params: { orgId, jamId }, reactivityKeys: [key] },
      );
      assert.isTrue(compacted.id.startsWith("evt_mock_compact"));
      const interrupted = yield* mutate<{ id: string }>(atom("interrupt"), {
        params: { orgId, jamId },
        reactivityKeys: [key],
      });
      assert.isTrue(interrupted.id.startsWith("evt_mock_interrupt"));
      const reAdmitted = yield* mutate<{ id: string; deduped: boolean }>(
        atom("message"),
        {
          params: { orgId, jamId },
          payload: { text: "Please check the staging timeout." },
          reactivityKeys: [key],
        },
      );
      assert.isString(reAdmitted.id);
    }),
  );
});
