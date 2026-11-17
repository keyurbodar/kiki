export type OnboardingStep =
  | "profile"
  | "subscription"
  | "github"
  | "recommended"
  | "plan";

export type OnboardingPath = "personal" | "team" | "invitee";

export type StepperId =
  | "workspace"
  | "join"
  | "profile"
  | "subscription"
  | "github"
  | "recommended"
  | "plan";

export type StepperEntry = { readonly id: StepperId; readonly label: string };

export const ownerSteps: ReadonlyArray<StepperEntry> = [
  { id: "workspace", label: "Workspace" },
  { id: "profile", label: "Profile" },
  { id: "subscription", label: "Subscription" },
  { id: "github", label: "GitHub" },
  { id: "recommended", label: "Recommended" },
];

export const ownerStepsWithPlan: ReadonlyArray<StepperEntry> = [
  ...ownerSteps,
  { id: "plan", label: "Plan" },
];

export const inviteeSteps: ReadonlyArray<StepperEntry> = [
  { id: "join", label: "Join" },
  { id: "subscription", label: "Subscription" },
  { id: "recommended", label: "Recommended" },
];

export const inviteeStepsWithoutSubscription = inviteeSteps.filter(
  (step) => step.id !== "subscription",
);

const ownerSequence: ReadonlyArray<OnboardingStep> = [
  "profile",
  "subscription",
  "github",
  "recommended",
];

const inviteeSequence: ReadonlyArray<OnboardingStep> = [
  "subscription",
  "recommended",
];

const sequenceFor = (path: OnboardingPath) =>
  path === "invitee" ? inviteeSequence : ownerSequence;

export const stepperFor = (
  path: OnboardingPath,
  options: { readonly withPlan: boolean; readonly coveredInvitee: boolean },
) => {
  if (path === "invitee") {
    return options.coveredInvitee
      ? inviteeStepsWithoutSubscription
      : inviteeSteps;
  }
  return options.withPlan ? ownerStepsWithPlan : ownerSteps;
};

export const firstStep = (path: OnboardingPath): OnboardingStep =>
  path === "invitee" ? "subscription" : "profile";

export const nextStep = (
  path: OnboardingPath,
  step: OnboardingStep,
): OnboardingStep | undefined => {
  const sequence = sequenceFor(path);
  const index = sequence.indexOf(step);
  return index === -1 ? undefined : sequence[index + 1];
};

export const previousStep = (
  path: OnboardingPath,
  step: OnboardingStep,
  coveredInvitee = false,
): OnboardingStep | undefined => {
  const sequence = sequenceFor(path);
  const index = sequence.indexOf(step);
  return sequence
    .slice(0, Math.max(index, 0))
    .findLast((candidate) => !(coveredInvitee && candidate === "subscription"));
};

const fixtureAliases: Readonly<Record<string, string>> = {
  project: "github",
  source: "github",
  "auto-sync": "recommended",
  reviews: "recommended",
  connect: "subscription",
  yours: "profile",
};

export type OnboardingView = OnboardingStep | "workspace" | "invites";

const views: ReadonlyArray<OnboardingView> = [
  "workspace",
  "invites",
  "profile",
  "subscription",
  "github",
  "recommended",
  "plan",
];

export const fixtureView = (fixture: string | undefined) => {
  if (fixture === undefined) return undefined;
  const resolved = fixtureAliases[fixture] ?? fixture;
  return views.find((view) => view === resolved);
};

export type OnboardingSearch = {
  readonly avatar?: string;
  readonly covered?: string;
  readonly credentials?: string;
  readonly fixture?: string;
  readonly githubFixture?: string;
  readonly history?: string;
  readonly intent?: string;
  readonly jamId?: string;
  readonly machineId?: string;
  readonly path?: string;
};

export type OnboardingStart = {
  readonly view: OnboardingView | undefined;
  readonly path: OnboardingPath;
  readonly coveredInvitee: boolean;
  readonly githubConnected: boolean;
};

export const onboardingStart = (search: OnboardingSearch): OnboardingStart => ({
  view: fixtureView(search.fixture),
  path:
    search.path === "team"
      ? "team"
      : search.path === "invitee"
        ? "invitee"
        : "personal",
  coveredInvitee: search.covered !== undefined && search.covered !== "false",
  githubConnected: search.githubFixture === "connected",
});

export const splitEmails = (value: string) =>
  value
    .split(/[\s,;]+/u)
    .map((email) => email.trim())
    .filter((email) => email.length > 0);

export const invitationsSentLabel = (sent: number) =>
  sent === 0
    ? "Separate addresses with commas or spaces"
    : sent === 1
      ? "1 invitation sent"
      : `${sent} invitations sent`;

export const repositoriesLabel = (count: number | undefined) =>
  count === undefined
    ? "Checking which repositories Capy can reach"
    : count === 1
      ? "Capy can reach 1 repository"
      : `Capy can reach ${count} repositories`;

export const splitName = (name: string) => {
  const trimmed = name.trim();
  const space = trimmed.indexOf(" ");
  return space === -1
    ? { firstName: trimmed, lastName: "" }
    : {
        firstName: trimmed.slice(0, space),
        lastName: trimmed.slice(space + 1),
      };
};

export const displayName = (
  person:
    | { readonly firstName: string | null; readonly lastName: string | null }
    | undefined,
) =>
  person === undefined
    ? ""
    : [person.firstName, person.lastName]
        .filter((part) => part !== null && part !== "")
        .join(" ");

export const subscriptionServices = [
  "claude",
  "codex",
  "copilot",
  "supergrok",
] as const;

export type SubscriptionService = (typeof subscriptionServices)[number];

export const subscriptionLabels: Record<SubscriptionService, string> = {
  codex: "Codex",
  copilot: "GitHub Copilot",
  supergrok: "SuperGrok",
  claude: "Claude Code",
};

export const subscriptionDescriptions: Record<SubscriptionService, string> = {
  codex: "Use your ChatGPT plan",
  copilot: "Copilot Pro or Business",
  supergrok: "Use your SuperGrok plan",
  claude: "Use your Claude plan",
};
