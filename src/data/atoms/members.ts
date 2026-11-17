import { Atom } from "effect/reactivity";
import type { OrgId } from "../api/schemas/ids.ts";
import { ApiClient } from "../client/ApiClient.ts";
import { queryTimeToLive, reactivityKeys } from "./conventions.ts";

/** Capy's member and invitation reactivity keys (org_user, member_mfa, org_invitation). */
export const memberReactivityKeys = {
  members: (orgId: string) => [`org_user:${orgId}`, "member_mfa"],
  mfa: (orgId: string) => [
    reactivityKeys.organizations,
    `org_user:${orgId}`,
    "member_mfa",
  ],
  invitations: (orgId: string) => [`org_invitation:${orgId}`],
};

/** Every member of the org, removed (disabled) members included. */
export const orgMembersAtom = Atom.family((orgId: OrgId) =>
  ApiClient.query("members", "listMembers", {
    params: { orgId },
    query: { includeDisabled: "true" },
    reactivityKeys: memberReactivityKeys.members(orgId),
    timeToLive: queryTimeToLive,
  }),
);

export const orgInvitationsAtom = Atom.family((orgId: OrgId) =>
  ApiClient.query("invitations", "listInvitations", {
    params: { orgId },
    reactivityKeys: memberReactivityKeys.invitations(orgId),
    timeToLive: queryTimeToLive,
  }),
);

export const inviteToOrgAtom = ApiClient.mutation("members", "invite");
export const setMemberRoleAtom = ApiClient.mutation("members", "setMemberRole");
export const removeMemberAtom = ApiClient.mutation("members", "removeMember");
export const restoreMemberAtom = ApiClient.mutation("members", "restoreMember");
export const grantOwnerAtom = ApiClient.mutation("members", "grantOwner");
export const revokeOwnerAtom = ApiClient.mutation("members", "revokeOwner");
export const revokeInvitationAtom = ApiClient.mutation(
  "invitations",
  "revokeInvitation",
);
export const acceptInvitationAtom = ApiClient.mutation(
  "invitations",
  "acceptInvitation",
);
export const joinByDomainAtom = ApiClient.mutation(
  "organizations",
  "joinByDomain",
);
export const setMemberMfaExtensionAtom = ApiClient.mutation(
  "members",
  "setMemberMfaExtension",
);
export const clearMemberMfaExtensionAtom = ApiClient.mutation(
  "members",
  "clearMemberMfaExtension",
);
