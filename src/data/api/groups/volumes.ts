import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import { Undecoded, UndecodedQuery } from "../undecoded.ts";

export class VolumesGroup extends HttpApiGroup.make("volumes").add(
  HttpApiEndpoint.get("readShare", "/me/drive-shares/:shareId", {
    params: { shareId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.get(
    "agentContextPreview",
    "/orgs/:orgId/agent-context/preview",
    {
      params: { orgId: Schema.String },
      query: UndecodedQuery,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.get("list", "/orgs/:orgId/drive", {
    params: { orgId: Schema.String },
    query: UndecodedQuery,
    success: Undecoded,
  }),
  HttpApiEndpoint.get("scopeDirectory", "/orgs/:orgId/drive-scopes", {
    params: { orgId: Schema.String },
    query: UndecodedQuery,
    success: Undecoded,
  }),
  HttpApiEndpoint.post("write", "/orgs/:orgId/drive-scopes/write", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.get("listOrgShares", "/orgs/:orgId/drive-shares", {
    params: { orgId: Schema.String },
    query: UndecodedQuery,
    success: Undecoded,
  }),
  HttpApiEndpoint.patch("updateShare", "/orgs/:orgId/drive-shares/:shareId", {
    params: { orgId: Schema.String, shareId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.delete("revokeShare", "/orgs/:orgId/drive-shares/:shareId", {
    params: { orgId: Schema.String, shareId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.get("skills", "/orgs/:orgId/drive-skills", {
    params: { orgId: Schema.String },
    query: UndecodedQuery,
    success: Undecoded,
  }),
  HttpApiEndpoint.post("archive", "/orgs/:orgId/drive/:volumeId/archive", {
    params: { orgId: Schema.String, volumeId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.get(
    "fileVersions",
    "/orgs/:orgId/drive/:volumeId/file-versions",
    {
      params: { orgId: Schema.String, volumeId: Schema.String },
      query: UndecodedQuery,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.post("purgeName", "/orgs/:orgId/drive/:volumeId/purge-name", {
    params: { orgId: Schema.String, volumeId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.post("restore", "/orgs/:orgId/drive/:volumeId/restore", {
    params: { orgId: Schema.String, volumeId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.get("listShares", "/orgs/:orgId/drive/:volumeId/shares", {
    params: { orgId: Schema.String, volumeId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.post("createShare", "/orgs/:orgId/drive/:volumeId/shares", {
    params: { orgId: Schema.String, volumeId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.post("unarchive", "/orgs/:orgId/drive/:volumeId/unarchive", {
    params: { orgId: Schema.String, volumeId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.get("versions", "/orgs/:orgId/drive/:volumeId/versions", {
    params: { orgId: Schema.String, volumeId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.get(
    "manifest",
    "/orgs/:orgId/drive/:volumeId/versions/:versionId",
    {
      params: {
        orgId: Schema.String,
        volumeId: Schema.String,
        versionId: Schema.String,
      },
      query: UndecodedQuery,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.get(
    "changes",
    "/orgs/:orgId/drive/:volumeId/versions/:versionId/changes",
    {
      params: {
        orgId: Schema.String,
        volumeId: Schema.String,
        versionId: Schema.String,
      },
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.get(
    "file",
    "/orgs/:orgId/drive/:volumeId/versions/:versionId/files/:sha256",
    {
      params: {
        orgId: Schema.String,
        volumeId: Schema.String,
        versionId: Schema.String,
        sha256: Schema.String,
      },
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.get(
    "tree",
    "/orgs/:orgId/drive/:volumeId/versions/:versionId/tree",
    {
      params: {
        orgId: Schema.String,
        volumeId: Schema.String,
        versionId: Schema.String,
      },
      query: UndecodedQuery,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.get("publicShare", "/share/:shareId", {
    params: { shareId: Schema.String },
    success: Undecoded,
  }),
) {}
