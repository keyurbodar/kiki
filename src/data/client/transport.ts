import { FetchHttpClient } from "effect/http";
import { MockTransport, mockBaseUrl } from "../mocks/MockServices.ts";

const liveBaseUrl: string | undefined = import.meta.env.VITE_KIKI_API_URL;

export const apiMode: "live" | "mock" = liveBaseUrl ? "live" : "mock";

export const apiBaseUrl = liveBaseUrl ?? mockBaseUrl;

export const LiveTransport = FetchHttpClient.layer;

export const ApiTransport = apiMode === "live" ? LiveTransport : MockTransport;
