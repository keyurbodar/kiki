import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiError, HttpApiGroup } from "effect/http-api";
import { InferredMethod } from "../annotations.ts";
import { Undecoded } from "../undecoded.ts";

export class GithubGroup extends HttpApiGroup.make("github").add(
  HttpApiEndpoint.get(
    "listDependencyReaderRepos",
    "/orgs/:orgId/github/dependency-reader/repos",
    {
      error: HttpApiError.NotFoundNoContent,
      params: { orgId: Schema.String },
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.get("getGitHubSecondary", "/orgs/:orgId/github/secondary", {
    error: HttpApiError.NotFoundNoContent,
    params: { orgId: Schema.String },
    success: Undecoded,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "disconnectGitHubSecondary",
    "/orgs/:orgId/github/secondary/disconnect",
    {
      error: HttpApiError.NotFoundNoContent,
      params: { orgId: Schema.String },
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
) {}
