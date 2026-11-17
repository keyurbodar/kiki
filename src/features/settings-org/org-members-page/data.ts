import { Atom } from "effect/reactivity";
import { queryTimeToLive, reactivityKeys } from "@/data/atoms/conventions";
import { ApiClient } from "@/data/client/ApiClient";

/**
 * The org members page reads `listMembers`, `listInvitations` and the member
 * mutations, which the data layer still declares as `Undecoded`. These
 * decoders turn the plain rows into the page's own view types, the same way
 * the SAML SSO page does, until the A3 owner types the endpoints.
 */

export type AccessLevel = "owner" | "admin" | "member";

export type MemberView = {
  userId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  accessLevel: AccessLevel;
  disabled: boolean;
  createdAt: Date;
  githubLogin: string | null;
  mfaEnabled: boolean;
  enterpriseSso: boolean;
  passkeyTrusted: boolean;
  mfaExtendedUntil: Date | null;
};

export type InvitationView = {
  id: string;
  email: string;
  invitedByUserId: string | null;
  createdAt: Date;
  expiresAt: Date;
};

export type InviteOutcomeView = {
  email: string;
  status: "invited" | "already_member" | "invalid";
};

type Row = Record<string, unknown>;

const row = (value: unknown): Row =>
  typeof value === "object" && value !== null ? (value as Row) : {};
const str = (value: unknown) => (typeof value === "string" ? value : null);
const bool = (value: unknown) => value === true;
const list = (value: unknown): ReadonlyArray<unknown> =>
  Array.isArray(value) ? value : [];
const date = (value: unknown) => {
  if (value instanceof Date) return value;
  if (typeof value !== "string" && typeof value !== "number") return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const accessLevel = (value: unknown): AccessLevel =>
  value === "owner" || value === "admin" ? value : "member";

const epoch = (value: unknown) => date(value) ?? new Date(0);

export const decodeMember = (value: unknown): MemberView => {
  const r = row(value);
  return {
    userId: str(r.userId) ?? str(r.id) ?? "",
    email: str(r.email),
    firstName: str(r.firstName),
    lastName: str(r.lastName),
    imageUrl: str(r.imageUrl),
    accessLevel: accessLevel(r.accessLevel ?? r.role),
    disabled:
      bool(r.disabled) || bool(r.isRemoved) || date(r.removedAt) !== null,
    createdAt: epoch(r.createdAt ?? r.joinedAt),
    githubLogin: str(r.githubLogin),
    mfaEnabled: bool(r.mfaEnabled),
    enterpriseSso: bool(r.enterpriseSso),
    passkeyTrusted: bool(r.passkeyTrusted),
    mfaExtendedUntil: date(r.mfaExtendedUntil ?? r.mfaExtension),
  };
};

export const decodeMembers = (value: unknown) => list(value).map(decodeMember);

export const decodeInvitation = (value: unknown): InvitationView => {
  const r = row(value);
  return {
    id: str(r.id) ?? "",
    email: str(r.email) ?? "",
    invitedByUserId: str(r.invitedByUserId) ?? str(r.invitedBy),
    createdAt: epoch(r.createdAt),
    expiresAt: epoch(r.expiresAt),
  };
};

/** `listInvitations` answers either an array or `{ invitations, history }`. */
export const decodeInvitations = (value: unknown) => {
  const rows = Array.isArray(value) ? value : row(value).invitations;
  return list(rows).map(decodeInvitation);
};

/** `invite` answers either an array of outcomes or `{ invitations }`. */
export const decodeInviteOutcomes = (value: unknown) => {
  const rows = Array.isArray(value) ? value : row(value).invitations;
  return list(rows).map((entry): InviteOutcomeView => {
    const r = row(entry);
    const status =
      r.status === "already_member" || r.status === "invalid"
        ? r.status
        : "invited";
    return { email: str(r.email) ?? "", status };
  });
};

export const memberReactivityKeys = {
  members: (orgId: string) => [`org_user:${orgId}`, "member_mfa"],
  mfa: (orgId: string) => [
    reactivityKeys.organizations,
    `org_user:${orgId}`,
    "member_mfa",
  ],
  invitations: (orgId: string) => [`org_invitation:${orgId}`],
};

export const orgMembersAtom = Atom.family((orgId: string) =>
  ApiClient.query("members", "listMembers", {
    params: { orgId },
    query: { includeDisabled: "true" },
    reactivityKeys: memberReactivityKeys.members(orgId),
    timeToLive: queryTimeToLive,
  }),
);

export const orgInvitationsAtom = Atom.family((orgId: string) =>
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
export const setMemberMfaExtensionAtom = ApiClient.mutation(
  "members",
  "setMemberMfaExtension",
);
export const clearMemberMfaExtensionAtom = ApiClient.mutation(
  "members",
  "clearMemberMfaExtension",
);
