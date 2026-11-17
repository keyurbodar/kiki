import { Atom } from "effect/reactivity";
import type { OrgId } from "../api/schemas/ids.ts";
import { ApiClient } from "../client/ApiClient.ts";
import { queryTimeToLive, reactivityKeys } from "./conventions.ts";

export const projectsAtom = Atom.family((orgId: OrgId) =>
  ApiClient.query("projects", "list", {
    params: { orgId },
    query: {},
    reactivityKeys: [reactivityKeys.projects(orgId)],
    timeToLive: queryTimeToLive,
  }),
);
