import { Atom } from "effect/reactivity";
import type { OrgId } from "../api/schemas/ids.ts";
import { ApiClient } from "../client/ApiClient.ts";
import { queryTimeToLive, reactivityKeys } from "./conventions.ts";

export const captainsAtom = Atom.family((orgId: OrgId) =>
  ApiClient.query("captains", "list", {
    params: { orgId },
    query: {},
    reactivityKeys: [reactivityKeys.captains(orgId)],
    timeToLive: queryTimeToLive,
  }),
);
