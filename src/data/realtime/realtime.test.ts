import { assert, describe, it } from "@effect/vitest";
import { Effect, Fiber, Layer, Ref, Stream } from "effect";
import { HttpClient, HttpClientResponse } from "effect/http";
import { JamId, OrgId } from "../api/schemas/ids.ts";
import {
  FakeRealtimeSocket,
  RealtimeSocket,
  RealtimeSocketFake,
} from "./RealtimeSocket.ts";
import {
  FakeThreadEvents,
  ThreadEventStream,
  ThreadEventStreamFake,
} from "./ThreadEventStream.ts";

const orgId = OrgId.make("org_sample_acme");
const jamId = JamId.make("jam_sample_0001");
const otherJamId = JamId.make("jam_sample_0002");

describe("ThreadEventStream", () => {
  it.effect("fake emitter delivers frames for the requested thread only", () =>
    Effect.gen(function* () {
      const events = yield* ThreadEventStream;
      const emitter = yield* FakeThreadEvents;
      const fiber = yield* events
        .stream({ orgId, jamId })
        .pipe(Stream.take(2), Stream.runCollect, Effect.forkChild);
      yield* Effect.yieldNow;
      yield* emitter.emitAll([
        { jamId, frame: { id: "1", event: "message", data: "{}" } },
        { jamId: otherJamId, frame: { id: "2", event: "message", data: "{}" } },
        { jamId, frame: { id: "3", event: "status", data: "{}" } },
      ]);
      const frames = yield* Fiber.join(fiber);
      assert.deepStrictEqual(
        Array.from(frames, (frame) => frame.id),
        ["1", "3"],
      );
    }).pipe(Effect.provide(ThreadEventStreamFake)),
  );

  it.effect("live layer decodes text/event-stream frames", () =>
    Effect.gen(function* () {
      let requestedUrl = "";
      const body = 'id: 7\nevent: message\ndata: {"ok":true}\n\n';
      const client = HttpClient.make((request) =>
        Effect.sync(() => {
          requestedUrl = request.url;
          return HttpClientResponse.fromWeb(
            request,
            new Response(body, {
              headers: { "content-type": "text/event-stream" },
            }),
          );
        }),
      );
      const frames = yield* Effect.gen(function* () {
        const events = yield* ThreadEventStream;
        return yield* events
          .stream({ orgId, jamId, after: "6" })
          .pipe(Stream.runCollect);
      }).pipe(
        Effect.provide(
          ThreadEventStream.layerLive.pipe(
            Layer.provide(Layer.succeed(HttpClient.HttpClient, client)),
          ),
        ),
      );
      assert.include(
        requestedUrl,
        `/orgs/${orgId}/jams/${jamId}/events/stream`,
      );
      assert.deepStrictEqual(Array.from(frames), [
        { id: "7", event: "message", data: '{"ok":true}' },
      ]);
    }),
  );
});

describe("RealtimeSocket", () => {
  it.effect("fake socket records sends and replays server messages", () =>
    Effect.gen(function* () {
      const socket = yield* RealtimeSocket;
      const fake = yield* FakeRealtimeSocket;
      const fiber = yield* socket.messages.pipe(
        Stream.take(1),
        Stream.runCollect,
        Effect.forkChild,
      );
      yield* Effect.yieldNow;
      yield* socket.send("subscribe");
      yield* fake.server.emit("hello");
      assert.deepStrictEqual(Array.from(yield* Fiber.join(fiber)), ["hello"]);
      assert.deepStrictEqual(yield* Ref.get(fake.sent), ["subscribe"]);
    }).pipe(Effect.provide(RealtimeSocketFake)),
  );
});
