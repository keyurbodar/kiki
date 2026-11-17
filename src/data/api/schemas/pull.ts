import { Schema } from "effect";
import { withDefault } from "./defaults.ts";
import { JamId, ProjectId, PullRequestId, Timestamp } from "./ids.ts";

export const pullStates = [
  "ready",
  "pending",
  "failed",
  "draft",
  "merged",
  "closed",
] as const;

export const PullState = Schema.Literals(pullStates);
export type PullState = typeof PullState.Type;

export const ChecksState = Schema.Literals([
  "none",
  "pending",
  "passed",
  "failed",
]);
export type ChecksState = typeof ChecksState.Type;

/** The thread a pull links to, as the list row's thread badge shows it. */
export class PullThreadChip extends Schema.Class<PullThreadChip>(
  "PullThreadChip",
)({
  id: JamId,
  number: Schema.Int,
  title: Schema.String,
  projectCode: Schema.NullOr(Schema.String).pipe(withDefault(null)),
}) {}

/** Capy's `PullRequestCard`: one row of `GET /orgs/:orgId/pulls`. */
export class PullRequestCard extends Schema.Class<PullRequestCard>(
  "PullRequestCard",
)({
  id: PullRequestId,
  projectId: Schema.NullOr(ProjectId),
  repo: Schema.String,
  number: Schema.Int,
  title: Schema.String,
  state: PullState,
  checksState: ChecksState.pipe(withDefault("none")),
  additions: Schema.Int,
  deletions: Schema.Int,
  diffBreakdown: Schema.NullOr(Schema.Unknown).pipe(withDefault(null)),
  author: Schema.String,
  authorAvatarUrl: Schema.String,
  url: Schema.String,
  headRef: Schema.String,
  baseRef: Schema.String,
  threadId: Schema.NullOr(JamId),
  thread: Schema.NullOr(PullThreadChip),
  jamId: Schema.NullOr(JamId),
  parentId: Schema.NullOr(PullRequestId),
  stackNumber: Schema.NullOr(Schema.Int).pipe(withDefault(null)),
  stackPosition: Schema.NullOr(Schema.Int).pipe(withDefault(null)),
  createdAt: Timestamp,
  updatedAt: Timestamp,
}) {}

/** `cursor` is `<updatedAt ms>:<pull id>` as in Capy's `PullRequestPage`. */
export class PullRequestPage extends Schema.Class<PullRequestPage>(
  "PullRequestPage",
)({
  items: Schema.Array(PullRequestCard),
  cursor: Schema.NullOr(Schema.String),
}) {}

const QueryList = <S extends Schema.Top>(item: S) =>
  Schema.optional(Schema.Array(item));

export const PullListQuery = {
  projectIds: QueryList(Schema.String),
  excludedProjectIds: QueryList(Schema.String),
  state: QueryList(PullState),
  excludedState: QueryList(PullState),
  authors: QueryList(Schema.String),
  repos: QueryList(Schema.String),
  labels: QueryList(Schema.String),
  captainIds: QueryList(Schema.String),
  updatedAfter: Schema.optional(Schema.String),
  search: Schema.optional(Schema.String),
  limit: Schema.optional(Schema.String),
  cursor: Schema.optional(Schema.String),
};

export const CreatePullRequestRequest = Schema.Struct({
  repo: Schema.String,
  base: Schema.String,
  head: Schema.String,
  title: Schema.String,
  body: Schema.optional(Schema.String),
  draft: Schema.optional(Schema.Boolean),
}).annotate({ identifier: "CreatePullRequestRequest" });
export type CreatePullRequestRequest = typeof CreatePullRequestRequest.Type;

export class GitHubInstallationRepo extends Schema.Class<GitHubInstallationRepo>(
  "GitHubInstallationRepo",
)({
  githubRepoId: Schema.Int,
  repoFullName: Schema.String,
  defaultBranch: Schema.NullOr(Schema.String),
  pushedAt: Schema.NullOr(Timestamp),
  archived: Schema.Boolean,
}) {}

export class GitHubInstallationRepoList extends Schema.Class<GitHubInstallationRepoList>(
  "GitHubInstallationRepoList",
)({
  state: Schema.Literals(["ok", "connect_required"]),
  repos: Schema.Array(GitHubInstallationRepo),
}) {}
