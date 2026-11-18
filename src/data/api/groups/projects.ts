import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiError, HttpApiGroup } from "effect/http-api";
import { OrgId } from "../schemas/ids.ts";
import { Project, ProjectColor, ProjectIcon } from "../schemas/project.ts";
import {
  ProjectDependencyRepo,
  ProjectEnvironmentVariable,
  ProjectEnvironmentVariableValue,
  ProjectSettingsDirectoryPage,
  ProjectSetup,
  ProjectSnapshotConfig,
  ReplaceDependencyReposRequest,
  ReplaceProjectSetupRequest,
  SetEnvironmentVariableRequest,
  SetEnvironmentVariablesRequest,
  SnapshotBuild,
  SnapshotBuildSummary,
  StartSnapshotBuildRequest,
} from "../schemas/project-settings.ts";
import { Undecoded, UndecodedQuery } from "../undecoded.ts";

export class ProjectsGroup extends HttpApiGroup.make("projects").add(
  HttpApiEndpoint.get("listed", "/orgs/:orgId/project-listing", {
    params: { orgId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.get(
    "settingsDirectory",
    "/orgs/:orgId/project-settings-directory",
    {
      params: { orgId: Schema.String },
      query: {
        search: Schema.optional(Schema.String),
        page: Schema.optional(Schema.String),
      },
      success: ProjectSettingsDirectoryPage,
    },
  ),
  HttpApiEndpoint.get("list", "/orgs/:orgId/projects", {
    params: { orgId: OrgId },
    query: { deleted: Schema.optional(Schema.Literals(["true", "false"])) },
    success: Schema.Array(Project),
  }),
  HttpApiEndpoint.post("create", "/orgs/:orgId/projects", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.get("get", "/orgs/:orgId/projects/:projectId", {
    params: { orgId: Schema.String, projectId: Schema.String },
    success: Project,
  }),
  HttpApiEndpoint.patch("update", "/orgs/:orgId/projects/:projectId", {
    params: { orgId: Schema.String, projectId: Schema.String },
    payload: Schema.Struct({
      name: Schema.optional(Schema.NullOr(Schema.String)),
      description: Schema.optional(Schema.NullOr(Schema.String)),
      icon: Schema.optional(ProjectIcon),
      color: Schema.optional(ProjectColor),
      code: Schema.optional(Schema.String),
      tailscaleEnabled: Schema.optional(Schema.Boolean),
      tailscaleAcceptDns: Schema.optional(Schema.Boolean),
    }),
    success: Project,
  }),
  HttpApiEndpoint.delete("delete", "/orgs/:orgId/projects/:projectId", {
    params: { orgId: Schema.String, projectId: Schema.String },
    success: Project,
  }),
  HttpApiEndpoint.get(
    "listDependencyRepos",
    "/orgs/:orgId/projects/:projectId/dependency-repos",
    {
      params: { orgId: Schema.String, projectId: Schema.String },
      success: Schema.Array(ProjectDependencyRepo),
    },
  ),
  HttpApiEndpoint.put(
    "replaceDependencyRepos",
    "/orgs/:orgId/projects/:projectId/dependency-repos",
    {
      params: { orgId: Schema.String, projectId: Schema.String },
      payload: ReplaceDependencyReposRequest,
      success: Schema.Array(ProjectDependencyRepo),
    },
  ),
  HttpApiEndpoint.get(
    "listEnvironmentVariables",
    "/orgs/:orgId/projects/:projectId/environment-variables",
    {
      params: { orgId: Schema.String, projectId: Schema.String },
      success: Schema.Array(ProjectEnvironmentVariable),
    },
  ),
  HttpApiEndpoint.post(
    "setEnvironmentVariables",
    "/orgs/:orgId/projects/:projectId/environment-variables",
    {
      params: { orgId: Schema.String, projectId: Schema.String },
      payload: SetEnvironmentVariablesRequest,
      success: Schema.Array(ProjectEnvironmentVariable),
    },
  ),
  HttpApiEndpoint.put(
    "setEnvironmentVariable",
    "/orgs/:orgId/projects/:projectId/environment-variables/:name",
    {
      params: {
        orgId: Schema.String,
        projectId: Schema.String,
        name: Schema.String,
      },
      payload: SetEnvironmentVariableRequest,
      success: Schema.Array(ProjectEnvironmentVariable),
    },
  ),
  HttpApiEndpoint.delete(
    "deleteEnvironmentVariable",
    "/orgs/:orgId/projects/:projectId/environment-variables/:name",
    {
      params: {
        orgId: Schema.String,
        projectId: Schema.String,
        name: Schema.String,
      },
      success: Schema.Array(ProjectEnvironmentVariable),
    },
  ),
  HttpApiEndpoint.get(
    "getEnvironmentVariableValue",
    "/orgs/:orgId/projects/:projectId/environment-variables/:name/value",
    {
      params: {
        orgId: Schema.String,
        projectId: Schema.String,
        name: Schema.String,
      },
      success: ProjectEnvironmentVariableValue,
    },
  ),
  HttpApiEndpoint.post(
    "setPersonalEnvironmentVariables",
    "/orgs/:orgId/projects/:projectId/environment-variables/personal",
    {
      params: { orgId: Schema.String, projectId: Schema.String },
      payload: SetEnvironmentVariablesRequest,
      success: Schema.Array(ProjectEnvironmentVariable),
    },
  ),
  HttpApiEndpoint.get(
    "listPersonalEnvironmentVariables",
    "/orgs/:orgId/projects/:projectId/environment-variables/personal",
    {
      params: { orgId: Schema.String, projectId: Schema.String },
      success: Schema.Array(ProjectEnvironmentVariable),
    },
  ),
  HttpApiEndpoint.put(
    "setPersonalEnvironmentVariable",
    "/orgs/:orgId/projects/:projectId/environment-variables/personal/:name",
    {
      params: {
        orgId: Schema.String,
        projectId: Schema.String,
        name: Schema.String,
      },
      payload: SetEnvironmentVariableRequest,
      success: Schema.Array(ProjectEnvironmentVariable),
    },
  ),
  HttpApiEndpoint.delete(
    "deletePersonalEnvironmentVariable",
    "/orgs/:orgId/projects/:projectId/environment-variables/personal/:name",
    {
      params: {
        orgId: Schema.String,
        projectId: Schema.String,
        name: Schema.String,
      },
      success: Schema.Array(ProjectEnvironmentVariable),
    },
  ),
  HttpApiEndpoint.get(
    "getPersonalEnvironmentVariableValue",
    "/orgs/:orgId/projects/:projectId/environment-variables/personal/:name/value",
    {
      params: {
        orgId: Schema.String,
        projectId: Schema.String,
        name: Schema.String,
      },
      success: ProjectEnvironmentVariableValue,
    },
  ),
  HttpApiEndpoint.get(
    "searchGithubAuthors",
    "/orgs/:orgId/projects/:projectId/github-authors",
    {
      params: { orgId: Schema.String, projectId: Schema.String },
      query: UndecodedQuery,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.post("uploadLogo", "/orgs/:orgId/projects/:projectId/logo", {
    params: { orgId: Schema.String, projectId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.delete(
    "removeLogo",
    "/orgs/:orgId/projects/:projectId/logo",
    {
      params: { orgId: Schema.String, projectId: Schema.String },
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.post(
    "addMembers",
    "/orgs/:orgId/projects/:projectId/members",
    {
      error: HttpApiError.NotFoundNoContent,
      params: { orgId: Schema.String, projectId: Schema.String },
      payload: Undecoded,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.delete(
    "removeMembers",
    "/orgs/:orgId/projects/:projectId/members",
    {
      params: { orgId: Schema.String, projectId: Schema.String },
      query: UndecodedQuery,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.put("setOwner", "/orgs/:orgId/projects/:projectId/owner", {
    error: HttpApiError.NotFoundNoContent,
    params: { orgId: Schema.String, projectId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.put(
    "replaceRepos",
    "/orgs/:orgId/projects/:projectId/repos",
    {
      params: { orgId: Schema.String, projectId: Schema.String },
      payload: Schema.Struct({
        repos: Schema.Array(
          Schema.Struct({
            repoFullName: Schema.String,
            baseBranch: Schema.String,
            mode: Schema.optional(Schema.Literals(["primary", "lazy"])),
          }),
        ),
      }),
      success: Project,
    },
  ),
  HttpApiEndpoint.post("addRepos", "/orgs/:orgId/projects/:projectId/repos", {
    params: { orgId: Schema.String, projectId: Schema.String },
    payload: Schema.Struct({
      repos: Schema.Array(
        Schema.Struct({
          repoFullName: Schema.String,
          baseBranch: Schema.optional(Schema.String),
          mode: Schema.optional(Schema.Literals(["primary", "lazy"])),
        }),
      ),
    }),
    success: Project,
  }),
  HttpApiEndpoint.patch(
    "setRepoMode",
    "/orgs/:orgId/projects/:projectId/repos/:owner/:repo",
    {
      params: {
        orgId: Schema.String,
        projectId: Schema.String,
        owner: Schema.String,
        repo: Schema.String,
      },
      payload: Schema.Struct({ mode: Schema.Literals(["primary", "lazy"]) }),
      success: Project,
    },
  ),
  HttpApiEndpoint.post("restore", "/orgs/:orgId/projects/:projectId/restore", {
    params: { orgId: Schema.String, projectId: Schema.String },
    success: Project,
  }),
  HttpApiEndpoint.get("getSetup", "/orgs/:orgId/projects/:projectId/setup", {
    params: { orgId: Schema.String, projectId: Schema.String },
    success: ProjectSetup,
  }),
  HttpApiEndpoint.put(
    "replaceSetup",
    "/orgs/:orgId/projects/:projectId/setup",
    {
      params: { orgId: Schema.String, projectId: Schema.String },
      payload: ReplaceProjectSetupRequest,
      success: ProjectSetup,
    },
  ),
  HttpApiEndpoint.patch(
    "updateSetup",
    "/orgs/:orgId/projects/:projectId/setup",
    {
      params: { orgId: Schema.String, projectId: Schema.String },
      payload: Undecoded,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.get(
    "listSetupVersions",
    "/orgs/:orgId/projects/:projectId/setup/versions",
    {
      params: { orgId: Schema.String, projectId: Schema.String },
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.post(
    "rollbackSetup",
    "/orgs/:orgId/projects/:projectId/setup/versions/:versionId/rollback",
    {
      params: {
        orgId: Schema.String,
        projectId: Schema.String,
        versionId: Schema.String,
      },
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.get(
    "getSnapshotConfig",
    "/orgs/:orgId/projects/:projectId/snapshot",
    {
      params: { orgId: Schema.String, projectId: Schema.String },
      success: ProjectSnapshotConfig,
    },
  ),
  HttpApiEndpoint.post(
    "startSnapshotBuild",
    "/orgs/:orgId/projects/:projectId/snapshot/build",
    {
      params: { orgId: Schema.String, projectId: Schema.String },
      payload: StartSnapshotBuildRequest,
      success: SnapshotBuild,
    },
  ),
  HttpApiEndpoint.get(
    "listSnapshotBuilds",
    "/orgs/:orgId/projects/:projectId/snapshot/builds",
    {
      params: { orgId: Schema.String, projectId: Schema.String },
      success: Schema.Array(SnapshotBuildSummary),
    },
  ),
  HttpApiEndpoint.get(
    "getSnapshotBuild",
    "/orgs/:orgId/projects/:projectId/snapshot/builds/:buildId",
    {
      params: {
        orgId: Schema.String,
        projectId: Schema.String,
        buildId: Schema.String,
      },
      success: SnapshotBuild,
    },
  ),
  HttpApiEndpoint.get(
    "getSnapshotBuildLog",
    "/orgs/:orgId/projects/:projectId/snapshot/builds/:buildId/log",
    {
      params: {
        orgId: Schema.String,
        projectId: Schema.String,
        buildId: Schema.String,
      },
      query: UndecodedQuery,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.put(
    "setSnapshotEnabled",
    "/orgs/:orgId/projects/:projectId/snapshot/enabled",
    {
      params: { orgId: Schema.String, projectId: Schema.String },
      payload: Schema.Struct({ enabled: Schema.Boolean }),
      success: ProjectSnapshotConfig,
    },
  ),
  HttpApiEndpoint.put(
    "replaceSnapshotRepos",
    "/orgs/:orgId/projects/:projectId/snapshot/repos",
    {
      params: { orgId: Schema.String, projectId: Schema.String },
      payload: Schema.Struct({ repos: Schema.Array(Schema.String) }),
      success: ProjectSnapshotConfig,
    },
  ),
  HttpApiEndpoint.put(
    "setSnapshotSmallerTiers",
    "/orgs/:orgId/projects/:projectId/snapshot/smaller-tiers",
    {
      params: { orgId: Schema.String, projectId: Schema.String },
      payload: Schema.Struct({ buildSmallerTiers: Schema.Boolean }),
      success: ProjectSnapshotConfig,
    },
  ),
  HttpApiEndpoint.put(
    "setAccess",
    "/orgs/:orgId/projects/:projectId/visibility",
    {
      params: { orgId: Schema.String, projectId: Schema.String },
      payload: Undecoded,
      success: Undecoded,
    },
  ),
) {}
