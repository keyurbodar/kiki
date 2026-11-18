import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiError, HttpApiGroup } from "effect/http-api";
import { Undecoded } from "../undecoded.ts";

export class RestoreGroup extends HttpApiGroup.make("restore").add(
  HttpApiEndpoint.post("restore", "/orgs/:orgId/restore", {
    error: HttpApiError.NotFoundNoContent,
    params: { orgId: Schema.String },
    success: Undecoded,
  }),
) {}
