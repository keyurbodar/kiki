export type NewProjectRepo = {
  readonly repoFullName: string;
  readonly defaultBranch: string | null;
};

export type NewProjectDraft = {
  readonly name: string;
  readonly code: string;
  readonly codeTouched: boolean;
  readonly repos: ReadonlyArray<string>;
  readonly visibility: "org" | "private";
};

/** Capy derives a thread code from the repository name: letters only, four at most. */
export const deriveProjectCode = (name: string) => {
  const letters = name.toUpperCase().replace(/[^A-Z]/g, "");
  return letters.length >= 3 ? letters.slice(0, 4) : "CAPY";
};

export const emptyDraft = (): NewProjectDraft => ({
  name: "",
  code: "",
  codeTouched: false,
  repos: [],
  visibility: "org",
});

export const nameFromRepos = (repos: ReadonlyArray<string>) => {
  const first = repos[0];
  if (first === undefined) return "";
  return first.slice(first.indexOf("/") + 1);
};

/** Typing a name re-derives the code until someone edits the code themselves. */
export const withName = (
  draft: NewProjectDraft,
  name: string,
): NewProjectDraft => ({
  ...draft,
  name,
  code: draft.codeTouched ? draft.code : deriveProjectCode(name),
});

export const withCode = (
  draft: NewProjectDraft,
  code: string,
): NewProjectDraft => ({
  ...draft,
  code: code
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 4),
  codeTouched: true,
});

export const withRepo = (
  draft: NewProjectDraft,
  repoFullName: string,
  selected: boolean,
): NewProjectDraft => {
  const repos = selected
    ? [...draft.repos, repoFullName]
    : draft.repos.filter((repo) => repo !== repoFullName);
  const named = draft.name === "" || draft.name === nameFromRepos(draft.repos);
  const name = named ? nameFromRepos(repos) : draft.name;
  return {
    ...draft,
    repos,
    name,
    code: draft.codeTouched ? draft.code : deriveProjectCode(name),
  };
};

export type DraftProblem = "name" | "code" | "repos";

export const draftProblems = (
  draft: NewProjectDraft,
): ReadonlyArray<DraftProblem> => [
  ...(draft.name.trim() === "" ? (["name"] as const) : []),
  ...(!/^[A-Z0-9]{2,4}$/u.test(draft.code) ? (["code"] as const) : []),
  ...(draft.repos.length === 0 ? (["repos"] as const) : []),
];

export const createPayload = (
  draft: NewProjectDraft,
  repos: ReadonlyArray<NewProjectRepo>,
) => ({
  name: draft.name.trim(),
  code: draft.code,
  visibility: draft.visibility,
  repos: draft.repos.map((repoFullName) => ({
    repoFullName,
    baseBranch:
      repos.find((repo) => repo.repoFullName === repoFullName)?.defaultBranch ??
      "main",
  })),
});
