import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import { Undecoded, UndecodedQuery } from "../undecoded.ts";

export class IssuesGroup extends HttpApiGroup.make("issues").add(
  HttpApiEndpoint.get(
    "captainActivity",
    "/orgs/:orgId/captains/:jamId/issue-activity",
    {
      params: { orgId: Schema.String, jamId: Schema.String },
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.get("prefix", "/orgs/:orgId/issue-prefix", {
    params: { orgId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.put("setPrefix", "/orgs/:orgId/issue-prefix", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.get("states", "/orgs/:orgId/issue-states", {
    params: { orgId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.post("createState", "/orgs/:orgId/issue-states", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.patch("updateState", "/orgs/:orgId/issue-states/:stateId", {
    params: { orgId: Schema.String, stateId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.get("stateCounts", "/orgs/:orgId/issue-states/counts", {
    params: { orgId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.put("reorderStates", "/orgs/:orgId/issue-states/order", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.get("summariesByCode", "/orgs/:orgId/issue-summaries", {
    params: { orgId: Schema.String },
    query: UndecodedQuery,
    success: Undecoded,
  }),
  HttpApiEndpoint.get("summary", "/orgs/:orgId/issue-summaries/:issueId", {
    params: { orgId: Schema.String, issueId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.get("list", "/orgs/:orgId/issues", {
    params: { orgId: Schema.String },
    query: UndecodedQuery,
    success: Undecoded,
  }),
  HttpApiEndpoint.post("create", "/orgs/:orgId/issues", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.get("get", "/orgs/:orgId/issues/:code", {
    params: { orgId: Schema.String, code: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.patch("update", "/orgs/:orgId/issues/:code", {
    params: { orgId: Schema.String, code: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.post("comment", "/orgs/:orgId/issues/:code/comments", {
    params: { orgId: Schema.String, code: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.get(
    "fileUrl",
    "/orgs/:orgId/issues/:code/files/:fileId/url",
    {
      params: {
        orgId: Schema.String,
        code: Schema.String,
        fileId: Schema.String,
      },
      query: UndecodedQuery,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.post("link", "/orgs/:orgId/issues/:code/links", {
    params: { orgId: Schema.String, code: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.delete("unlink", "/orgs/:orgId/issues/:code/links", {
    params: { orgId: Schema.String, code: Schema.String },
    query: UndecodedQuery,
    success: Undecoded,
  }),
  HttpApiEndpoint.post("relate", "/orgs/:orgId/issues/:code/relations", {
    params: { orgId: Schema.String, code: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.get("relations", "/orgs/:orgId/issues/:code/relations", {
    params: { orgId: Schema.String, code: Schema.String },
    query: UndecodedQuery,
    success: Undecoded,
  }),
  HttpApiEndpoint.delete("unrelate", "/orgs/:orgId/issues/:code/relations", {
    params: { orgId: Schema.String, code: Schema.String },
    query: UndecodedQuery,
    success: Undecoded,
  }),
  HttpApiEndpoint.post("markSeen", "/orgs/:orgId/issues/:code/seen", {
    params: { orgId: Schema.String, code: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.put(
    "setSubscription",
    "/orgs/:orgId/issues/:code/subscription",
    {
      params: { orgId: Schema.String, code: Schema.String },
      payload: Undecoded,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.post("markUnread", "/orgs/:orgId/issues/:code/unread", {
    params: { orgId: Schema.String, code: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.get("assignedCount", "/orgs/:orgId/issues/assigned-count", {
    params: { orgId: Schema.String },
    query: UndecodedQuery,
    success: Undecoded,
  }),
  HttpApiEndpoint.get("mentionCount", "/orgs/:orgId/issues/mention-count", {
    params: { orgId: Schema.String },
    query: UndecodedQuery,
    success: Undecoded,
  }),
  HttpApiEndpoint.get("byPull", "/orgs/:orgId/pulls/:pullId/issues", {
    params: { orgId: Schema.String, pullId: Schema.String },
    success: Undecoded,
  }),
) {}
