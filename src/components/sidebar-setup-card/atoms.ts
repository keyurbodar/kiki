import { Atom } from "effect/reactivity";
import type { OrgId } from "@/data/api/schemas/ids";
import { ApiClient } from "@/data/client/ApiClient";

const onboardingTimeToLive = "2 minutes";

export const onboardingKeys = (orgId: OrgId) => [
  `onboarding_step_skip:${orgId}`,
  `onboarding_dismissal:${orgId}`,
  `github_installation:${orgId}`,
  "github_user_credential:current",
  `slack_connection:${orgId}`,
  `linear_connection:${orgId}`,
];

export const onboardingStatusAtom = Atom.family((orgId: OrgId) =>
  ApiClient.query("onboarding", "status", {
    params: { orgId },
    reactivityKeys: onboardingKeys(orgId),
    timeToLive: onboardingTimeToLive,
  }),
);

export const skipOnboardingStepAtom = ApiClient.mutation("onboarding", "skip");
export const dismissOnboardingAtom = ApiClient.mutation(
  "onboarding",
  "dismiss",
);
