import { Atom } from "effect/reactivity";
import type { OrgId } from "../api/schemas/ids.ts";
import { ApiClient } from "../client/ApiClient.ts";
import { queryTimeToLive } from "./conventions.ts";

export const agentSettingsKeys = {
  feedbackSettings: (orgId: string) => `pr_feedback_setting:${orgId}`,
  pullComments: (orgId: string) => `pull_comment:${orgId}`,
  pullReviews: (orgId: string) => `pull_review:${orgId}`,
} as const;

const splitKey = (key: string) => {
  const cut = key.indexOf("\n");
  return [key.slice(0, cut) as OrgId, key.slice(cut + 1)] as const;
};

export const gitSigningAtom = ApiClient.query("users", "getGitSigning", {
  timeToLive: queryTimeToLive,
});
export const ensureGitSigningAtom = ApiClient.mutation(
  "users",
  "ensureGitSigning",
);
export const rotateGitSigningAtom = ApiClient.mutation(
  "users",
  "rotateGitSigning",
);
export const updatePreferencesAtom = ApiClient.mutation(
  "users",
  "updatePreferences",
);

export const feedbackSettingsAtom = Atom.family((orgId: OrgId) =>
  ApiClient.query("feedback-settings", "feedbackSettings", {
    params: { orgId },
    reactivityKeys: [agentSettingsKeys.feedbackSettings(orgId)],
    timeToLive: queryTimeToLive,
  }),
);
export const configureFeedbackAtom = ApiClient.mutation(
  "feedback-settings",
  "configureFeedback",
);

const feedbackBotsQuery = Atom.family((key: string) => {
  const [orgId, search] = splitKey(key);
  return ApiClient.query("feedback-bots", "feedbackBots", {
    params: { orgId },
    query: { search },
    reactivityKeys: [
      agentSettingsKeys.pullComments(orgId),
      agentSettingsKeys.pullReviews(orgId),
    ],
    timeToLive: queryTimeToLive,
  });
});

/** Bots seen on the org's pull requests whose login matches `search`. */
export const feedbackBotsAtom = (orgId: OrgId, search: string) =>
  feedbackBotsQuery(`${orgId}\n${search}`);

const feedbackBotHealthQuery = Atom.family((key: string) => {
  const [orgId, logins] = splitKey(key);
  return ApiClient.query("feedback-bot-health", "feedbackBotHealth", {
    params: { orgId },
    query: { logins: logins.split("\n") },
    reactivityKeys: [
      agentSettingsKeys.pullComments(orgId),
      agentSettingsKeys.pullReviews(orgId),
    ],
    timeToLive: queryTimeToLive,
  });
});

/** When each listed bot last authored on the org's pull requests. */
export const feedbackBotHealthAtom = (
  orgId: OrgId,
  logins: ReadonlyArray<string>,
) => feedbackBotHealthQuery(`${orgId}\n${logins.join("\n")}`);

export const setTitlePromptAtom = ApiClient.mutation(
  "organizations",
  "setTitlePrompt",
);
export const setOrgTitlePromptAtom = ApiClient.mutation(
  "organizations",
  "setOrgTitlePrompt",
);
export const setTitleTriggersAtom = ApiClient.mutation(
  "organizations",
  "setTitleTriggers",
);
export const setOrgTitleTriggersAtom = ApiClient.mutation(
  "organizations",
  "setOrgTitleTriggers",
);
export const setTaskLimitsAtom = ApiClient.mutation(
  "organizations",
  "setTaskLimits",
);
