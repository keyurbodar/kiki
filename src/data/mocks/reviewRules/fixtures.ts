import { DateTime } from "effect";
import { minutesAgo } from "../fixtures/time.ts";
import { isoMinutesAgo, people, repos } from "../fixtures/world.ts";

export interface ReviewRule {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly enabled: boolean;
  readonly priority: "low" | "medium" | "high";
  readonly action: "comment" | "request_changes" | "approve";
  readonly repoIds: ReadonlyArray<string>;
  readonly authorIds: ReadonlyArray<string>;
  readonly instruction: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdBy: string;
}

export const sampleRules: ReadonlyArray<ReviewRule> = [
  {
    id: "rr_sample_checkout",
    name: "Checkout regression guard",
    description: "Watch payment and retry paths in the web app.",
    enabled: true,
    priority: "high",
    action: "request_changes",
    repoIds: [repos[0].id],
    authorIds: [],
    instruction: "Verify retries, timeouts and order totals before approving.",
    createdAt: isoMinutesAgo(12 * 24 * 60),
    updatedAt: isoMinutesAgo(4 * 60),
    createdBy: people.sam.id,
  },
  {
    id: "rr_sample_api_contract",
    name: "API contract check",
    description: "Flag breaking changes to the orders endpoint.",
    enabled: true,
    priority: "medium",
    action: "comment",
    repoIds: [repos[1].id, repos[2].id],
    authorIds: [people.jordan.id],
    instruction: "Call out renamed fields and removed query parameters.",
    createdAt: isoMinutesAgo(6 * 24 * 60),
    updatedAt: isoMinutesAgo(2 * 24 * 60),
    createdBy: people.alex.id,
  },
  {
    id: "rr_sample_docs",
    name: "Docs freshness",
    description: "Remind authors to update the getting started guide.",
    enabled: false,
    priority: "low",
    action: "comment",
    repoIds: [repos[3].id],
    authorIds: [],
    instruction: "Check whether the quickstart still matches the API.",
    createdAt: isoMinutesAgo(20 * 24 * 60),
    updatedAt: isoMinutesAgo(10 * 24 * 60),
    createdBy: people.priya.id,
  },
];

export const updatedAt = () => DateTime.formatIso(minutesAgo(0));
