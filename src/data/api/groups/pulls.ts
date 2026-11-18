import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiError, HttpApiGroup } from "effect/http-api";
import { Undecoded, UndecodedQuery } from "../undecoded.ts";

export class PullsGroup extends HttpApiGroup.make("pulls").add(
  HttpApiEndpoint.get(
    "localPullsForThread",
    "/orgs/:orgId/jams/:jamId/local-pulls",
    {
      params: { orgId: Schema.String, jamId: Schema.String },
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.delete(
    "removeLocalPull",
    "/orgs/:orgId/jams/:jamId/local-pulls/:id",
    {
      params: { orgId: Schema.String, jamId: Schema.String, id: Schema.String },
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.get("forThread", "/orgs/:orgId/jams/:jamId/pulls", {
    error: HttpApiError.NotFoundNoContent,
    params: { orgId: Schema.String, jamId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.post("create", "/orgs/:orgId/pulls", {
    error: HttpApiError.NotFoundNoContent,
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.get("list", "/orgs/:orgId/pulls", {
    error: HttpApiError.NotFoundNoContent,
    params: { orgId: Schema.String },
    query: UndecodedQuery,
    success: Undecoded,
  }),
  HttpApiEndpoint.get("get", "/orgs/:orgId/pulls/:pullId", {
    error: HttpApiError.NotFoundNoContent,
    params: { orgId: Schema.String, pullId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.patch("editBody", "/orgs/:orgId/pulls/:pullId", {
    error: HttpApiError.NotFoundNoContent,
    params: { orgId: Schema.String, pullId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.get("activity", "/orgs/:orgId/pulls/:pullId/activity", {
    error: HttpApiError.NotFoundNoContent,
    params: { orgId: Schema.String, pullId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.post("publishAssets", "/orgs/:orgId/pulls/:pullId/assets", {
    error: HttpApiError.NotFoundNoContent,
    params: { orgId: Schema.String, pullId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.post("setAutoMerge", "/orgs/:orgId/pulls/:pullId/automerge", {
    error: HttpApiError.NotFoundNoContent,
    params: { orgId: Schema.String, pullId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.get("checks", "/orgs/:orgId/pulls/:pullId/checks", {
    error: HttpApiError.NotFoundNoContent,
    params: { orgId: Schema.String, pullId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.post("close", "/orgs/:orgId/pulls/:pullId/close", {
    error: HttpApiError.NotFoundNoContent,
    params: { orgId: Schema.String, pullId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.post("comment", "/orgs/:orgId/pulls/:pullId/comments", {
    error: HttpApiError.NotFoundNoContent,
    params: { orgId: Schema.String, pullId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.post(
    "resolveComment",
    "/orgs/:orgId/pulls/:pullId/comments/:commentId",
    {
      params: {
        orgId: Schema.String,
        pullId: Schema.String,
        commentId: Schema.String,
      },
      payload: Undecoded,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.get(
    "commitDiff",
    "/orgs/:orgId/pulls/:pullId/commits/:sha/diff",
    {
      error: HttpApiError.NotFoundNoContent,
      params: {
        orgId: Schema.String,
        pullId: Schema.String,
        sha: Schema.String,
      },
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.get(
    "compareDiff",
    "/orgs/:orgId/pulls/:pullId/compare/:base/:head/diff",
    {
      error: HttpApiError.NotFoundNoContent,
      params: {
        orgId: Schema.String,
        pullId: Schema.String,
        base: Schema.String,
        head: Schema.String,
      },
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.get("diff", "/orgs/:orgId/pulls/:pullId/diff", {
    error: HttpApiError.NotFoundNoContent,
    params: { orgId: Schema.String, pullId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.get("fileUrls", "/orgs/:orgId/pulls/:pullId/diff/file-urls", {
    error: HttpApiError.NotFoundNoContent,
    params: { orgId: Schema.String, pullId: Schema.String },
    query: UndecodedQuery,
    success: Undecoded,
  }),
  HttpApiEndpoint.post("setDraft", "/orgs/:orgId/pulls/:pullId/draft", {
    error: HttpApiError.NotFoundNoContent,
    params: { orgId: Schema.String, pullId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.patch(
    "updateFinding",
    "/orgs/:orgId/pulls/:pullId/findings/:findingId",
    {
      params: {
        orgId: Schema.String,
        pullId: Schema.String,
        findingId: Schema.String,
      },
      payload: Undecoded,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.get("image", "/orgs/:orgId/pulls/:pullId/image", {
    error: HttpApiError.NotFoundNoContent,
    params: { orgId: Schema.String, pullId: Schema.String },
    query: UndecodedQuery,
    success: Undecoded,
  }),
  HttpApiEndpoint.get("labels", "/orgs/:orgId/pulls/:pullId/labels", {
    error: HttpApiError.NotFoundNoContent,
    params: { orgId: Schema.String, pullId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.post("setLabel", "/orgs/:orgId/pulls/:pullId/labels", {
    error: HttpApiError.NotFoundNoContent,
    params: { orgId: Schema.String, pullId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.post("merge", "/orgs/:orgId/pulls/:pullId/merge", {
    error: HttpApiError.NotFoundNoContent,
    params: { orgId: Schema.String, pullId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.post("reopen", "/orgs/:orgId/pulls/:pullId/reopen", {
    error: HttpApiError.NotFoundNoContent,
    params: { orgId: Schema.String, pullId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.get("review", "/orgs/:orgId/pulls/:pullId/review", {
    error: HttpApiError.NotFoundNoContent,
    params: { orgId: Schema.String, pullId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.post("requestReview", "/orgs/:orgId/pulls/:pullId/review", {
    error: HttpApiError.NotFoundNoContent,
    params: { orgId: Schema.String, pullId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.get("reviewSkip", "/orgs/:orgId/pulls/:pullId/review-skip", {
    error: HttpApiError.NotFoundNoContent,
    params: { orgId: Schema.String, pullId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.get("reviewers", "/orgs/:orgId/pulls/:pullId/reviewers", {
    error: HttpApiError.NotFoundNoContent,
    params: { orgId: Schema.String, pullId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.post("setReviewer", "/orgs/:orgId/pulls/:pullId/reviewers", {
    error: HttpApiError.NotFoundNoContent,
    params: { orgId: Schema.String, pullId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.post("submitReview", "/orgs/:orgId/pulls/:pullId/reviews", {
    error: HttpApiError.NotFoundNoContent,
    params: { orgId: Schema.String, pullId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.post(
    "dismissReview",
    "/orgs/:orgId/pulls/:pullId/reviews/:githubReviewId/dismiss",
    {
      params: {
        orgId: Schema.String,
        pullId: Schema.String,
        githubReviewId: Schema.String,
      },
      payload: Undecoded,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.get("stackRelatives", "/orgs/:orgId/pulls/:pullId/stack", {
    error: HttpApiError.NotFoundNoContent,
    params: { orgId: Schema.String, pullId: Schema.String },
    query: UndecodedQuery,
    success: Undecoded,
  }),
  HttpApiEndpoint.get("stackTree", "/orgs/:orgId/pulls/:pullId/stack-tree", {
    error: HttpApiError.NotFoundNoContent,
    params: { orgId: Schema.String, pullId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.get("summary", "/orgs/:orgId/pulls/:pullId/summary", {
    error: HttpApiError.NotFoundNoContent,
    params: { orgId: Schema.String, pullId: Schema.String },
    query: UndecodedQuery,
    success: Undecoded,
  }),
  HttpApiEndpoint.get(
    "summaryLatest",
    "/orgs/:orgId/pulls/:pullId/summary/latest",
    {
      error: HttpApiError.NotFoundNoContent,
      params: { orgId: Schema.String, pullId: Schema.String },
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.get("threads", "/orgs/:orgId/pulls/:pullId/threads", {
    error: HttpApiError.NotFoundNoContent,
    params: { orgId: Schema.String, pullId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.post("linkThread", "/orgs/:orgId/pulls/:pullId/threads", {
    error: HttpApiError.NotFoundNoContent,
    params: { orgId: Schema.String, pullId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.delete(
    "unlinkThread",
    "/orgs/:orgId/pulls/:pullId/threads/:jamId",
    {
      error: HttpApiError.NotFoundNoContent,
      params: {
        orgId: Schema.String,
        pullId: Schema.String,
        jamId: Schema.String,
      },
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.post(
    "updateBranch",
    "/orgs/:orgId/pulls/:pullId/update-branch",
    {
      error: HttpApiError.NotFoundNoContent,
      params: { orgId: Schema.String, pullId: Schema.String },
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.get(
    "viewedFiles",
    "/orgs/:orgId/pulls/:pullId/viewed-files",
    {
      error: HttpApiError.NotFoundNoContent,
      params: { orgId: Schema.String, pullId: Schema.String },
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.put(
    "setFileViewed",
    "/orgs/:orgId/pulls/:pullId/viewed-files",
    {
      error: HttpApiError.NotFoundNoContent,
      params: { orgId: Schema.String, pullId: Schema.String },
      payload: Undecoded,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.get("orgActivity", "/orgs/:orgId/pulls/activity", {
    params: { orgId: Schema.String },
    query: UndecodedQuery,
    success: Undecoded,
  }),
  HttpApiEndpoint.get(
    "orgHourlyActivity",
    "/orgs/:orgId/pulls/activity/hourly",
    {
      params: { orgId: Schema.String },
      query: UndecodedQuery,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.get("branches", "/orgs/:orgId/pulls/branches", {
    params: { orgId: Schema.String },
    query: UndecodedQuery,
    success: Undecoded,
  }),
  HttpApiEndpoint.post("byNumber", "/orgs/:orgId/pulls/by-number", {
    error: HttpApiError.NotFoundNoContent,
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.get("checkNames", "/orgs/:orgId/pulls/check-names", {
    params: { orgId: Schema.String },
    query: UndecodedQuery,
    success: Undecoded,
  }),
  HttpApiEndpoint.get("find", "/orgs/:orgId/pulls/find", {
    params: { orgId: Schema.String },
    query: UndecodedQuery,
    success: Undecoded,
  }),
  HttpApiEndpoint.get("public", "/orgs/:orgId/pulls/public", {
    params: { orgId: Schema.String },
    query: UndecodedQuery,
    success: Undecoded,
  }),
) {}
