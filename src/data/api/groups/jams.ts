import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import { Forbidden, InvalidRequest, JamNotFound } from "../schemas/errors.ts";
import {
  ActorId,
  JamId,
  OrgId,
  ProjectId,
  ThreadFolderId,
  ThreadTagId,
  Timestamp,
} from "../schemas/ids.ts";
import {
  JamArchiveResult,
  JamBatchRequest,
  JamBatchResult,
  JamDetail,
  RenameJamRequest,
  ThreadCard,
  ThreadCardPage,
  ThreadCounts,
  ThreadOrigin,
  ThreadPullState,
  ThreadSort,
} from "../schemas/thread.ts";
import { Undecoded, UndecodedQuery } from "../undecoded.ts";

const threadFilterQuery = {
  projectIds: Schema.optional(Schema.Array(ProjectId)),
  origins: Schema.optional(Schema.Array(ThreadOrigin)),
  automationIds: Schema.optional(Schema.Array(Schema.String)),
  userIds: Schema.optional(Schema.Array(ActorId)),
  tagIds: Schema.optional(Schema.Array(ThreadTagId)),
  prStates: Schema.optional(Schema.Array(ThreadPullState)),
  folderId: Schema.optional(ThreadFolderId),
  participantIds: Schema.optional(Schema.Array(ActorId)),
  channelIds: Schema.optional(Schema.Array(Schema.String)),
  createdAfter: Schema.optional(Timestamp),
  createdBefore: Schema.optional(Timestamp),
  activityAfter: Schema.optional(Timestamp),
  activityBefore: Schema.optional(Timestamp),
  archived: Schema.optional(Schema.Literals(["exclude", "only"])),
  deleted: Schema.optional(Schema.Literals(["only"])),
};

export class JamsGroup extends HttpApiGroup.make("jams").add(
  HttpApiEndpoint.get("organization", "/jams/:jamId/organization", {
    params: { jamId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.get("list", "/orgs/:orgId/jams", {
    params: { orgId: OrgId },
    query: {
      sort: Schema.optional(ThreadSort),
      limit: Schema.optional(Schema.NumberFromString),
      cursor: Schema.optional(Schema.String),
      search: Schema.optional(Schema.String),
      ...threadFilterQuery,
      filed: Schema.optional(Schema.Literals(["exclude"])),
    },
    success: ThreadCardPage,
  }),
  HttpApiEndpoint.post("createProjectless", "/orgs/:orgId/jams", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.get("get", "/orgs/:orgId/jams/:jamId", {
    params: { orgId: OrgId, jamId: JamId },
    success: JamDetail,
    error: JamNotFound,
  }),
  HttpApiEndpoint.patch("rename", "/orgs/:orgId/jams/:jamId", {
    params: { orgId: OrgId, jamId: JamId },
    payload: RenameJamRequest,
    success: ThreadCard,
    error: [JamNotFound, Forbidden],
  }),
  HttpApiEndpoint.put("setThreadAccess", "/orgs/:orgId/jams/:jamId/access", {
    params: { orgId: Schema.String, jamId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.post(
    "requestThreadAccess",
    "/orgs/:orgId/jams/:jamId/access-requests",
    {
      params: { orgId: Schema.String, jamId: Schema.String },
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.get(
    "threadAccessRequests",
    "/orgs/:orgId/jams/:jamId/access-requests",
    {
      params: { orgId: Schema.String, jamId: Schema.String },
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.delete(
    "declineThreadAccessRequest",
    "/orgs/:orgId/jams/:jamId/access-requests/:userId",
    {
      params: {
        orgId: Schema.String,
        jamId: Schema.String,
        userId: Schema.String,
      },
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.get("ad", "/orgs/:orgId/jams/:jamId/ad", {
    params: { orgId: Schema.String, jamId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.put("setCompactAt", "/orgs/:orgId/jams/:jamId/compact-at", {
    params: { orgId: Schema.String, jamId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.post(
    "retryConnection",
    "/orgs/:orgId/jams/:jamId/connections/retry",
    {
      params: { orgId: Schema.String, jamId: Schema.String },
      payload: Undecoded,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.post(
    "readConnectionUsage",
    "/orgs/:orgId/jams/:jamId/connections/usage",
    {
      params: { orgId: Schema.String, jamId: Schema.String },
      payload: Undecoded,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.post("answerCredits", "/orgs/:orgId/jams/:jamId/credits", {
    params: { orgId: Schema.String, jamId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.delete("revokeCredits", "/orgs/:orgId/jams/:jamId/credits", {
    params: { orgId: Schema.String, jamId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.post(
    "desktopRequestDone",
    "/orgs/:orgId/jams/:jamId/desktop-requests/:toolCallId/done",
    {
      params: {
        orgId: Schema.String,
        jamId: Schema.String,
        toolCallId: Schema.String,
      },
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.get(
    "listEnvironmentVariables",
    "/orgs/:orgId/jams/:jamId/environment-variables",
    {
      params: { orgId: Schema.String, jamId: Schema.String },
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.put(
    "setEnvironmentVariables",
    "/orgs/:orgId/jams/:jamId/environment-variables",
    {
      params: { orgId: Schema.String, jamId: Schema.String },
      payload: Undecoded,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.delete(
    "deleteEnvironmentVariable",
    "/orgs/:orgId/jams/:jamId/environment-variables/:name",
    {
      params: {
        orgId: Schema.String,
        jamId: Schema.String,
        name: Schema.String,
      },
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.post(
    "refreshEnvironment",
    "/orgs/:orgId/jams/:jamId/environment-variables/refresh",
    {
      params: { orgId: Schema.String, jamId: Schema.String },
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.post(
    "feedbackRequestDecline",
    "/orgs/:orgId/jams/:jamId/feedback-requests/:toolCallId/decline",
    {
      params: {
        orgId: Schema.String,
        jamId: Schema.String,
        toolCallId: Schema.String,
      },
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.post(
    "feedbackRequestSend",
    "/orgs/:orgId/jams/:jamId/feedback-requests/:toolCallId/send",
    {
      params: {
        orgId: Schema.String,
        jamId: Schema.String,
        toolCallId: Schema.String,
      },
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.post("fork", "/orgs/:orgId/jams/:jamId/fork", {
    params: { orgId: Schema.String, jamId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.get("threadIssues", "/orgs/:orgId/jams/:jamId/issues", {
    params: { orgId: Schema.String, jamId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.put("setThreadIssues", "/orgs/:orgId/jams/:jamId/issues", {
    params: { orgId: Schema.String, jamId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.post("joinThread", "/orgs/:orgId/jams/:jamId/join", {
    params: { orgId: Schema.String, jamId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.put("setJoinPolicy", "/orgs/:orgId/jams/:jamId/join-policy", {
    params: { orgId: Schema.String, jamId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.post("leaveThread", "/orgs/:orgId/jams/:jamId/leave", {
    params: { orgId: Schema.String, jamId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.post(
    "inviteThreadMembers",
    "/orgs/:orgId/jams/:jamId/members",
    {
      params: { orgId: Schema.String, jamId: Schema.String },
      payload: Undecoded,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.delete(
    "removeThreadMembers",
    "/orgs/:orgId/jams/:jamId/members",
    {
      params: { orgId: Schema.String, jamId: Schema.String },
      query: UndecodedQuery,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.put("setThreadOwner", "/orgs/:orgId/jams/:jamId/owner", {
    params: { orgId: Schema.String, jamId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.put("read", "/orgs/:orgId/jams/:jamId/read", {
    params: { orgId: Schema.String, jamId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.post(
    "regenerateTitle",
    "/orgs/:orgId/jams/:jamId/regenerate-title",
    {
      params: { orgId: Schema.String, jamId: Schema.String },
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.post("settle", "/orgs/:orgId/jams/:jamId/settle", {
    params: { orgId: Schema.String, jamId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.post(
    "createSideThread",
    "/orgs/:orgId/jams/:jamId/side-threads",
    {
      params: { orgId: Schema.String, jamId: Schema.String },
      payload: Undecoded,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.post("linkSlack", "/orgs/:orgId/jams/:jamId/slack", {
    params: { orgId: Schema.String, jamId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.patch("setSlackActive", "/orgs/:orgId/jams/:jamId/slack", {
    params: { orgId: Schema.String, jamId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.post("takeover", "/orgs/:orgId/jams/:jamId/takeover", {
    params: { orgId: Schema.String, jamId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.post(
    "terminalRequestDone",
    "/orgs/:orgId/jams/:jamId/terminal-requests/:toolCallId/done",
    {
      params: {
        orgId: Schema.String,
        jamId: Schema.String,
        toolCallId: Schema.String,
      },
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.put("unread", "/orgs/:orgId/jams/:jamId/unread", {
    params: { orgId: Schema.String, jamId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.post("unsettle", "/orgs/:orgId/jams/:jamId/unsettle", {
    params: { orgId: Schema.String, jamId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.post(
    "unsubscribeThread",
    "/orgs/:orgId/jams/:jamId/unsubscribe",
    {
      params: { orgId: Schema.String, jamId: Schema.String },
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.get("usage", "/orgs/:orgId/jams/:jamId/usage", {
    params: { orgId: Schema.String, jamId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.post("archive", "/orgs/:orgId/jams/archive", {
    params: { orgId: OrgId },
    payload: JamBatchRequest,
    success: JamArchiveResult,
    error: InvalidRequest,
  }),
  HttpApiEndpoint.get("asks", "/orgs/:orgId/jams/asks", {
    params: { orgId: Schema.String },
    query: UndecodedQuery,
    success: Undecoded,
  }),
  HttpApiEndpoint.post("dismissAsks", "/orgs/:orgId/jams/asks/dismiss", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.post("reopenAsks", "/orgs/:orgId/jams/asks/reopen", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.get("counts", "/orgs/:orgId/jams/counts", {
    params: { orgId: OrgId },
    query: threadFilterQuery,
    success: ThreadCounts,
  }),
  HttpApiEndpoint.post("delete", "/orgs/:orgId/jams/delete", {
    params: { orgId: OrgId },
    payload: JamBatchRequest,
    success: JamBatchResult,
    error: InvalidRequest,
  }),
  HttpApiEndpoint.post("readAll", "/orgs/:orgId/jams/read-all", {
    params: { orgId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.post("restore", "/orgs/:orgId/jams/restore", {
    params: { orgId: OrgId },
    payload: JamBatchRequest,
    success: JamBatchResult,
    error: InvalidRequest,
  }),
  HttpApiEndpoint.post("unarchive", "/orgs/:orgId/jams/unarchive", {
    params: { orgId: OrgId },
    payload: JamBatchRequest,
    success: JamBatchResult,
    error: InvalidRequest,
  }),
  HttpApiEndpoint.post("create", "/orgs/:orgId/projects/:projectId/jams", {
    params: { orgId: Schema.String, projectId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
) {}
