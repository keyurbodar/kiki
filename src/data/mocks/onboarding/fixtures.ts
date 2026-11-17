export const onboardingSteps = [
  "create-organization",
  "rename-organization",
  "connect-github",
  "set-appearance",
  "invite-team",
] as const;

export const sampleOnboardingState = {
  dismissed: false,
  completedSteps: ["create-organization", "rename-organization"],
  skippedSteps: ["set-appearance"],
} as const;
