import { assert, describe, it } from "@effect/vitest";
import { Effect, Fiber, Ref, Stream } from "effect";
import {
  FakeRealtimeSocket,
  RealtimeSocket,
  RealtimeSocketFake,
} from "./RealtimeSocket.ts";

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
