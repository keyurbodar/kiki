import { Atom } from "effect/reactivity";
import type { OrgId } from "../api/schemas/ids.ts";
import { ApiClient } from "../client/ApiClient.ts";
import { queryTimeToLive } from "./conventions.ts";

export const cloudAccessKeys = {
  cloudAccess: (orgId: string) => [`cloud_access:${orgId}`],
} as const;

export const cloudAccessAtom = Atom.family((orgId: OrgId) =>
  ApiClient.query("cloud-access", "getCloudAccess", {
    params: { orgId },
    reactivityKeys: cloudAccessKeys.cloudAccess(orgId),
    timeToLive: queryTimeToLive,
  }),
);

export const createCloudAccessTargetAtom = ApiClient.mutation(
  "cloud-access",
  "createCloudAccessTarget",
);

export const updateCloudAccessTargetAtom = ApiClient.mutation(
  "cloud-access",
  "updateCloudAccessTarget",
);

export const deleteCloudAccessTargetAtom = ApiClient.mutation(
  "cloud-access",
  "deleteCloudAccessTarget",
);

export const checkCloudAccessTargetAtom = ApiClient.mutation(
  "cloud-access",
  "checkCloudAccessTarget",
);
