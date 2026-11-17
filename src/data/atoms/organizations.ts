import { Atom } from "effect/reactivity";
import type { OrgId } from "../api/schemas/ids.ts";
import { ApiClient } from "../client/ApiClient.ts";
import { queryTimeToLive, reactivityKeys } from "./conventions.ts";

export const organizationReactivityKeys = (orgId: string) => [
  reactivityKeys.organizations,
  `organization:${orgId}`,
];

export const issuePrefixReactivityKeys = (orgId: string) => [
  `issue-prefix:${orgId}`,
];

/** One organization by id, refetched by any mutation that names it. */
export const organizationAtom = Atom.family((orgId: OrgId) =>
  ApiClient.query("organizations", "get", {
    params: { orgId },
    reactivityKeys: organizationReactivityKeys(orgId),
    timeToLive: queryTimeToLive,
  }),
);

export const updateOrganizationAtom = ApiClient.mutation("orgs", "update");

export const deleteOrganizationAtom = ApiClient.mutation("orgs", "delete");

export const presignOrganizationAvatarAtom = ApiClient.mutation(
  "avatar",
  "presignAvatarUpload",
);

export const updateOrganizationAvatarAtom = ApiClient.mutation(
  "avatar",
  "updateAvatar",
);

export const removeOrganizationAvatarAtom = ApiClient.mutation(
  "avatar",
  "removeAvatar",
);

export const setOrganizationSharingAtom = ApiClient.mutation(
  "organizations",
  "setSharing",
);

export const setMyDefaultVisibilityAtom = ApiClient.mutation(
  "organizations",
  "setDefaultVisibility",
);

export const issuePrefixAtom = Atom.family((orgId: OrgId) =>
  ApiClient.query("issues", "prefix", {
    params: { orgId },
    reactivityKeys: issuePrefixReactivityKeys(orgId),
    timeToLive: queryTimeToLive,
  }),
);

export const setIssuePrefixAtom = ApiClient.mutation("issues", "setPrefix");
