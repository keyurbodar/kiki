import { Schema } from "effect";
import { OrgId, ProjectId } from "./ids.ts";

const OAuthCode = Schema.String.check(
  Schema.isMinLength(1),
  Schema.isMaxLength(2048),
);
const OAuthError = Schema.String.check(
  Schema.isMinLength(1),
  Schema.isMaxLength(256),
);
const OAuthState = Schema.String.check(
  Schema.isMinLength(1),
  Schema.isMaxLength(512),
);

const oauthRequest = (identifier: string) =>
  Schema.Struct({
    code: Schema.optional(OAuthCode),
    state: OAuthState,
    error: Schema.optional(OAuthError),
  }).annotate({ identifier });

export const CompleteSlackOAuthRequest = oauthRequest(
  "CompleteSlackOAuthRequest",
);
export const CompleteLinearOAuthRequest = oauthRequest(
  "CompleteLinearOAuthRequest",
);
export const CompletePaperOAuthRequest = oauthRequest(
  "CompletePaperOAuthRequest",
);

export const CompleteGitHubOAuthRequest = Schema.Struct({
  code: Schema.optional(OAuthCode),
  state: Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(8192)),
  error: Schema.optional(OAuthError),
  installationId: Schema.optional(Schema.Int.check(Schema.isGreaterThan(0))),
  setupAction: Schema.optional(Schema.Literal("request")),
}).annotate({ identifier: "CompleteGitHubOAuthRequest" });

export const OAuthCompletionResult = Schema.Literals(["connected", "denied"]);
export type OAuthCompletionResult = typeof OAuthCompletionResult.Type;

export class SlackOAuthCompletion extends Schema.Class<SlackOAuthCompletion>(
  "SlackOAuthCompletion",
)({
  result: OAuthCompletionResult,
  desktopScheme: Schema.optional(Schema.String),
}) {}

export class LinearOAuthCompletion extends Schema.Class<LinearOAuthCompletion>(
  "LinearOAuthCompletion",
)({
  result: OAuthCompletionResult,
  desktopScheme: Schema.optional(Schema.String),
}) {}

export class PaperOAuthCompletion extends Schema.Class<PaperOAuthCompletion>(
  "PaperOAuthCompletion",
)({
  result: OAuthCompletionResult,
  desktopScheme: Schema.optional(Schema.String),
}) {}

export const GitHubReturnTo = Schema.Literals([
  "settings",
  "onboarding",
  "project",
  "picker",
]);
export type GitHubReturnTo = typeof GitHubReturnTo.Type;

export class GitHubOAuthCompletion extends Schema.Class<GitHubOAuthCompletion>(
  "GitHubOAuthCompletion",
)({
  result: Schema.Literals([
    "connected",
    "denied",
    "failed",
    "install",
    "choose",
  ]),
  reason: Schema.optional(Schema.String),
  projectId: Schema.optional(Schema.NullOr(ProjectId)),
  orgId: OrgId,
  returnTo: Schema.optional(Schema.NullOr(GitHubReturnTo)),
  desktopScheme: Schema.optional(Schema.String),
  installUrl: Schema.optional(Schema.String),
}) {}

export const CompleteSlackLinkRequest = Schema.Struct({
  token: Schema.String,
}).annotate({ identifier: "CompleteSlackLinkRequest" });

export const CompleteLinearLinkRequest = Schema.Struct({
  token: Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(512)),
}).annotate({ identifier: "CompleteLinearLinkRequest" });

export class SlackLinkPreview extends Schema.Class<SlackLinkPreview>(
  "SlackLinkPreview",
)({
  externalUserId: Schema.String,
  externalUserName: Schema.NullOr(Schema.String),
  avatarUrl: Schema.NullOr(Schema.String),
  workspaceName: Schema.NullOr(Schema.String),
  orgName: Schema.String,
}) {}

export class LinearLinkPreview extends Schema.Class<LinearLinkPreview>(
  "LinearLinkPreview",
)({
  externalUserId: Schema.String,
  externalUserName: Schema.NullOr(Schema.String),
  workspaceName: Schema.NullOr(Schema.String),
  orgName: Schema.String,
}) {}
