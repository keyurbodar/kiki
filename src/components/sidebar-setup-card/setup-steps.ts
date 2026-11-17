import type { ComponentType } from "react";
import {
  CircleDashedIcon,
  GithubIcon,
  LinearIcon,
  MacbookIcon,
  PeopleAddIcon,
  PullRequestIcon,
  Server2Icon,
  SlackIcon,
} from "@/components/release";

const assets = import.meta.glob<string>("./assets/*", {
  eager: true,
  query: "?url",
  import: "default",
});

const asset = (file: string) => assets[`./assets/${file}`] ?? "";

const image = (name: string) => ({
  light: asset(`${name}-light.webp`),
  dark: asset(`${name}-dark.webp`),
});

export const SETUP_STEP_IDS = [
  "connect-github",
  "ship-pr",
  "run-review",
  "install-desktop",
  "set-up-environment",
  "connect-slack",
  "invite-teammate",
] as const;

export type SetupStepId = (typeof SETUP_STEP_IDS)[number];

export type SetupStepChoice = {
  id: "slack" | "linear";
  label: string;
  icon: ComponentType;
};

export type SetupStepDefinition = {
  id: SetupStepId;
  label: string;
  action?: string;
  icon: ComponentType;
  description?: string;
  image?: { light: string; dark: string };
  choices?: ReadonlyArray<SetupStepChoice>;
};

export const setupStepChoices: ReadonlyArray<SetupStepChoice> = [
  { id: "slack", label: "Slack", icon: SlackIcon },
  { id: "linear", label: "Linear", icon: LinearIcon },
];

export const SETUP_STEPS: Record<SetupStepId, SetupStepDefinition> = {
  "connect-github": {
    id: "connect-github",
    label: "Connect GitHub",
    action: "Connect GitHub",
    icon: GithubIcon,
    description: "Install the Capy app on the repos you want Capy to work in",
    image: image("connect-github"),
  },
  "ship-pr": {
    id: "ship-pr",
    label: "Ship your first PR",
    action: "Ship a PR with Capy",
    icon: PullRequestIcon,
    description: "Ask for a small change and Capy opens the pull request",
    image: image("ship-pr"),
  },
  "run-review": {
    id: "run-review",
    label: "Run a review",
    action: "Run a review",
    icon: CircleDashedIcon,
    description: "Capy reviews a pull request and leaves its findings",
  },
  "install-desktop": {
    id: "install-desktop",
    label: "Install the desktop app",
    action: "Install the app",
    icon: MacbookIcon,
    description: "Run threads in folders on your own machine",
  },
  "set-up-environment": {
    id: "set-up-environment",
    label: "Set up environment",
    action: "Ask Capy to set up",
    icon: Server2Icon,
    description:
      "Capy writes your setup scripts so new threads start ready to run",
    image: image("set-up-environment"),
  },
  "connect-slack": {
    id: "connect-slack",
    label: "Connect Slack or Linear",
    action: "Connect Slack or Linear",
    icon: SlackIcon,
    description: "Start threads from Slack messages or Linear issues",
    image: image("connect-slack"),
    choices: setupStepChoices,
  },
  "invite-teammate": {
    id: "invite-teammate",
    label: "Invite a teammate",
    action: "Invite a teammate",
    icon: PeopleAddIcon,
    description: "Bring your team in so everyone can see and share threads",
    image: image("invite-teammate"),
  },
};

export const isSetupStepId = (step: string): step is SetupStepId =>
  (SETUP_STEP_IDS as ReadonlyArray<string>).includes(step);

export type SetupStepState = {
  step: string;
  completed: boolean;
  skipped: boolean;
};

export type SetupStep = SetupStepDefinition & { done: boolean };

export type OnboardingStatus = {
  dismissed: boolean;
  steps: ReadonlyArray<SetupStepState>;
};

const asRecords = (value: unknown): unknown[] => {
  if (typeof value !== "object" || value === null) return [];
  const steps = (value as { steps?: unknown }).steps;
  return Array.isArray(steps) ? steps : [];
};

export function onboardingStatus(value: unknown): OnboardingStatus | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const row = value as Record<string, unknown>;
  return {
    dismissed: row.dismissed === true,
    steps: asRecords(value).flatMap((entry) => {
      if (typeof entry !== "object" || entry === null) return [];
      const step = entry as Record<string, unknown>;
      const id = typeof step.step === "string" ? step.step : step.id;
      if (typeof id !== "string") return [];
      return [
        {
          step: id,
          completed: step.completed === true,
          skipped: step.skipped === true,
        },
      ];
    }),
  };
}

export function setupSteps(status: OnboardingStatus): SetupStep[] {
  return status.steps.flatMap((state) => {
    if (!isSetupStepId(state.step)) return [];
    if (state.skipped && !state.completed) return [];
    return [{ ...SETUP_STEPS[state.step], done: state.completed }];
  });
}

export function setupVisible(status: OnboardingStatus | undefined) {
  if (status === undefined || status.dismissed) return false;
  const steps = setupSteps(status);
  return steps.length > 0 && steps.some((step) => !step.done);
}
