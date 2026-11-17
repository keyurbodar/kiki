import { ApiClient } from "../client/ApiClient.ts";
import { queryTimeToLive, reactivityKeys } from "./conventions.ts";

export const myInvitationsAtom = ApiClient.query(
  "organizations",
  "listMyInvitations",
  {
    reactivityKeys: [reactivityKeys.myInvitations],
    timeToLive: queryTimeToLive,
  },
);

export const joinableOrganizationsAtom = ApiClient.query(
  "organizations",
  "listJoinableOrganizations",
  {
    reactivityKeys: [reactivityKeys.joinableOrganizations],
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
