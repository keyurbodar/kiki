import { AsyncResult, Atom } from "effect/reactivity";
import { JamId, type OrgId } from "../api/schemas/ids.ts";
import { ApiClient } from "../client/ApiClient.ts";
import { queryTimeToLive } from "./conventions.ts";

export const setupReactivityKeys = {
  thread: (orgId: string, jamId: string) => `thread:${orgId}/${jamId}`,
  setup: (orgId: string, projectId: string) =>
    `project-setup:${orgId}/${projectId}`,
  snapshot: (orgId: string, projectId: string) =>
    `project-snapshot:${orgId}/${projectId}`,
  machines: (orgId: string, jamId: string) => `machines:${orgId}/${jamId}`,
} as const;

export const setupKey = (...parts: ReadonlyArray<string>) => parts.join("/");

const splitKey = (key: string) => key.split("/") as [OrgId, string, string];

const threadDetailQuery = Atom.family((key: string) => {
  const [orgId, jamId] = splitKey(key);
  return ApiClient.query("jams", "get", {
    params: { orgId, jamId: JamId.make(jamId) },
    reactivityKeys: [setupReactivityKeys.thread(orgId, jamId)],
    timeToLive: queryTimeToLive,
  });
});

/** One thread's detail, read by the Setup pane for its project. */
export const threadDetailAtom = (orgId: OrgId, jamId: string) =>
  threadDetailQuery(setupKey(orgId, jamId));

const projectSetupQuery = Atom.family((key: string) => {
  const [orgId, projectId] = splitKey(key);
  return ApiClient.query("projects", "getSetup", {
    params: { orgId, projectId },
    reactivityKeys: [setupReactivityKeys.setup(orgId, projectId)],
    timeToLive: queryTimeToLive,
  });
});

export const projectSetupAtom = (orgId: OrgId, projectId: string) =>
  projectSetupQuery(setupKey(orgId, projectId));

const setupVersionsQuery = Atom.family((key: string) => {
  const [orgId, projectId] = splitKey(key);
  return ApiClient.query("projects", "listSetupVersions", {
    params: { orgId, projectId },
    reactivityKeys: [setupReactivityKeys.setup(orgId, projectId)],
    timeToLive: queryTimeToLive,
  });
});

export const setupVersionsAtom = (orgId: OrgId, projectId: string) =>
  setupVersionsQuery(setupKey(orgId, projectId));

const snapshotConfigQuery = Atom.family((key: string) => {
  const [orgId, projectId] = splitKey(key);
  return ApiClient.query("projects", "getSnapshotConfig", {
    params: { orgId, projectId },
    reactivityKeys: [setupReactivityKeys.snapshot(orgId, projectId)],
    timeToLive: queryTimeToLive,
  });
});

export const snapshotConfigAtom = (orgId: OrgId, projectId: string) =>
  snapshotConfigQuery(setupKey(orgId, projectId));

const snapshotBuildsQuery = Atom.family((key: string) => {
  const [orgId, projectId] = splitKey(key);
  return ApiClient.query("projects", "listSnapshotBuilds", {
    params: { orgId, projectId },
    reactivityKeys: [setupReactivityKeys.snapshot(orgId, projectId)],
    timeToLive: queryTimeToLive,
  });
});

export const snapshotBuildsAtom = (orgId: OrgId, projectId: string) =>
  snapshotBuildsQuery(setupKey(orgId, projectId));

const snapshotBuildQuery = Atom.family((key: string) => {
  const [orgId, projectId, buildId] = splitKey(key);
  return ApiClient.query("projects", "getSnapshotBuild", {
    params: { orgId, projectId, buildId },
    reactivityKeys: [setupReactivityKeys.snapshot(orgId, projectId)],
    timeToLive: queryTimeToLive,
  });
});

export const snapshotBuildAtom = (
  orgId: OrgId,
  projectId: string,
  buildId: string,
) => snapshotBuildQuery(setupKey(orgId, projectId, buildId));

const threadMachinesQuery = Atom.family((key: string) => {
  const [orgId, jamId] = splitKey(key);
  return ApiClient.query("machines", "list", {
    params: { orgId, jamId },
    reactivityKeys: [setupReactivityKeys.machines(orgId, jamId)],
    timeToLive: queryTimeToLive,
  });
});

const machinePreviewsQuery = Atom.family((key: string) => {
  const [orgId, jamId] = splitKey(key);
  return ApiClient.query("machines", "listServicePreviews", {
    params: { orgId, jamId },
    reactivityKeys: [setupReactivityKeys.machines(orgId, jamId)],
    timeToLive: queryTimeToLive,
  });
});

const machineSessionsQuery = Atom.family((key: string) => {
  const [orgId, jamId, machineId] = key.split("/") as [string, string, string];
  return ApiClient.query("machines", "sessions", {
    params: { orgId, jamId, machineId },
    reactivityKeys: [setupReactivityKeys.machines(orgId, jamId)],
    timeToLive: queryTimeToLive,
  });
});

/** The machines attached to one thread. */
export const threadMachinesAtom = (orgId: OrgId, jamId: string) =>
  threadMachinesQuery(setupKey(orgId, jamId));

/** The previews running on a thread's machines, which open as service tabs. */
export const machinePreviewsAtom = (orgId: OrgId, jamId: string) =>
  machinePreviewsQuery(setupKey(orgId, jamId));

/** The shells and agent sessions a machine holds. */
export const machineSessionsAtom = (
  orgId: OrgId,
  jamId: string,
  machineId: string,
) => machineSessionsQuery(`${setupKey(orgId, jamId)}/${machineId}`);

/** A thread's machines, previews and sessions while the org is still resolving. */
export const idleThreadMachinesAtom: ReturnType<typeof threadMachinesAtom> =
  Atom.make(AsyncResult.initial(false)) as ReturnType<
    typeof threadMachinesAtom
  >;

export const idleMachinePreviewsAtom: ReturnType<typeof machinePreviewsAtom> =
  Atom.make(AsyncResult.initial(false)) as ReturnType<
    typeof machinePreviewsAtom
  >;

export const idleMachineSessionsAtom: ReturnType<typeof machineSessionsAtom> =
  Atom.make(AsyncResult.initial(false)) as ReturnType<
    typeof machineSessionsAtom
  >;

export const rerunSetupAtom = ApiClient.mutation("machines", "rerunSetup");
