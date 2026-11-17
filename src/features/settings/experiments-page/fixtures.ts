import type { Experiment, ExperimentMembers } from "./feature-catalog";

export const sampleOrganization = { name: "Acme", isAdmin: true };

export const sampleExperiments: Experiment[] = [
  { feature: "computer_use_macos", orgEnabled: false },
  { feature: "review_telemetry", orgEnabled: false },
];

export const sampleMembers: ExperimentMembers[] = [
  { feature: "computer_use_macos", membersOn: 2, memberCount: 6 },
  { feature: "review_telemetry", membersOn: 0, memberCount: 6 },
];
