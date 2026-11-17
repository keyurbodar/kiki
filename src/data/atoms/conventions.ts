import type { Duration } from "effect";

export const queryTimeToLive: Duration.Input = "5 minutes";

export const reactivityKeys = {
  currentUser: "user:current",
  organizations: "organizations",
  myInvitations: "invitations:me",
  joinableOrganizations: "organizations:joinable",
  projects: (orgId: string) => `projects:${orgId}`,
  threads: (orgId: string) => `threads:${orgId}`,
  issues: (orgId: string) => `issues:${orgId}`,
  issue: (orgId: string, code: string) => `issue:${orgId}/${code}`,
  issueStates: (orgId: string) => `issue-states:${orgId}`,
  issueLabels: (orgId: string) => `issue-labels:${orgId}`,
} as const;
