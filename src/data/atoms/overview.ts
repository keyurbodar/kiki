import { Atom } from "effect/reactivity";
import type { OrgId } from "../api/schemas/ids.ts";
import { ApiClient } from "../client/ApiClient.ts";
import { queryTimeToLive } from "./conventions.ts";

const key = (...parts: ReadonlyArray<string>) => parts.join("/");

export const overviewChildrenAtom = Atom.family((orgId: OrgId, jamId: string) =>
  ApiClient.query("children", "list", {
    params: { orgId, jamId },
    reactivityKeys: [key("children", orgId, jamId)],
    timeToLive: queryTimeToLive,
  }),
);

export const overviewPullsAtom = Atom.family((orgId: OrgId, jamId: string) =>
  ApiClient.query("pulls", "forThread", {
    params: { orgId, jamId },
    reactivityKeys: [key("pulls", orgId, jamId)],
    timeToLive: queryTimeToLive,
  }),
);

export const overviewLocalPullsAtom = Atom.family(
  (orgId: OrgId, jamId: string) =>
    ApiClient.query("pulls", "localPullsForThread", {
      params: { orgId, jamId },
      reactivityKeys: [key("local-pulls", orgId, jamId)],
      timeToLive: queryTimeToLive,
    }),
);

export const overviewJamsAtom = Atom.family((orgId: OrgId) =>
  ApiClient.query("jams", "list", {
    params: { orgId },
    query: {},
    reactivityKeys: [key("jams", orgId)],
    timeToLive: queryTimeToLive,
  }),
);

export const overviewModelsAtom = ApiClient.query("models", "list", {
  query: {},
  reactivityKeys: ["models"],
  timeToLive: queryTimeToLive,
});

export const overviewGitStatusAtom = Atom.family(
  (orgId: OrgId, jamId: string) =>
    ApiClient.query("git", "status", {
      params: { orgId, jamId },
      reactivityKeys: [key("git-status", orgId, jamId)],
      timeToLive: queryTimeToLive,
    }),
);

export const overviewGitTurnsAtom = Atom.family((orgId: OrgId, jamId: string) =>
  ApiClient.query("git", "turns", {
    params: { orgId, jamId },
    reactivityKeys: [key("git-turns", orgId, jamId)],
    timeToLive: queryTimeToLive,
  }),
);

export const overviewMachinesAtom = Atom.family((orgId: OrgId, jamId: string) =>
  ApiClient.query("machines", "list", {
    params: { orgId, jamId },
    reactivityKeys: [key("machines", orgId, jamId)],
    timeToLive: queryTimeToLive,
  }),
);

export const overviewPortsAtom = Atom.family(
  (orgId: OrgId, jamId: string, machineId: string) =>
    ApiClient.query("machines", "ports", {
      params: { orgId, jamId, machineId },
      reactivityKeys: [key("ports", orgId, jamId, machineId)],
      timeToLive: queryTimeToLive,
    }),
);

export const overviewSessionsAtom = Atom.family(
  (orgId: OrgId, jamId: string, machineId: string) =>
    ApiClient.query("machines", "sessions", {
      params: { orgId, jamId, machineId },
      reactivityKeys: [key("sessions", orgId, jamId, machineId)],
      timeToLive: queryTimeToLive,
    }),
);

export const overviewRemoveLocalPullAtom = ApiClient.mutation(
  "pulls",
  "removeLocalPull",
);

export const overviewCopyUrlAtom = ApiClient.mutation(
  "machines",
  "previewHandoff",
);
