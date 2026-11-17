import { Effect, PubSub, type Scope, Stream } from "effect";

export interface FakeEmitter<A> {
  readonly emit: (value: A) => Effect.Effect<void>;
  readonly emitAll: (values: Iterable<A>) => Effect.Effect<void>;
  readonly stream: Stream.Stream<A>;
}

export const makeFakeEmitter = <A>(options?: {
  readonly replay?: number;
}): Effect.Effect<FakeEmitter<A>, never, Scope.Scope> =>
  Effect.acquireRelease(
    PubSub.unbounded<A>({ replay: options?.replay }),
    PubSub.shutdown,
  ).pipe(
    Effect.map((pubsub) => ({
      emit: (value: A) => PubSub.publish(pubsub, value).pipe(Effect.asVoid),
      emitAll: (values: Iterable<A>) =>
        PubSub.publishAll(pubsub, values).pipe(Effect.asVoid),
      stream: Stream.fromPubSub(pubsub),
    })),
  );
