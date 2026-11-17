/** Capy's review rule limits. */
export const ruleLimits = {
  active: 80,
  body: 4000,
  scopes: 8,
  paths: 8,
  glob: 160,
  filePath: 500,
  fileBytes: 16000,
} as const;

export interface RuleScope {
  readonly repo: string | null;
  readonly paths: ReadonlyArray<string>;
  readonly covered?: boolean;
  readonly heldByCaller?: boolean;
}

export interface ReviewRule {
  readonly id: string;
  readonly body: string;
  readonly status: "active" | "inactive";
  readonly scopes: ReadonlyArray<RuleScope>;
  readonly file: {
    readonly repo: string;
    readonly path: string;
    readonly covered?: boolean;
  } | null;
  readonly source?: string;
  readonly createdByName: string | null;
  readonly createdByUserId: string | null;
  readonly firedCount: number;
  readonly lastFired: {
    readonly repo: string;
    readonly prNumber: number;
  } | null;
}

export interface ReviewRulesPage {
  readonly rules: ReadonlyArray<ReviewRule>;
  readonly nextCursor: string | null;
}

/** First line of a rule, or its file path. */
export const ruleTitle = (rule: Pick<ReviewRule, "file" | "body">) =>
  rule.file?.path ?? rule.body.split("\n")[0] ?? "";

export const ruleSource = (
  rule: Pick<ReviewRule, "createdByName" | "source">,
) =>
  rule.createdByName ??
  (rule.source === "comment"
    ? "Pull request comment"
    : rule.source === "tool"
      ? "Capy"
      : "—");

const scopeText = (scope: RuleScope) =>
  `${scope.paths.length === 0 ? "" : `${scope.paths.join(",")} in `}${scope.repo ?? "every repository"}`;

/** Full scope text for the Scope cell's title. */
export const scopeTitle = (rule: Pick<ReviewRule, "scopes">) =>
  rule.scopes.map(scopeText).join(" or ");

/** Short scope text for the Scope cell. */
export const scopeSummary = (rule: Pick<ReviewRule, "scopes">) => {
  if (rule.scopes.some((scope) => scope.repo === null))
    return "All repositories";
  const repos = [...new Set(rule.scopes.map((scope) => scope.repo))];
  if (repos.length > 1) return `${repos.length} repositories`;
  const paths = rule.scopes.flatMap((scope) => scope.paths);
  return paths.length === 0 ||
    rule.scopes.some((scope) => scope.paths.length === 0)
    ? repos[0]
    : `${paths.join(",")} in ${repos[0]}`;
};

export const accessChanged = (rule: Pick<ReviewRule, "file" | "scopes">) =>
  rule.file?.covered === false ||
  rule.scopes.some((scope) => scope.covered === false);

/** The dialog's subtitle: who added the rule and how often it fired. */
export const ruleDialogSubtitle = (rule: ReviewRule | undefined) =>
  rule === undefined
    ? "Instructions for reviews paid by your organization"
    : [
        `Added by ${rule.createdByName ?? (rule.createdByUserId === null ? "API key" : "Former member")}`,
        `${rule.firedCount} ${rule.firedCount === 1 ? "finding" : "findings"}`,
        rule.lastFired === null
          ? null
          : `last on ${rule.lastFired.repo}#${rule.lastFired.prNumber}`,
      ]
        .filter((part) => part !== null)
        .join(" · ");

export interface DraftScope {
  readonly repo: string | null;
  readonly paths: string;
}

/** Scopes merged per repository (case-insensitively) for the editor. */
export const draftScopes = (
  scopes: ReadonlyArray<RuleScope> | undefined,
): DraftScope[] => {
  const source = scopes ?? [{ repo: null, paths: [] }];
  const merged = new Map<string | null, string[] | null>();
  for (const scope of source) {
    const key = scope.repo === null ? null : scope.repo.toLowerCase();
    const previous = merged.get(key);
    merged.set(
      key,
      previous === null || scope.paths.length === 0
        ? null
        : [...(previous ?? []), ...scope.paths],
    );
  }
  return [...merged.entries()].map(([key, paths]) => ({
    repo:
      key === null
        ? null
        : (source.find((scope) => scope.repo?.toLowerCase() === key)?.repo ??
          key),
    paths: paths === null ? "" : paths.join(","),
  }));
};

export const parseScopes = (drafts: ReadonlyArray<DraftScope>) =>
  drafts.map((draft) => ({
    repo: draft.repo,
    paths: draft.paths
      .split(",")
      .map((path) => path.trim())
      .filter((path) => path !== ""),
  }));

const controlOrBackslash = /[\p{Cc}\\]/u;

export const globValid = (glob: string) =>
  glob.length <= ruleLimits.glob &&
  !controlOrBackslash.test(glob) &&
  !glob.startsWith("/") &&
  !glob.startsWith("!") &&
  !glob.split("/").includes("..");

export const scopesValid = (scopes: ReturnType<typeof parseScopes>) =>
  scopes.length > 0 &&
  scopes.length <= ruleLimits.scopes &&
  scopes.every(
    (scope) =>
      scope.paths.length <= ruleLimits.paths && scope.paths.every(globValid),
  );

const fileForbidden = /[\p{Cc}\\:*?[\]{}]/u;

export const filePathValid = (repo: string, path: string) =>
  repo !== "" &&
  path.length > 0 &&
  path.length <= ruleLimits.filePath &&
  !fileForbidden.test(path) &&
  !path.split("/").some((part) => part === "" || part === "." || part === "..");

export interface RuleDraft {
  readonly body: string;
  readonly file: { readonly repo: string; readonly path: string } | null;
  readonly scopes: ReturnType<typeof parseScopes>;
  readonly status: "active" | "inactive";
}

/** Only the fields an edit changed, or the whole draft for a new rule. */
export const rulePatch = (rule: ReviewRule | undefined, draft: RuleDraft) => {
  if (rule === undefined) return draft;
  const patch: Record<string, unknown> = {};
  if (draft.body !== rule.body) patch.body = draft.body;
  if (draft.status !== rule.status) patch.status = draft.status;
  if (
    JSON.stringify(draft.scopes) !==
    JSON.stringify(rule.scopes.map(({ repo, paths }) => ({ repo, paths })))
  )
    patch.scopes = draft.scopes;
  if (
    JSON.stringify(draft.file) !==
    JSON.stringify(
      rule.file === null
        ? null
        : { repo: rule.file.repo, path: rule.file.path },
    )
  )
    patch.file = draft.file;
  return patch;
};
