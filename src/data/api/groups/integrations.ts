import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import { InferredMethod } from "../annotations.ts";
import {
  GitHubInstallationConnection,
  GitHubUserConnection,
  GitHubWorkspaceConnection,
  LinearConnection,
  PaperStatus,
  SlackConnection,
  TailscaleConnection,
} from "../schemas/integrations.ts";
import { Undecoded, UndecodedQuery } from "../undecoded.ts";

export class IntegrationsGroup extends HttpApiGroup.make("integrations").add(
  HttpApiEndpoint.post(
    "completeGitHubOAuth",
    "/integrations/github/oauth/complete",
    { payload: Undecoded, success: Undecoded },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.get("getGitHubUser", "/integrations/github/user", {
    success: Schema.NullOr(GitHubUserConnection),
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.delete("disconnectGitHubUser", "/integrations/github/user", {
    success: Undecoded,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.post("completeLinearLink", "/integrations/linear/links", {
    payload: Undecoded,
    success: Undecoded,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "previewLinearLink",
    "/integrations/linear/links/preview",
    { payload: Undecoded, success: Undecoded },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "completeLinearOAuth",
    "/integrations/linear/oauth/complete",
    { payload: Undecoded, success: Undecoded },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.get("getPaper", "/integrations/paper", {
    success: PaperStatus,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.delete("disconnectPaper", "/integrations/paper", {
    success: Undecoded,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "completePaperOAuth",
    "/integrations/paper/oauth/complete",
    { payload: Undecoded, success: Undecoded },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.post("completeSlackLink", "/integrations/slack/links", {
    payload: Undecoded,
    success: Undecoded,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "previewSlackLink",
    "/integrations/slack/links/preview",
    { payload: Undecoded, success: Undecoded },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "completeSlackOAuth",
    "/integrations/slack/oauth/complete",
    { payload: Undecoded, success: Undecoded },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "disconnectGitHubDependencyReader",
    "/orgs/:orgId/github/dependency-reader/disconnect",
    { params: { orgId: Schema.String }, success: Undecoded },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.get(
    "getGitHubInstallation",
    "/orgs/:orgId/integrations/github/installation",
    {
      params: { orgId: Schema.String },
      success: Schema.NullOr(GitHubInstallationConnection),
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.delete(
    "disconnectGitHubInstallation",
    "/orgs/:orgId/integrations/github/installation",
    { params: { orgId: Schema.String }, success: Undecoded },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.delete(
    "unlinkGitHubInstallation",
    "/orgs/:orgId/integrations/github/installation/:installationId",
    {
      params: { orgId: Schema.String, installationId: Schema.String },
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "linkGitHubInstallation",
    "/orgs/:orgId/integrations/github/installation/link",
    {
      params: { orgId: Schema.String },
      payload: Undecoded,
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.get(
    "listGitHubReachableInstallations",
    "/orgs/:orgId/integrations/github/installation/reachable",
    { params: { orgId: Schema.String }, success: Undecoded },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.get(
    "listGitHubInstallationRepos",
    "/orgs/:orgId/integrations/github/installation/repos",
    { params: { orgId: Schema.String }, success: Undecoded },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "startGitHubInstallation",
    "/orgs/:orgId/integrations/github/installation/start",
    {
      params: { orgId: Schema.String },
      query: UndecodedQuery,
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "startGitHubUserOAuth",
    "/orgs/:orgId/integrations/github/user/start",
    {
      params: { orgId: Schema.String },
      query: UndecodedQuery,
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.get(
    "getGitHubWorkspace",
    "/orgs/:orgId/integrations/github/workspace",
    {
      params: { orgId: Schema.String },
      success: Schema.NullOr(GitHubWorkspaceConnection),
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.get("getLinear", "/orgs/:orgId/integrations/linear", {
    params: { orgId: Schema.String },
    success: Schema.NullOr(LinearConnection),
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.patch("updateLinear", "/orgs/:orgId/integrations/linear", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.delete(
    "disconnectLinear",
    "/orgs/:orgId/integrations/linear",
    { params: { orgId: Schema.String }, success: Undecoded },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.get(
    "listLinearLabels",
    "/orgs/:orgId/integrations/linear/labels",
    { params: { orgId: Schema.String }, success: Undecoded },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.get(
    "listLinearLinks",
    "/orgs/:orgId/integrations/linear/links",
    { params: { orgId: Schema.String }, success: Undecoded },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.delete(
    "deleteLinearLink",
    "/orgs/:orgId/integrations/linear/links/:linkId",
    {
      params: { orgId: Schema.String, linkId: Schema.String },
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "startLinearOAuth",
    "/orgs/:orgId/integrations/linear/oauth/start",
    { params: { orgId: Schema.String }, success: Undecoded },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.get(
    "listLinearTeams",
    "/orgs/:orgId/integrations/linear/teams",
    { params: { orgId: Schema.String }, success: Undecoded },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "startPaperOAuth",
    "/orgs/:orgId/integrations/paper/oauth/start",
    { params: { orgId: Schema.String }, success: Undecoded },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.get("getSlack", "/orgs/:orgId/integrations/slack", {
    params: { orgId: Schema.String },
    success: Schema.NullOr(SlackConnection),
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.patch("updateSlack", "/orgs/:orgId/integrations/slack", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.delete("disconnectSlack", "/orgs/:orgId/integrations/slack", {
    params: { orgId: Schema.String },
    success: Undecoded,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.get(
    "listSlackChannels",
    "/orgs/:orgId/integrations/slack/channels",
    { params: { orgId: Schema.String }, success: Undecoded },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.get(
    "listSlackEmojis",
    "/orgs/:orgId/integrations/slack/emojis",
    { params: { orgId: Schema.String }, success: Undecoded },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.get(
    "listSlackLinks",
    "/orgs/:orgId/integrations/slack/links",
    { params: { orgId: Schema.String }, success: Undecoded },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.delete(
    "deleteSlackLink",
    "/orgs/:orgId/integrations/slack/links/:linkId",
    {
      params: { orgId: Schema.String, linkId: Schema.String },
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "linkSlackSelf",
    "/orgs/:orgId/integrations/slack/links/self",
    { params: { orgId: Schema.String }, success: Undecoded },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "startSlackOAuth",
    "/orgs/:orgId/integrations/slack/oauth/start",
    {
      params: { orgId: Schema.String },
      payload: Undecoded,
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.get(
    "getSlackUserRead",
    "/orgs/:orgId/integrations/slack/user-read",
    { params: { orgId: Schema.String }, success: Undecoded },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.patch(
    "setSlackUserReadAccess",
    "/orgs/:orgId/integrations/slack/user-read",
    {
      params: { orgId: Schema.String },
      payload: Undecoded,
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.delete(
    "disconnectSlackUserRead",
    "/orgs/:orgId/integrations/slack/user-read",
    { params: { orgId: Schema.String }, success: Undecoded },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "denySlackUserRead",
    "/orgs/:orgId/integrations/slack/user-read/access/:accessId/deny",
    {
      params: { orgId: Schema.String, accessId: Schema.String },
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "grantSlackUserRead",
    "/orgs/:orgId/integrations/slack/user-read/access/:accessId/grant",
    {
      params: { orgId: Schema.String, accessId: Schema.String },
      payload: Undecoded,
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "revokeSlackUserRead",
    "/orgs/:orgId/integrations/slack/user-read/access/:accessId/revoke",
    {
      params: { orgId: Schema.String, accessId: Schema.String },
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "startSlackUserReadOAuth",
    "/orgs/:orgId/integrations/slack/user-read/oauth/start",
    { params: { orgId: Schema.String }, success: Undecoded },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.get(
    "listSlackUsers",
    "/orgs/:orgId/integrations/slack/users",
    {
      params: { orgId: Schema.String },
      query: UndecodedQuery,
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.get("getTailscale", "/orgs/:orgId/integrations/tailscale", {
    params: { orgId: Schema.String },
    success: Schema.NullOr(TailscaleConnection),
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.put(
    "connectTailscale",
    "/orgs/:orgId/integrations/tailscale",
    {
      params: { orgId: Schema.String },
      payload: Undecoded,
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.delete(
    "disconnectTailscale",
    "/orgs/:orgId/integrations/tailscale",
    { params: { orgId: Schema.String }, success: Undecoded },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.get(
    "listThreadSlackUserReadAccess",
    "/orgs/:orgId/threads/:threadId/slack-user-read",
    {
      params: { orgId: Schema.String, threadId: Schema.String },
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
) {}
