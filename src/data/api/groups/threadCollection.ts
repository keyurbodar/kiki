import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import {
  Forbidden,
  InvalidRequest,
  ThreadOrganizationNotFound,
} from "../schemas/errors.ts";
import { OrgId, ThreadFolderId } from "../schemas/ids.ts";
import {
  FolderThreadsPage,
  ThreadCodeLookupRequest,
  ThreadCodeMatch,
  ThreadCollectionRequest,
  ThreadCollectionResponse,
} from "../schemas/threadCollection.ts";

export class ThreadCollectionGroup extends HttpApiGroup.make(
  "threadCollection",
).add(
  HttpApiEndpoint.get(
    "folderThreads",
    "/orgs/:orgId/folders/:folderId/threads",
    {
      params: { orgId: OrgId, folderId: ThreadFolderId },
      query: {
        cursor: Schema.optional(Schema.String),
        limit: Schema.optional(Schema.NumberFromString),
      },
      success: FolderThreadsPage,
      error: [ThreadOrganizationNotFound, InvalidRequest, Forbidden],
    },
  ),
  HttpApiEndpoint.post("read", "/orgs/:orgId/threads", {
    params: { orgId: OrgId },
    payload: ThreadCollectionRequest,
    success: ThreadCollectionResponse,
    error: InvalidRequest,
  }),
  HttpApiEndpoint.post("byCode", "/orgs/:orgId/threads/by-code", {
    params: { orgId: OrgId },
    payload: ThreadCodeLookupRequest,
    success: Schema.Array(ThreadCodeMatch),
  }),
) {}
