import { ApiClient } from "../client/ApiClient.ts";
import { queryTimeToLive, reactivityKeys } from "./conventions.ts";

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

export const createOrganizationAtom = ApiClient.mutation(
  "organizations",
  "create",
);

export const setSharingAtom = ApiClient.mutation("organizations", "setSharing");

export const renameOrganizationAtom = ApiClient.mutation("orgs", "update");

export const inviteMembersAtom = ApiClient.mutation("members", "invite");

export const skipOnboardingStepAtom = ApiClient.mutation("onboarding", "skip");

export const startSlackOAuthAtom = ApiClient.mutation(
  "integrations",
  "startSlackOAuth",
);

export const startLinearOAuthAtom = ApiClient.mutation(
  "integrations",
  "startLinearOAuth",
);
