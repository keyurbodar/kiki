import { Context, Effect, Layer, Ref, type Stream } from "effect";
import { type FakeEmitter, makeFakeEmitter } from "./FakeEmitter.ts";
import type { RealtimeError } from "./RealtimeError.ts";

export class RealtimeSocket extends Context.Service<
  RealtimeSocket,
  {
    readonly messages: Stream.Stream<string, RealtimeError>;
    readonly send: (message: string) => Effect.Effect<void, RealtimeError>;
  }
>()("kiki/RealtimeSocket") {}

export class FakeRealtimeSocket extends Context.Service<
  FakeRealtimeSocket,
  {
    readonly server: FakeEmitter<string>;
    readonly sent: Ref.Ref<ReadonlyArray<string>>;
  }
>()("kiki/FakeRealtimeSocket") {}

export const RealtimeSocketFake = Layer.effect(
  RealtimeSocket,
  Effect.gen(function* () {
    const fake = yield* FakeRealtimeSocket;
    return RealtimeSocket.of({
      messages: fake.server.stream,
      send: (message) => Ref.update(fake.sent, (sent) => [...sent, message]),
    });
  }),
).pipe(
  Layer.provideMerge(
    Layer.effect(
      FakeRealtimeSocket,
      Effect.gen(function* () {
        return FakeRealtimeSocket.of({
          server: yield* makeFakeEmitter<string>(),
          sent: yield* Ref.make<ReadonlyArray<string>>([]),
        });
      }),
    ),
  ),
);
