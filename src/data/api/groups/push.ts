import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
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
  }),
  HttpApiEndpoint.delete("unsubscribe", "/me/push/subscriptions/:id", {
    params: { id: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.post("test", "/me/push/subscriptions/:id/test", {
    params: { id: Schema.String },
    success: Undecoded,
  }),
) {}
