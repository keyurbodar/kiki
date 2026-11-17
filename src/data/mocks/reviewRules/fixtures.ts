import { isoMinutesAgo, people, repos } from "../fixtures/world.ts";

export interface ReviewRuleScope {
  readonly repo: string | null;
  readonly paths: ReadonlyArray<string>;
  readonly githubRepoId: number | null;
  readonly covered: boolean;
  readonly heldByCaller: boolean;
}

export interface ReviewRuleFile {
  readonly repo: string;
  readonly path: string;
  readonly githubRepoId: number;
  readonly covered: boolean;
}

export interface ReviewRule {
  readonly id: string;
  readonly body: string;
  readonly scopes: ReadonlyArray<ReviewRuleScope>;
  readonly file: ReviewRuleFile | null;
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

export const allRepositories: ReviewRuleScope = {
  repo: null,
  paths: [],
  githubRepoId: null,
  covered: true,
  heldByCaller: true,
};

const rule = (
  id: string,
  body: string,
  scopes: ReadonlyArray<ReviewRuleScope>,
  file: ReviewRuleFile | null,
  status: string,
  firedCount: number,
): ReviewRule => ({
  id,
  body,
  scopes,
  file,
  status,
  source: "app",
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
    [
      {
        repo: repos[0]!.fullName,
        paths: [],
        githubRepoId: 1001,
        covered: true,
        heldByCaller: true,
      },
    ],
    null,
    "active",
    4,
  ),
  rule(
    "rrule_sample_docs",
    "Check that public API changes include documentation updates.",
    [allRepositories],
    {
      repo: repos[3]!.fullName,
      path: "docs/review-guide.md",
      githubRepoId: 1004,
      covered: true,
    },
    "inactive",
    0,
  ),
];
