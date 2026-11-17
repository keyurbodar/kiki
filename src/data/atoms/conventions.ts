import type { Duration } from "effect";

export const queryTimeToLive: Duration.Input = "5 minutes";

export const reactivityKeys = {
  currentUser: "user:current",
  organizations: "organizations",
  projects: (orgId: string) => `projects:${orgId}`,
  threads: (orgId: string) => `threads:${orgId}`,
  captains: (orgId: string) => `captains:${orgId}`,
} as const;
