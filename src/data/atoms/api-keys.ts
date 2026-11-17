import { Atom } from "effect/reactivity";
import type { OrgId, ServiceUserId } from "../api/schemas/ids.ts";
import { ApiClient } from "../client/ApiClient.ts";
import { queryTimeToLive } from "./conventions.ts";

/** Capy's api-atoms reactivity keys; every API-settings mutation passes `apiSettings`. */
export const apiSettingsKeys = {
  apiSettings: (orgId: string) => [`apiSettings:${orgId}`],
  serviceUser: (orgId: string) => `service_user:${orgId}`,
  projects: (orgId: string) => [`project:${orgId}`, `project_member:${orgId}`],
} as const;

export const serviceUsersAtom = Atom.family((orgId: OrgId) =>
  ApiClient.query("serviceUsers", "list", {
    params: { orgId },
    reactivityKeys: [
      ...apiSettingsKeys.apiSettings(orgId),
      apiSettingsKeys.serviceUser(orgId),
    ],
    timeToLive: queryTimeToLive,
  }),
);

/** Keyed by `orgId:serviceUserId` because families compare keys by reference. */
export const serviceUserAtom = Atom.family((key: string) => {
  const [orgId, serviceUserId] = key.split(":") as [OrgId, ServiceUserId];
  return ApiClient.query("serviceUsers", "get", {
    params: { orgId, serviceUserId },
    reactivityKeys: [
      ...apiSettingsKeys.apiSettings(orgId),
      apiSettingsKeys.serviceUser(orgId),
      ...apiSettingsKeys.projects(orgId),
    ],
    timeToLive: queryTimeToLive,
  });
});

export const serviceUserKey = (orgId: OrgId, serviceUserId: string) =>
  `${orgId}:${serviceUserId}`;

export const apiKeysAtom = Atom.family((orgId: OrgId) =>
  ApiClient.query("apiKeys", "list", {
    params: { orgId },
    reactivityKeys: [
      ...apiSettingsKeys.apiSettings(orgId),
      ...apiSettingsKeys.projects(orgId),
    ],
    timeToLive: queryTimeToLive,
  }),
);

export const createServiceUser = ApiClient.mutation("serviceUsers", "create");
export const updateServiceUser = ApiClient.mutation("serviceUsers", "update");
export const disableServiceUser = ApiClient.mutation("serviceUsers", "disable");
export const restoreServiceUser = ApiClient.mutation("serviceUsers", "restore");
export const replaceServiceUserProjects = ApiClient.mutation(
  "serviceUsers",
  "replaceProjects",
);
export const setServiceUserSubscription = ApiClient.mutation(
  "serviceUsers",
  "setSubscription",
);
export const mintApiKey = ApiClient.mutation("apiKeys", "mint");
export const renameApiKey = ApiClient.mutation("apiKeys", "rename");
export const revokeApiKey = ApiClient.mutation("apiKeys", "revoke");
