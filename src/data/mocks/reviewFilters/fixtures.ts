import { isoMinutesAgo, people, repos } from "../fixtures/world.ts";

export interface FilterCondition {
  readonly field: "label" | "base_branch" | "title_or_body" | "author";
  readonly not: boolean;
  readonly values: ReadonlyArray<string>;
}

export interface RepositoryCondition {
  readonly not: boolean;
  readonly repoIds: ReadonlyArray<number>;
}

export interface ReviewFilterRule {
  readonly id: string;
  readonly repo: string | null;
  readonly githubRepoId: number | null;
  readonly conditions: ReadonlyArray<FilterCondition>;
  readonly repositoryCondition: RepositoryCondition | null;
  readonly skipped: boolean;
  readonly source: "manual";
  readonly createdByUserId: string | null;
  readonly createdByName: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ReviewIgnorePaths {
  readonly id: string;
  readonly repo: string | null;
  readonly githubRepoId: number | null;
  readonly patterns: ReadonlyArray<string>;
  readonly skipped: boolean;
  readonly source: "manual";
  readonly createdByUserId: string | null;
  readonly createdByName: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

const created = () => ({
  skipped: false,
  source: "manual" as const,
  createdByUserId: people.alex.id,
  createdByName: `${people.alex.firstName} ${people.alex.lastName}`,
  createdAt: isoMinutesAgo(60 * 24),
  updatedAt: isoMinutesAgo(60),
});

export const sampleFilterRules: ReadonlyArray<ReviewFilterRule> = [
  {
    ...created(),
    id: "rfilt_sample_dependabot",
    repo: repos[0]!.fullName,
    githubRepoId: 1001,
    conditions: [
      { field: "author", not: false, values: ["dependabot-sample"] },
    ],
    repositoryCondition: null,
  },
  {
    ...created(),
    id: "rfilt_sample_release",
    repo: repos[1]!.fullName,
    githubRepoId: 1002,
    conditions: [
      { field: "label", not: false, values: ["skip-review"] },
      { field: "base_branch", not: true, values: ["release"] },
    ],
    repositoryCondition: { not: false, repoIds: [1002] },
  },
];

export const sampleIgnorePaths: ReadonlyArray<ReviewIgnorePaths> = [
  {
    ...created(),
    id: "rpath_sample_lockfile",
    repo: repos[0]!.fullName,
    githubRepoId: 1001,
    patterns: ["**/bun.lock", "**/*.generated.ts"],
  },
];
