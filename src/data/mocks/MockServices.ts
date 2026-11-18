import { Effect, Layer } from "effect";
import { FetchHttpClient, HttpRouter, HttpServer } from "effect/http";
import { HttpApiBuilder } from "effect/http-api";
import { KikiApi } from "../api/Api.ts";
import { MockDb } from "./db/MockDb.ts";
import { failsMockRequest } from "./failure.ts";
import { MockGroups } from "./groups.ts";

export { AuthServiceMock } from "../auth/mock.ts";

export const mockBaseUrl = "http://kiki.mock";

export const MockServices = HttpApiBuilder.layer(KikiApi).pipe(
  Layer.provide(MockGroups),
  Layer.provide(MockDb.layer),
  Layer.provide(HttpServer.layerServices),
);

const MockFetch = Layer.effect(
  FetchHttpClient.Fetch,
  Effect.acquireRelease(
    Effect.sync(() =>
      HttpRouter.toWebHandler(MockServices, { disableLogger: true }),
    ),
    ({ dispose }) => Effect.promise(() => dispose()),
  ).pipe(
    Effect.map(
      ({ handler }) =>
        ((input: RequestInfo | URL, init?: RequestInit) => {
          const request = new Request(input, init);
          // A test can force this read to fail; see `failure.ts`.
          if (failsMockRequest(request.url))
            return Promise.resolve(
              new Response("forced failure", { status: 500 }),
            );
          return handler(request);
        }) as typeof globalThis.fetch,
    ),
  ),
);

export const MockTransport = FetchHttpClient.layer.pipe(
  Layer.provide(MockFetch),
);
