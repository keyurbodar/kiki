import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiError, HttpApiGroup } from "effect/http-api";
import { InferredMethod } from "../annotations.ts";
import { Undecoded } from "../undecoded.ts";

export class PaperGroup extends HttpApiGroup.make("paper").add(
  HttpApiEndpoint.post(
    "mintPaperEmbed",
    "/orgs/:orgId/jams/:jamId/paper/embed",
    {
      error: HttpApiError.NotFoundNoContent,
      params: { orgId: Schema.String, jamId: Schema.String },
      payload: Undecoded,
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.get(
    "listPaperFiles",
    "/orgs/:orgId/jams/:jamId/paper/files",
    {
      error: HttpApiError.NotFoundNoContent,
      params: { orgId: Schema.String, jamId: Schema.String },
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
) {}
