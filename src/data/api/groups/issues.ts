import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiError, HttpApiGroup } from "effect/http-api";
import {
  CommentIssueRequest,
  CreateIssueRequest,
  IssueComment,
  IssueDetail,
  IssueList,
  IssueRelationPage,
  IssueStateList,
  IssueSummary,
  IssueViewer,
  LinkIssueRequest,
  RelateIssueRequest,
  SetIssueSubscriptionRequest,
  UnlinkIssueRequest,
  UnrelateIssueRequest,
  UpdateIssueRequest,
} from "../schemas/issue.ts";
import { Undecoded, UndecodedQuery } from "../undecoded.ts";

const issueParams = { orgId: Schema.String, code: Schema.String };

export class IssuesGroup extends HttpApiGroup.make("issues").add(
  HttpApiEndpoint.get(
    "captainActivity",
    "/orgs/:orgId/captains/:jamId/issue-activity",
    {
    error: HttpApiError.NotFoundNoContent,
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
    success: IssueStateList,
  }),
  HttpApiEndpoint.post("createState", "/orgs/:orgId/issue-states", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.patch("updateState", "/orgs/:orgId/issue-states/:stateId", {
    error: HttpApiError.NotFoundNoContent,
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
    success: Schema.Array(IssueSummary),
  }),
  HttpApiEndpoint.get("summary", "/orgs/:orgId/issue-summaries/:issueId", {
    error: HttpApiError.NotFoundNoContent,
    params: { orgId: Schema.String, issueId: Schema.String },
    success: IssueSummary,
  }),
  HttpApiEndpoint.get("list", "/orgs/:orgId/issues", {
    params: { orgId: Schema.String },
    query: UndecodedQuery,
    success: IssueList,
  }),
  HttpApiEndpoint.post("create", "/orgs/:orgId/issues", {
    error: HttpApiError.NotFoundNoContent,
    params: { orgId: Schema.String },
    payload: CreateIssueRequest,
    success: IssueDetail,
  }),
  HttpApiEndpoint.get("get", "/orgs/:orgId/issues/:code", {
    error: HttpApiError.NotFoundNoContent,
    params: issueParams,
    success: IssueDetail,
  }),
  HttpApiEndpoint.patch("update", "/orgs/:orgId/issues/:code", {
    error: HttpApiError.NotFoundNoContent,
    params: issueParams,
    payload: UpdateIssueRequest,
    success: IssueDetail,
  }),
  HttpApiEndpoint.post("comment", "/orgs/:orgId/issues/:code/comments", {
    error: HttpApiError.NotFoundNoContent,
    params: issueParams,
    payload: CommentIssueRequest,
    success: IssueComment,
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
    error: HttpApiError.NotFoundNoContent,
    params: issueParams,
    payload: LinkIssueRequest,
    success: IssueDetail,
  }),
  HttpApiEndpoint.delete("unlink", "/orgs/:orgId/issues/:code/links", {
    error: HttpApiError.NotFoundNoContent,
    params: issueParams,
    payload: UnlinkIssueRequest,
    success: IssueDetail,
  }),
  HttpApiEndpoint.post("relate", "/orgs/:orgId/issues/:code/relations", {
    error: HttpApiError.NotFoundNoContent,
    params: issueParams,
    payload: RelateIssueRequest,
    success: IssueDetail,
  }),
  HttpApiEndpoint.get("relations", "/orgs/:orgId/issues/:code/relations", {
    error: HttpApiError.NotFoundNoContent,
    params: issueParams,
    query: {
      offset: Schema.optionalKey(Schema.NumberFromString),
      limit: Schema.NumberFromString,
    },
    success: IssueRelationPage,
  }),
  HttpApiEndpoint.delete("unrelate", "/orgs/:orgId/issues/:code/relations", {
    error: HttpApiError.NotFoundNoContent,
    params: issueParams,
    payload: UnrelateIssueRequest,
    success: IssueDetail,
  }),
  HttpApiEndpoint.post("markSeen", "/orgs/:orgId/issues/:code/seen", {
    error: HttpApiError.NotFoundNoContent,
    params: issueParams,
    success: IssueViewer,
  }),
  HttpApiEndpoint.put(
    "setSubscription",
    "/orgs/:orgId/issues/:code/subscription",
    {
    error: HttpApiError.NotFoundNoContent,
      params: issueParams,
      payload: SetIssueSubscriptionRequest,
      success: IssueViewer,
    },
  ),
  HttpApiEndpoint.post("markUnread", "/orgs/:orgId/issues/:code/unread", {
    error: HttpApiError.NotFoundNoContent,
    params: issueParams,
    success: IssueViewer,
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
    success: Schema.Array(IssueSummary),
  }),
) {}
