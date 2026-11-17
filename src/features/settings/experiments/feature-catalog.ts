export const featureCatalog = {
  computer_use_macos: {
    label: "Computer use on macOS",
    description:
      "Capy can use apps on your paired Mac. It takes the mouse and keyboard while it works, and any input from you stops it.",
  },
  memory: {
    label: "Memory",
    description:
      "Capy remembers what you teach it across threads: your preferences and lessons about your projects.",
  },
  review_telemetry: {
    label: "Review telemetry",
    description:
      "Capy's review checks the endpoints and services a pull request touches against live telemetry and notes whether production degrades when it merges.",
  },
} as const;

export type ExperimentFeature = keyof typeof featureCatalog;

export type Experiment = {
  feature: ExperimentFeature;
  orgEnabled: boolean;
};

export type ExperimentMembers = {
  feature: ExperimentFeature;
  membersOn: number;
  memberCount: number;
};

export type ExperimentChoice = "on" | "off";

export const experimentOptions: ReadonlyArray<{
  value: ExperimentChoice;
  label: string;
}> = [
  { value: "on", label: "On" },
  { value: "off", label: "Off" },
];

export const pausedNote = "Paused: off for everyone and cannot be turned on";

export const experimentRowId = (feature: ExperimentFeature) =>
  feature === "memory" ? "capy-memory" : `experiment-${feature}`;

export function membersSummary({ membersOn, memberCount }: ExperimentMembers) {
  if (membersOn === 0) return "Off for everyone";
  if (membersOn === memberCount) return `On for all ${memberCount} members`;
  return `On for ${membersOn} of ${memberCount} members`;
}

export function effectiveChoice(
  own: ExperimentChoice | undefined,
  orgEnabled: boolean,
): { label: string; inherited: boolean } {
  if (own === undefined)
    return { label: orgEnabled ? "On" : "Off", inherited: true };
  return { label: own === "on" ? "On" : "Off", inherited: false };
}
