import type { Duration } from "effect";

export const queryTimeToLive: Duration.Input = "5 minutes";

/**
 * How old a cached read may be when a surface mounts again before it is
 * refreshed underneath the content. Short, because the reader has just told us
 * they want to see this screen now.
 */
export const queryStaleOnMount: Duration.Input = "30 seconds";

export const reactivityKeys = {
  currentUser: "user:current",
  organizations: "organizations",
  myInvitations: "invitations:me",
  joinableOrganizations: "organizations:joinable",
  projects: (orgId: string) => `projects:${orgId}`,
  threads: (orgId: string) => `threads:${orgId}`,
  threadOrganization: (orgId: string) => `threadOrganization:${orgId}`,
  captains: (orgId: string) => `captains:${orgId}`,
  issues: (orgId: string) => `issues:${orgId}`,
  issue: (orgId: string, code: string) => `issue:${orgId}/${code}`,
  issueStates: (orgId: string) => `issue-states:${orgId}`,
  issueActivity: (orgId: string, jamId: string) =>
    `issue-activity:${orgId}/${jamId}`,
  issueLabels: (orgId: string) => `issue-labels:${orgId}`,
  modelCatalog: "model_catalog",
} as const;
