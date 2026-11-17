export const onboardingSteps = [
  "connect-github",
  "connect-slack",
  "invite-teammate",
  "set-up-environment",
  "ship-pr",
] as const;

/**
 * Capy's captured account has finished onboarding, so its sidebar setup card is
 * absent and the thread list fills the sidebar. Fixtures that need the card
 * still visible use `sampleOnboardingIncomplete`.
 */
export const sampleOnboardingState = {
  dismissed: false,
  completedSteps: [...onboardingSteps],
  skippedSteps: [],
} as const;

export const sampleOnboardingIncomplete = {
  dismissed: false,
  completedSteps: ["connect-github"],
  skippedSteps: ["ship-pr"],
} as const;
