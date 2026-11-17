import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import { InferredMethod } from "../annotations.ts";
import { Undecoded } from "../undecoded.ts";

export class GithubGroup extends HttpApiGroup.make("github").add(
  HttpApiEndpoint.get(
    "listDependencyReaderRepos",
    "/orgs/:orgId/github/dependency-reader/repos",
    { params: { orgId: Schema.String }, success: Undecoded },
  ),
  HttpApiEndpoint.get("getGitHubSecondary", "/orgs/:orgId/github/secondary", {
    params: { orgId: Schema.String },
    success: Undecoded,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "disconnectGitHubSecondary",
    "/orgs/:orgId/github/secondary/disconnect",
    { params: { orgId: Schema.String }, success: Undecoded },
  ).annotate(InferredMethod, true),
) {}
