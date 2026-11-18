import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiError, HttpApiGroup } from "effect/http-api";
import { Undecoded } from "../undecoded.ts";

export class PushGroup extends HttpApiGroup.make("push").add(
  HttpApiEndpoint.get("get", "/me/push", { success: Undecoded }),
  HttpApiEndpoint.put("subscribe", "/me/push/subscriptions", {
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.patch("patch", "/me/push/subscriptions/:id", {
    params: { id: Schema.String },
    payload: Undecoded,
    success: Undecoded,
    error: HttpApiError.NotFoundNoContent,
  }),
  HttpApiEndpoint.delete("unsubscribe", "/me/push/subscriptions/:id", {
    params: { id: Schema.String },
    success: Undecoded,
    error: HttpApiError.NotFoundNoContent,
  }),
  HttpApiEndpoint.post("test", "/me/push/subscriptions/:id/test", {
    params: { id: Schema.String },
    success: Undecoded,
    error: HttpApiError.NotFoundNoContent,
  }),
) {}
