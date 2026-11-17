import { isoMinutesAgo, people } from "../fixtures/world.ts";

export interface Experiment {
  readonly feature: string;
  readonly name: string;
  readonly enabled: boolean;
  readonly updatedAt: string;
  readonly updatedBy: string;
}

export const sampleExperiments: ReadonlyArray<Experiment> = [
  {
    feature: "review-insights",
    name: "Review insights",
    enabled: true,
    updatedAt: isoMinutesAgo(60 * 4),
    updatedBy: people.sam.id,
  },
  {
    feature: "compact-at",
    name: "Compact at",
    enabled: false,
    updatedAt: isoMinutesAgo(60 * 12),
    updatedBy: people.alex.id,
  },
  {
    feature: "device-credentials",
    name: "Device credentials",
    enabled: true,
    updatedAt: isoMinutesAgo(60 * 30),
    updatedBy: people.priya.id,
  },
];
