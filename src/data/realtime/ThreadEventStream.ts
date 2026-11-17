import { Context, Effect, Layer, Stream } from "effect";
import { Sse } from "effect/encoding";
import { HttpClient, HttpClientRequest } from "effect/http";
import type { JamId, OrgId } from "../api/schemas/ids.ts";
import { apiBaseUrl } from "../client/transport.ts";
import { type FakeEmitter, makeFakeEmitter } from "./FakeEmitter.ts";
import { RealtimeError } from "./RealtimeError.ts";

export interface ThreadEventFrame {
  readonly id: string | undefined;
  readonly event: string;
  readonly data: string;
}

export interface ThreadEventStreamRequest {
  readonly orgId: OrgId;
  readonly jamId: JamId;
  readonly after?: string;
}

export const threadEventStreamPath = ({
  orgId,
  jamId,
}: ThreadEventStreamRequest) => `/orgs/${orgId}/jams/${jamId}/events/stream`;

export class ThreadEventStream extends Context.Service<
  ThreadEventStream,
  {
    readonly stream: (
      request: ThreadEventStreamRequest,
    ) => Stream.Stream<ThreadEventFrame, RealtimeError>;
  }
>()("kiki/ThreadEventStream") {
  static readonly layerLive = Layer.effect(
    ThreadEventStream,
    Effect.gen(function* () {
      const client = yield* HttpClient.HttpClient;
      return ThreadEventStream.of({
        stream: (request) =>
          client
            .execute(
              HttpClientRequest.get(
                new URL(threadEventStreamPath(request), apiBaseUrl),
              ).pipe(
                HttpClientRequest.setHeader("accept", "text/event-stream"),
                HttpClientRequest.setUrlParams(
                  request.after === undefined ? {} : { after: request.after },
                ),
              ),
            )
            .pipe(
              Effect.map((response) => response.stream),
              Stream.unwrap,
              Stream.decodeText,
              Stream.pipeThroughChannel(Sse.decode()),
              Stream.map(({ id, event, data }) => ({ id, event, data })),
              Stream.mapError(
                (error) =>
                  new RealtimeError({
                    channel: "events",
                    message: String(error),
                  }),
              ),
            ),
      });
    }),
  );
}

export interface FakeThreadEvent {
  readonly jamId: JamId;
  readonly frame: ThreadEventFrame;
}

export class FakeThreadEvents extends Context.Service<
  FakeThreadEvents,
  FakeEmitter<FakeThreadEvent>
>()("kiki/FakeThreadEvents") {}

export const ThreadEventStreamFake = Layer.effect(
  ThreadEventStream,
  Effect.gen(function* () {
    const emitter = yield* FakeThreadEvents;
    return ThreadEventStream.of({
      stream: ({ jamId }) =>
        emitter.stream.pipe(
          Stream.filter((event) => event.jamId === jamId),
          Stream.map((event) => event.frame),
        ),
    });
  }),
).pipe(
  Layer.provideMerge(
    Layer.effect(FakeThreadEvents, makeFakeEmitter<FakeThreadEvent>()),
  ),
);
