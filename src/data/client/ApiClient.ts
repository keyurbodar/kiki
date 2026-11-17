import { Layer } from "effect";
import type { HttpClient } from "effect/http";
import { HttpApiClient } from "effect/http-api";
import { AtomHttpApi } from "effect/reactivity";
import { KikiApi } from "../api/Api.ts";
import { ApiTransport, apiBaseUrl } from "./transport.ts";

export class ApiClient extends AtomHttpApi.Service<ApiClient>()(
  "kiki/ApiClient",
  {
    api: KikiApi,
    httpClient: ApiTransport,
    baseUrl: apiBaseUrl,
  },
) {}

export const makeApiClientLayer = (
  transport: Layer.Layer<HttpClient.HttpClient>,
  baseUrl: string = apiBaseUrl,
) =>
  Layer.effect(ApiClient, HttpApiClient.make(KikiApi, { baseUrl })).pipe(
    Layer.provide(transport),
  );

export const ApiClientLayer = makeApiClientLayer(ApiTransport);
