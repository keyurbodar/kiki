import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import { Undecoded } from "../undecoded.ts";

export class MobileConnectionGroup extends HttpApiGroup.make(
  "mobileConnection",
).add(
  HttpApiEndpoint.get("get", "/orgs/:orgId/mobile/connection", {
    params: { orgId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.post("connect", "/orgs/:orgId/mobile/connection", {
    params: { orgId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.delete("disconnect", "/orgs/:orgId/mobile/connection", {
    params: { orgId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.put("setEnabled", "/orgs/:orgId/mobile/connection/enabled", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.post("dashboard", "/orgs/:orgId/mobile/dashboard", {
    params: { orgId: Schema.String },
    success: Undecoded,
  }),
) {}
