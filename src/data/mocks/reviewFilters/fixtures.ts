import { DateTime } from "effect";
import { minutesAgo } from "../fixtures/time.ts";
import { isoMinutesAgo, people, repos } from "../fixtures/world.ts";

export interface IgnorePath {
  readonly id: string;
  readonly pattern: string;
  readonly enabled: boolean;
  readonly repoIds: ReadonlyArray<string>;
  readonly note: string;
  readonly createdAt: string;
  readonly createdBy: string;
}

export interface FilterRule {
  readonly id: string;
  readonly name: string;
  readonly enabled: boolean;
  readonly match: "contains" | "equals" | "regex";
  readonly target: "title" | "body" | "file" | "author";
  readonly value: string;
  readonly action: "skip" | "comment" | "request_changes";
  readonly note: string;
  readonly createdAt: string;
  readonly createdBy: string;
}

export const sampleIgnorePaths: ReadonlyArray<IgnorePath> = [
  {
    id: "ip_sample_generated",
    pattern: "generated/**",
    enabled: true,
    repoIds: [repos[0].id],
    note: "Generated client code",
    createdAt: isoMinutesAgo(9 * 24 * 60),
    createdBy: people.sam.id,
  },
  {
    id: "ip_sample_snapshots",
    pattern: "**/*.snap",
    enabled: true,
    repoIds: [],
    note: "Test snapshots",
    createdAt: isoMinutesAgo(4 * 24 * 60),
    createdBy: people.priya.id,
  },
];

export const sampleRules: ReadonlyArray<FilterRule> = [
  {
    id: "fr_sample_wip",
    name: "Skip work in progress",
    enabled: true,
    match: "contains",
    target: "title",
    value: "WIP:",
    action: "skip",
    note: "Do not review drafts before the title is updated.",
    createdAt: isoMinutesAgo(8 * 24 * 60),
    createdBy: people.alex.id,
  },
  {
    id: "fr_sample_lockfile",
    name: "Comment on lockfile changes",
    enabled: false,
    match: "equals",
    target: "file",
    value: "bun.lock",
    action: "comment",
    note: "Ask whether dependency changes are intentional.",
    createdAt: isoMinutesAgo(5 * 24 * 60),
    createdBy: people.jordan.id,
  },
];

export const updatedAt = () => DateTime.formatIso(minutesAgo(0));
