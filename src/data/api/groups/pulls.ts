import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import {
  CreatePullRequestRequest,
  PullListQuery,
  PullRequestCard,
  PullRequestPage,
} from "../schemas/pull.ts";
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
    params: { orgId: Schema.String, jamId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.post("create", "/orgs/:orgId/pulls", {
    params: { orgId: Schema.String },
    payload: CreatePullRequestRequest,
    success: PullRequestCard,
  }),
  HttpApiEndpoint.get("list", "/orgs/:orgId/pulls", {
    params: { orgId: Schema.String },
    query: PullListQuery,
    success: PullRequestPage,
  }),
  HttpApiEndpoint.get("get", "/orgs/:orgId/pulls/:pullId", {
    params: { orgId: Schema.String, pullId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.patch("editBody", "/orgs/:orgId/pulls/:pullId", {
    params: { orgId: Schema.String, pullId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.get("activity", "/orgs/:orgId/pulls/:pullId/activity", {
    params: { orgId: Schema.String, pullId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.post("publishAssets", "/orgs/:orgId/pulls/:pullId/assets", {
    params: { orgId: Schema.String, pullId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.post("setAutoMerge", "/orgs/:orgId/pulls/:pullId/automerge", {
    params: { orgId: Schema.String, pullId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.get("checks", "/orgs/:orgId/pulls/:pullId/checks", {
    params: { orgId: Schema.String, pullId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.post("close", "/orgs/:orgId/pulls/:pullId/close", {
    params: { orgId: Schema.String, pullId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.post("comment", "/orgs/:orgId/pulls/:pullId/comments", {
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
    params: { orgId: Schema.String, pullId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.get("fileUrls", "/orgs/:orgId/pulls/:pullId/diff/file-urls", {
    params: { orgId: Schema.String, pullId: Schema.String },
    query: UndecodedQuery,
    success: Undecoded,
  }),
  HttpApiEndpoint.post("setDraft", "/orgs/:orgId/pulls/:pullId/draft", {
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
    params: { orgId: Schema.String, pullId: Schema.String },
    query: UndecodedQuery,
    success: Undecoded,
  }),
  HttpApiEndpoint.get("labels", "/orgs/:orgId/pulls/:pullId/labels", {
    params: { orgId: Schema.String, pullId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.post("setLabel", "/orgs/:orgId/pulls/:pullId/labels", {
    params: { orgId: Schema.String, pullId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.post("merge", "/orgs/:orgId/pulls/:pullId/merge", {
    params: { orgId: Schema.String, pullId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.post("reopen", "/orgs/:orgId/pulls/:pullId/reopen", {
    params: { orgId: Schema.String, pullId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.get("review", "/orgs/:orgId/pulls/:pullId/review", {
    params: { orgId: Schema.String, pullId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.post("requestReview", "/orgs/:orgId/pulls/:pullId/review", {
    params: { orgId: Schema.String, pullId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.get("reviewSkip", "/orgs/:orgId/pulls/:pullId/review-skip", {
    params: { orgId: Schema.String, pullId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.get("reviewers", "/orgs/:orgId/pulls/:pullId/reviewers", {
    params: { orgId: Schema.String, pullId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.post("setReviewer", "/orgs/:orgId/pulls/:pullId/reviewers", {
    params: { orgId: Schema.String, pullId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.post("submitReview", "/orgs/:orgId/pulls/:pullId/reviews", {
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
    params: { orgId: Schema.String, pullId: Schema.String },
    query: UndecodedQuery,
    success: Undecoded,
  }),
  HttpApiEndpoint.get("stackTree", "/orgs/:orgId/pulls/:pullId/stack-tree", {
    params: { orgId: Schema.String, pullId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.get("summary", "/orgs/:orgId/pulls/:pullId/summary", {
    params: { orgId: Schema.String, pullId: Schema.String },
    query: UndecodedQuery,
    success: Undecoded,
  }),
  HttpApiEndpoint.get(
    "summaryLatest",
    "/orgs/:orgId/pulls/:pullId/summary/latest",
    {
      params: { orgId: Schema.String, pullId: Schema.String },
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.get("threads", "/orgs/:orgId/pulls/:pullId/threads", {
    params: { orgId: Schema.String, pullId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.post("linkThread", "/orgs/:orgId/pulls/:pullId/threads", {
    params: { orgId: Schema.String, pullId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.delete(
    "unlinkThread",
    "/orgs/:orgId/pulls/:pullId/threads/:jamId",
    {
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
      params: { orgId: Schema.String, pullId: Schema.String },
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.get(
    "viewedFiles",
    "/orgs/:orgId/pulls/:pullId/viewed-files",
    {
      params: { orgId: Schema.String, pullId: Schema.String },
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.put(
    "setFileViewed",
    "/orgs/:orgId/pulls/:pullId/viewed-files",
    {
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
    query: { repo: Schema.String },
    success: Schema.Array(Schema.String),
  }),
  HttpApiEndpoint.post("byNumber", "/orgs/:orgId/pulls/by-number", {
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
