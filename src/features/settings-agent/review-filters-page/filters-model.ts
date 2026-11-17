export type FilterField = "label" | "base_branch" | "title_or_body" | "author";
export type ConditionField = FilterField | "repository";

/** Capy's review filter limits. */
export const filterLimits = {
  rules: 50,
  conditions: 10,
  values: 50,
  valueLength: 255,
  patterns: 50,
  ignorePaths: 50,
} as const;

export const conditionFields: ReadonlyArray<ConditionField> = [
  "label",
  "base_branch",
  "title_or_body",
  "author",
  "repository",
];

export const fieldLabels: Record<ConditionField, string> = {
  label: "Label",
  base_branch: "Base branch",
  title_or_body: "Title or body",
  author: "Author",
  repository: "Repository",
};

export const fieldPlaceholders: Record<FilterField, string> = {
  label: "skip-review, wip",
  base_branch: "release/*, dependabot/**",
  title_or_body: "chore: release, [skip review]",
  author: "dependabot[bot], renovate[bot]",
};

export const operatorLabel = (field: ConditionField, not: boolean) =>
  field === "title_or_body"
    ? not
      ? "doesn't contain any of"
      : "contains any of"
    : not
      ? "is not any of"
      : "is any of";

export interface FilterCondition {
  readonly field: FilterField;
  readonly not: boolean;
  readonly values: ReadonlyArray<string>;
}

export interface FilterRepository {
  readonly githubRepoId: number;
  readonly repo: string;
}

export interface FilterRule {
  readonly id: string;
  readonly repo: string | null;
  readonly conditions: ReadonlyArray<FilterCondition>;
  readonly repositoryCondition?: {
    readonly not: boolean;
    readonly repoIds: ReadonlyArray<number>;
  } | null;
  readonly skipped?: boolean;
  readonly source: string;
  readonly createdByName: string | null;
}

export interface IgnorePathsRow {
  readonly id: string;
  readonly repo: string | null;
  readonly patterns: ReadonlyArray<string>;
  readonly skipped?: boolean;
  readonly source: string;
  readonly createdByName: string | null;
}

export interface FilterRulesList {
  readonly rules: ReadonlyArray<FilterRule>;
  readonly repositories: ReadonlyArray<FilterRepository>;
  readonly repositoryConditionsEnabled: boolean;
}

/** Every condition of a rule, the repository condition last. */
export const ruleConditions = (
  rule: Pick<FilterRule, "conditions" | "repositoryCondition">,
) => [
  ...rule.conditions.map((condition) => ({
    field: condition.field as ConditionField,
    not: condition.not,
    values: condition.values,
  })),
  ...(rule.repositoryCondition == null
    ? []
    : [
        {
          field: "repository" as ConditionField,
          not: rule.repositoryCondition.not,
          values: rule.repositoryCondition.repoIds.map(String),
        },
      ]),
];

export const repositoryName = (
  id: string,
  repositories: ReadonlyArray<FilterRepository>,
) =>
  repositories.find((repo) => String(repo.githubRepoId) === id)?.repo ??
  `Repository ${id} unavailable`;

/** One line describing a rule, as the Rule column shows it. */
export const describeRule = (
  rule: Pick<FilterRule, "conditions" | "repositoryCondition">,
  repositories: ReadonlyArray<FilterRepository>,
) =>
  ruleConditions(rule)
    .map(
      (condition) =>
        `${fieldLabels[condition.field]} ${operatorLabel(condition.field, condition.not)} ${condition.values
          .map((value) =>
            condition.field === "repository"
              ? repositoryName(value, repositories)
              : value,
          )
          .join(", ")}`,
    )
    .join(", and ");

export const sourceLabel = (row: {
  source: string;
  createdByName: string | null;
}) =>
  row.source === "greptile" ? "greptile.json" : (row.createdByName ?? "Manual");

export const splitValues = (text: string) =>
  text
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

export interface DraftCondition {
  readonly field: ConditionField;
  readonly not: boolean;
  readonly values: string;
}

export const blankCondition = (): DraftCondition => ({
  field: "label",
  not: false,
  values: "",
});

export const draftConditions = (
  rule: Pick<FilterRule, "conditions" | "repositoryCondition">,
): DraftCondition[] => {
  const all = ruleConditions(rule);
  return all.length === 0
    ? [blankCondition()]
    : all.map((condition) => ({
        field: condition.field,
        not: condition.not,
        values: condition.values.join(", "),
      }));
};

/** Whether the rule editor's conditions can be saved. */
export const conditionsValid = (
  drafts: ReadonlyArray<DraftCondition>,
  repositories: ReadonlyArray<FilterRepository>,
) => {
  const parsed = drafts.map((draft) => ({
    ...draft,
    values: splitValues(draft.values),
  }));
  return (
    parsed.length > 0 &&
    parsed.length <= filterLimits.conditions &&
    parsed.filter((condition) => condition.field === "repository").length <=
      1 &&
    parsed.every(
      (condition) =>
        condition.values.length > 0 &&
        condition.values.length <= filterLimits.values &&
        (condition.field !== "repository" ||
          condition.values.every((value) =>
            repositories.some((repo) => String(repo.githubRepoId) === value),
          )),
    )
  );
};

/** The create/update payload for the rule editor's state. */
export const rulePayload = (
  repo: string | null,
  drafts: ReadonlyArray<DraftCondition>,
  repositoryConditionsEnabled: boolean,
) => {
  const parsed = drafts.map((draft) => ({
    field: draft.field,
    not: draft.not,
    values: splitValues(draft.values),
  }));
  const repository = parsed.find(
    (condition) => condition.field === "repository",
  );
  return {
    repo,
    conditions: parsed.filter((condition) => condition.field !== "repository"),
    repositoryCondition:
      repository === undefined
        ? null
        : repositoryConditionsEnabled
          ? { not: repository.not, repoIds: repository.values.map(Number) }
          : undefined,
  };
};

export const patternsValid = (patterns: ReadonlyArray<string>) =>
  patterns.length > 0 && patterns.length <= filterLimits.patterns;
