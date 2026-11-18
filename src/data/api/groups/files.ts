import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiError, HttpApiGroup } from "effect/http-api";
import {
  FileUploadDeclaration,
  FileUploadTargets,
  FileUrl,
} from "../schemas/files.ts";
import { Undecoded, UndecodedQuery } from "../undecoded.ts";

export class FilesGroup extends HttpApiGroup.make("files").add(
  HttpApiEndpoint.post("upload", "/orgs/:orgId/files", {
    params: { orgId: Schema.String },
    payload: Schema.Struct({ files: Schema.Array(FileUploadDeclaration) }),
    success: FileUploadTargets,
  }),
  HttpApiEndpoint.post("pendingPreview", "/orgs/:orgId/files/:fileId/preview", {
    params: { orgId: Schema.String, fileId: Schema.String },
    success: FileUrl,
  }),
  HttpApiEndpoint.put("write", "/orgs/:orgId/jams/:jamId/files/:fileId", {
    params: {
      orgId: Schema.String,
      jamId: Schema.String,
      fileId: Schema.String,
    },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.get("url", "/orgs/:orgId/jams/:jamId/files/:fileId/url", {
    params: {
      orgId: Schema.String,
      jamId: Schema.String,
      fileId: Schema.String,
    },
    query: UndecodedQuery,
    success: Undecoded,
    error: HttpApiError.NotFoundNoContent,
  }),
  HttpApiEndpoint.get(
    "versions",
    "/orgs/:orgId/jams/:jamId/files/:fileId/versions",
    {
      params: {
        orgId: Schema.String,
        jamId: Schema.String,
        fileId: Schema.String,
      },
      success: Undecoded,
      error: HttpApiError.NotFoundNoContent,
    },
  ),
  HttpApiEndpoint.get("read", "/orgs/:orgId/jams/:jamId/machine-file", {
    params: { orgId: Schema.String, jamId: Schema.String },
    query: UndecodedQuery,
    success: Undecoded,
  }),
  HttpApiEndpoint.put("writeMachine", "/orgs/:orgId/jams/:jamId/machine-file", {
    params: { orgId: Schema.String, jamId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
) {}
