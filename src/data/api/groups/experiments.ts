import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import { InvalidRequest } from "../schemas/errors.ts";
import { Undecoded } from "../undecoded.ts";

export class ExperimentsGroup extends HttpApiGroup.make("experiments").add(
  HttpApiEndpoint.get("listExperiments", "/orgs/:orgId/experiments", {
    params: { orgId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.put("setExperiment", "/orgs/:orgId/experiments/:feature", {
    params: { orgId: Schema.String, feature: Schema.String },
    payload: Undecoded,
    success: Undecoded,
    error: InvalidRequest,
  }),
) {}
