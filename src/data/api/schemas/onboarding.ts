import { Schema } from "effect";

export const OnboardingStep = Schema.Literals([
  "connect-github",
  "ship-pr",
  "run-review",
  "install-desktop",
  "set-up-environment",
  "connect-slack",
  "invite-teammate",
]);
export type OnboardingStep = typeof OnboardingStep.Type;

export class OnboardingStepState extends Schema.Class<OnboardingStepState>(
  "OnboardingStepState",
)({
  step: OnboardingStep,
  completed: Schema.Boolean,
  skipped: Schema.Boolean,
}) {}

export class OnboardingStatus extends Schema.Class<OnboardingStatus>(
  "OnboardingStatus",
)({
  steps: Schema.Array(OnboardingStepState),
  dismissed: Schema.Boolean,
}) {}
