import { queryTimeToLive, reactivityKeys } from "@/data/atoms/conventions";
import { ApiClient } from "@/data/client/ApiClient";

/**
 * The Invitations dialog reads `/me/invitations` and `/me/joinable-organizations`,
 * which the data layer still declares as `Undecoded`, so it decodes the plain
 * rows itself until the A3 owner types those endpoints.
 */

export type MyInvitationView = {
  id: string;
  orgName: string;
  orgAvatarUrl: string | null;
  inviterName: string;
  projectCount: number;
};

export type JoinableOrganizationView = {
  orgId: string;
  orgName: string;
  orgAvatarUrl: string | null;
  projectCount: number;
};

type Row = Record<string, unknown>;

const row = (value: unknown): Row =>
  typeof value === "object" && value !== null ? (value as Row) : {};
const str = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;
const strOrNull = (value: unknown) =>
  typeof value === "string" && value !== "" ? value : null;
const count = (value: unknown) => (typeof value === "number" ? value : 0);
const list = (value: unknown): ReadonlyArray<unknown> =>
  Array.isArray(value) ? value : [];

const rows = (value: unknown) =>
  Array.isArray(value) ? value : list(row(value).invitations);

export const decodeMyInvitations = (
  value: unknown,
): ReadonlyArray<MyInvitationView> | undefined => {
  if (value === undefined || value === null) return undefined;
  const entries = Array.isArray(value) ? value : row(value).invitations;
  if (!Array.isArray(entries)) return undefined;
  return entries.map((entry) => {
    const r = row(entry);
    return {
      id: str(r.id),
      orgName: str(r.orgName ?? r.organizationName ?? r.name),
      orgAvatarUrl: strOrNull(r.orgAvatarUrl ?? r.organizationAvatarUrl),
      inviterName: str(r.inviterName ?? r.invitedByEmail),
      projectCount: count(r.projectCount),
    };
  });
};

export const decodeJoinableOrganizations = (
  value: unknown,
): ReadonlyArray<JoinableOrganizationView> | undefined => {
  if (value === undefined || value === null) return undefined;
  const entries = Array.isArray(value) ? value : row(value).organizations;
  if (!Array.isArray(entries)) return undefined;
  return entries.map((entry) => {
    const r = row(entry);
    return {
      orgId: str(r.orgId ?? r.id),
      orgName: str(r.orgName ?? r.name),
      orgAvatarUrl: strOrNull(r.orgAvatarUrl ?? r.avatarUrl),
      projectCount: count(r.projectCount),
    };
  });
};

export const joinedName = (value: unknown, fallback: string) => {
  const r = row(value);
  return str(r.name ?? r.orgName, fallback);
};

export const myInvitationsAtom = ApiClient.query(
  "organizations",
  "listMyInvitations",
  {
    reactivityKeys: [reactivityKeys.organizations],
    timeToLive: queryTimeToLive,
  },
);

export const joinableOrganizationsAtom = ApiClient.query(
  "organizations",
  "listJoinableOrganizations",
  {
    reactivityKeys: [reactivityKeys.organizations],
    timeToLive: queryTimeToLive,
  },
);

export const acceptInvitationAtom = ApiClient.mutation(
  "invitations",
  "acceptInvitation",
);
export const joinByDomainAtom = ApiClient.mutation(
  "organizations",
  "joinByDomain",
);

export { rows as invitationRows };
