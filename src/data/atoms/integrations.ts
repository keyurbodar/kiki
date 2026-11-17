import { Atom } from "effect/reactivity";
import type { OrgId } from "../api/schemas/ids.ts";
import { ApiClient } from "../client/ApiClient.ts";
import { queryTimeToLive } from "./conventions.ts";

export const integrationKeys = {
  githubUser: ["github_user_credential:current"],
  githubInstallation: (orgId: string) => [`github_installation:${orgId}`],
  slack: (orgId: string) => [`slack_connection:${orgId}`],
  linear: (orgId: string) => [`linear_connection:${orgId}`],
  paper: ["paper_connection:current"],
  tailscale: (orgId: string) => [`tailscale_connection:${orgId}`],
  revyl: (orgId: string) => [`revyl_connection:${orgId}`],
} as const;

export const githubUserAtom = ApiClient.query("integrations", "getGitHubUser", {
  reactivityKeys: integrationKeys.githubUser,
  timeToLive: queryTimeToLive,
});

export const githubInstallationAtom = Atom.family((orgId: OrgId) =>
  ApiClient.query("integrations", "getGitHubInstallation", {
    params: { orgId },
    reactivityKeys: integrationKeys.githubInstallation(orgId),
    timeToLive: "30 seconds",
  }),
);

export const githubWorkspaceAtom = Atom.family((orgId: OrgId) =>
  ApiClient.query("integrations", "getGitHubWorkspace", {
    params: { orgId },
    reactivityKeys: integrationKeys.githubInstallation(orgId),
    timeToLive: queryTimeToLive,
  }),
);

export const slackConnectionAtom = Atom.family((orgId: OrgId) =>
  ApiClient.query("integrations", "getSlack", {
    params: { orgId },
    reactivityKeys: integrationKeys.slack(orgId),
    timeToLive: queryTimeToLive,
  }),
);

export const linearConnectionAtom = Atom.family((orgId: OrgId) =>
  ApiClient.query("integrations", "getLinear", {
    params: { orgId },
    reactivityKeys: integrationKeys.linear(orgId),
    timeToLive: queryTimeToLive,
  }),
);

export const paperStatusAtom = ApiClient.query("integrations", "getPaper", {
  reactivityKeys: integrationKeys.paper,
  timeToLive: queryTimeToLive,
});

export const tailscaleConnectionAtom = Atom.family((orgId: OrgId) =>
  ApiClient.query("integrations", "getTailscale", {
    params: { orgId },
    reactivityKeys: integrationKeys.tailscale(orgId),
    timeToLive: queryTimeToLive,
  }),
);

export const mobileConnectionAtom = Atom.family((orgId: OrgId) =>
  ApiClient.query("mobileConnection", "get", {
    params: { orgId },
    reactivityKeys: integrationKeys.revyl(orgId),
    timeToLive: "1 minute",
  }),
);

export const startGitHubInstallationAtom = ApiClient.mutation(
  "integrations",
  "startGitHubInstallation",
);
