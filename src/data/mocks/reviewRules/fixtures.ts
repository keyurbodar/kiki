import { isoMinutesAgo, people, repos } from "../fixtures/world.ts";

export interface ReviewRule {
  readonly id: string;
  readonly body: string;
  readonly scopes: ReadonlyArray<string>;
  readonly file: string | null;
  readonly status: string;
  readonly source: string;
  readonly sourceRef: string | null;
  readonly createdByUserId: string | null;
  readonly createdByName: string | null;
  readonly firedCount: number;
  readonly lastFired: {
    readonly repo: string;
    readonly prNumber: number;
    readonly at: string;
  } | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

const rule = (
  id: string,
  body: string,
  scopes: ReadonlyArray<string>,
  file: string | null,
  status: string,
  firedCount: number,
): ReviewRule => ({
  id,
  body,
  scopes,
  file,
  status,
  source: "org",
  sourceRef: null,
  createdByUserId: people.alex.id,
  createdByName: `${people.alex.firstName} ${people.alex.lastName}`,
  firedCount,
  lastFired:
    firedCount > 0
      ? { repo: repos[0]!.fullName, prNumber: 213, at: isoMinutesAgo(60) }
      : null,
  createdAt: isoMinutesAgo(60 * 24),
  updatedAt: isoMinutesAgo(60),
});

export const sampleReviewRules: ReadonlyArray<ReviewRule> = [
  rule(
    "rrule_sample_checkout",
    "Explain retry limits when reviewing changes to the checkout flow.",
    [repos[0]!.fullName],
    null,
    "active",
    4,
  ),
  rule(
    "rrule_sample_docs",
    "Check that public API changes include documentation updates.",
    ["*"],
    "docs/**/*.md",
    "inactive",
    0,
  ),
];
