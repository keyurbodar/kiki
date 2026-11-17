import { Atom } from "effect/reactivity";
import type { OrgId } from "../api/schemas/ids.ts";
import { ApiClient } from "../client/ApiClient.ts";
import { queryTimeToLive, reactivityKeys } from "./conventions.ts";

export const projectSettingsKeys = {
  directory: (orgId: string) => `project-settings:${orgId}`,
  project: (orgId: string, projectId: string) =>
    `project:${orgId}:${projectId}`,
  setup: (orgId: string, projectId: string) =>
    `project-setup:${orgId}:${projectId}`,
  snapshot: (orgId: string, projectId: string) =>
    `project-snapshot:${orgId}:${projectId}`,
  variables: (orgId: string, projectId: string) =>
    `project-variables:${orgId}:${projectId}`,
  dependencyRepos: (orgId: string, projectId: string) =>
    `project-dependency-repos:${orgId}:${projectId}`,
} as const;

/** Every key a project-level write can touch, so list and detail refetch together. */
export const projectWriteKeys = (orgId: string, projectId: string) => [
  reactivityKeys.projects(orgId),
  projectSettingsKeys.directory(orgId),
  projectSettingsKeys.project(orgId, projectId),
  projectSettingsKeys.setup(orgId, projectId),
  projectSettingsKeys.snapshot(orgId, projectId),
];

const split = (key: string) => key.split("/") as [OrgId, string, string];

export const projectKey = (orgId: OrgId, projectId: string) =>
  `${orgId}/${projectId}`;

export const projectSettingsDirectoryAtom = Atom.family((key: string) => {
  const [orgId, search, page] = split(key);
  return ApiClient.query("projects", "settingsDirectory", {
    params: { orgId },
    query: { search: search === "" ? undefined : search, page },
    reactivityKeys: [
      reactivityKeys.projects(orgId),
      projectSettingsKeys.directory(orgId),
    ],
    timeToLive: "30 seconds",
  });
});

export const projectSettingsDirectoryKey = (
  orgId: OrgId,
  search: string,
  page: number,
) => `${orgId}/${search.replaceAll("/", " ")}/${page}`;

export const deletedProjectsAtom = Atom.family((orgId: OrgId) =>
  ApiClient.query("projects", "list", {
    params: { orgId },
    query: { deleted: "true" },
    reactivityKeys: [
      reactivityKeys.projects(orgId),
      projectSettingsKeys.directory(orgId),
    ],
    timeToLive: queryTimeToLive,
  }),
);

/** GitHub repositories the org's installation can see; undecoded until C7 types the integrations group. */
export const githubInstallationReposAtom = Atom.family((orgId: OrgId) =>
  ApiClient.query("integrations", "listGitHubInstallationRepos", {
    params: { orgId },
    reactivityKeys: [`github-installation-repos:${orgId}`],
    timeToLive: queryTimeToLive,
  }),
);

export const projectAtom = Atom.family((key: string) => {
  const [orgId, projectId] = split(key);
  return ApiClient.query("projects", "get", {
    params: { orgId, projectId },
    reactivityKeys: [projectSettingsKeys.project(orgId, projectId)],
    timeToLive: queryTimeToLive,
  });
});

export const projectSetupAtom = Atom.family((key: string) => {
  const [orgId, projectId] = split(key);
  return ApiClient.query("projects", "getSetup", {
    params: { orgId, projectId },
    reactivityKeys: [projectSettingsKeys.setup(orgId, projectId)],
    timeToLive: queryTimeToLive,
  });
});

export const snapshotConfigAtom = Atom.family((key: string) => {
  const [orgId, projectId] = split(key);
  return ApiClient.query("projects", "getSnapshotConfig", {
    params: { orgId, projectId },
    reactivityKeys: [projectSettingsKeys.snapshot(orgId, projectId)],
    timeToLive: queryTimeToLive,
  });
});

export const snapshotBuildsAtom = Atom.family((key: string) => {
  const [orgId, projectId] = split(key);
  return ApiClient.query("projects", "listSnapshotBuilds", {
    params: { orgId, projectId },
    reactivityKeys: [projectSettingsKeys.snapshot(orgId, projectId)],
    timeToLive: queryTimeToLive,
  });
});

export const snapshotBuildKey = (
  orgId: OrgId,
  projectId: string,
  buildId: string,
) => `${orgId}/${projectId}/${buildId}`;

export const snapshotBuildAtom = Atom.family((key: string) => {
  const [orgId, projectId, buildId] = split(key);
  return ApiClient.query("projects", "getSnapshotBuild", {
    params: { orgId, projectId, buildId },
    reactivityKeys: [projectSettingsKeys.snapshot(orgId, projectId)],
    timeToLive: queryTimeToLive,
  });
});

export const sharedVariablesAtom = Atom.family((key: string) => {
  const [orgId, projectId] = split(key);
  return ApiClient.query("projects", "listEnvironmentVariables", {
    params: { orgId, projectId },
    reactivityKeys: [projectSettingsKeys.variables(orgId, projectId)],
    timeToLive: queryTimeToLive,
  });
});

export const personalVariablesAtom = Atom.family((key: string) => {
  const [orgId, projectId] = split(key);
  return ApiClient.query("projects", "listPersonalEnvironmentVariables", {
    params: { orgId, projectId },
    reactivityKeys: [projectSettingsKeys.variables(orgId, projectId)],
    timeToLive: queryTimeToLive,
  });
});

export const dependencyReposAtom = Atom.family((key: string) => {
  const [orgId, projectId] = split(key);
  return ApiClient.query("projects", "listDependencyRepos", {
    params: { orgId, projectId },
    reactivityKeys: [projectSettingsKeys.dependencyRepos(orgId, projectId)],
    timeToLive: queryTimeToLive,
  });
});

export const projectMutations = {
  create: ApiClient.mutation("projects", "create"),
  update: ApiClient.mutation("projects", "update"),
  delete: ApiClient.mutation("projects", "delete"),
  restore: ApiClient.mutation("projects", "restore"),
  setRepoMode: ApiClient.mutation("projects", "setRepoMode"),
  addRepos: ApiClient.mutation("projects", "addRepos"),
  replaceRepos: ApiClient.mutation("projects", "replaceRepos"),
  replaceSetup: ApiClient.mutation("projects", "replaceSetup"),
  setSnapshotEnabled: ApiClient.mutation("projects", "setSnapshotEnabled"),
  replaceSnapshotRepos: ApiClient.mutation("projects", "replaceSnapshotRepos"),
  setSnapshotSmallerTiers: ApiClient.mutation(
    "projects",
    "setSnapshotSmallerTiers",
  ),
  startSnapshotBuild: ApiClient.mutation("projects", "startSnapshotBuild"),
  setEnvironmentVariables: ApiClient.mutation(
    "projects",
    "setEnvironmentVariables",
  ),
  setPersonalEnvironmentVariables: ApiClient.mutation(
    "projects",
    "setPersonalEnvironmentVariables",
  ),
  setEnvironmentVariable: ApiClient.mutation(
    "projects",
    "setEnvironmentVariable",
  ),
  setPersonalEnvironmentVariable: ApiClient.mutation(
    "projects",
    "setPersonalEnvironmentVariable",
  ),
  deleteEnvironmentVariable: ApiClient.mutation(
    "projects",
    "deleteEnvironmentVariable",
  ),
  deletePersonalEnvironmentVariable: ApiClient.mutation(
    "projects",
    "deletePersonalEnvironmentVariable",
  ),
  getEnvironmentVariableValue: ApiClient.mutation(
    "projects",
    "getEnvironmentVariableValue",
  ),
  getPersonalEnvironmentVariableValue: ApiClient.mutation(
    "projects",
    "getPersonalEnvironmentVariableValue",
  ),
  replaceDependencyRepos: ApiClient.mutation(
    "projects",
    "replaceDependencyRepos",
  ),
} as const;
