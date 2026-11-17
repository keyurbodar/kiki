export const onboardingSteps = [
  "connect-github",
  "connect-slack",
  "invite-teammate",
  "set-up-environment",
  "ship-pr",
] as const;

export const sampleOnboardingState = {
  dismissed: false,
  completedSteps: ["connect-github"],
  skippedSteps: ["ship-pr"],
} as const;
