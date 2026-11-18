import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiError, HttpApiGroup } from "effect/http-api";
import { Undecoded, UndecodedQuery } from "../undecoded.ts";

export class ThreadCollectionGroup extends HttpApiGroup.make(
  "threadCollection",
).add(
  HttpApiEndpoint.get(
    "folderThreads",
    "/orgs/:orgId/folders/:folderId/threads",
    {
      error: HttpApiError.NotFoundNoContent,
      params: { orgId: Schema.String, folderId: Schema.String },
      query: UndecodedQuery,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.post("read", "/orgs/:orgId/threads", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.post("byCode", "/orgs/:orgId/threads/by-code", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
) {}
