import type { Row } from "../db/MockDb.ts";
import {
  isoMinutesAgo,
  people,
  repos as worldRepos,
} from "../fixtures/world.ts";

type RepoRow = Row<"repos">;

export interface RepoBranch {
  readonly id: string;
  readonly repoId: string;
  readonly repoFullName: string;
  readonly name: string;
  readonly isDefault: boolean;
  readonly lastCommit: {
    readonly sha: string;
    readonly message: string;
    readonly authorId: string;
    readonly authorName: string;
    readonly committedAt: string;
  };
}

export interface RepoSkill {
  readonly id: string;
  readonly repoId: string;
  readonly name: string;
  readonly description: string;
  readonly sourceRepo: string;
  readonly installedAt: string;
}

export interface RepoTreeNode {
  readonly repoId: string;
  readonly repoFullName: string;
  readonly parentPath: string;
  readonly name: string;
  readonly path: string;
  readonly type: "file" | "directory";
  readonly size: number;
  readonly updatedAt: string;
}

const repoIdFor = (fullName: string) =>
  worldRepos.find((repo) => repo.fullName === fullName)?.id ?? fullName;

const branchDetails: Record<
  string,
  {
    readonly sha: string;
    readonly message: string;
    readonly minutesAgo: number;
  }
> = {
  main: {
    sha: "a19f4c2",
    message: "Update release notes and bump version",
    minutesAgo: 48,
  },
  "feat/dark-mode": {
    sha: "b7d2e91",
    message: "Add dark mode to settings",
    minutesAgo: 25,
  },
  "fix/checkout-timeout": {
    sha: "c4e8a30",
    message: "Retry checkout on gateway timeouts",
    minutesAgo: 4,
  },
  "chore/bundler-upgrade": {
    sha: "d0f6b85",
    message: "Upgrade the bundler",
    minutesAgo: 9 * 24 * 60,
  },
};

const authorFor = (name: string) =>
  name === "feat/dark-mode"
    ? people.sam
    : name === "chore/bundler-upgrade"
      ? people.casey
      : people.alex;

const slug = (name: string) => name.replaceAll("/", "-");

export const repoBranch = (repo: RepoRow, name: string): RepoBranch => {
  const detail = branchDetails[name] ?? {
    sha: "e3a1c77",
    message: `Update ${name}`,
    minutesAgo: 24 * 60,
  };
  const author = authorFor(name);
  return {
    id: `branch_${repo.id}_${slug(name)}`,
    repoId: repo.id,
    repoFullName: repo.fullName,
    name,
    isDefault: name === repo.defaultBranch,
    lastCommit: {
      sha: detail.sha,
      message: detail.message,
      authorId: author.id,
      authorName: `${author.firstName} ${author.lastName}`,
      committedAt: isoMinutesAgo(detail.minutesAgo),
    },
  };
};

const skill = (
  id: string,
  name: string,
  description: string,
  sourceRepo: string,
  minutesAgo: number,
): RepoSkill => ({
  id,
  repoId: repoIdFor(sourceRepo),
  name,
  description,
  sourceRepo,
  installedAt: isoMinutesAgo(minutesAgo),
});

export const sampleSkills: ReadonlyArray<RepoSkill> = [
  skill(
    "skill_sample_release_notes",
    "Release notes",
    "Drafts release notes from merged pull requests.",
    "acme/web",
    6 * 24 * 60,
  ),
  skill(
    "skill_sample_checkout_debug",
    "Checkout debug",
    "Summarizes checkout failures from the last CI run.",
    "acme/web",
    2 * 24 * 60,
  ),
  skill(
    "skill_sample_api_changelog",
    "API changelog",
    "Writes changelog entries for public endpoint changes.",
    "acme/api",
    12 * 24 * 60,
  ),
  skill(
    "skill_sample_shared_components",
    "Shared components",
    "Explains when to reuse a component from the shared library.",
    "acme/shared",
    8 * 24 * 60,
  ),
  skill(
    "skill_sample_docs_lint",
    "Docs lint",
    "Checks guide pages for broken links and stale examples.",
    "acme/docs",
    3 * 24 * 60,
  ),
];

const node = (
  repoFullName: string,
  parentPath: string,
  name: string,
  type: RepoTreeNode["type"],
  size: number,
  minutesAgo: number,
): RepoTreeNode => ({
  repoId: repoIdFor(repoFullName),
  repoFullName,
  parentPath,
  name,
  path: parentPath ? `${parentPath}/${name}` : name,
  type,
  size,
  updatedAt: isoMinutesAgo(minutesAgo),
});

const dir = (
  repoFullName: string,
  parentPath: string,
  name: string,
  minutesAgo: number,
) => node(repoFullName, parentPath, name, "directory", 0, minutesAgo);

const file = (
  repoFullName: string,
  parentPath: string,
  name: string,
  size: number,
  minutesAgo: number,
) => node(repoFullName, parentPath, name, "file", size, minutesAgo);

export const sampleRepoTrees: ReadonlyArray<RepoTreeNode> = [
  dir("acme/web", "", "src", 42),
  dir("acme/web", "", "tests", 90),
  file("acme/web", "", "package.json", 1_240, 30),
  file("acme/web", "", "README.md", 3_820, 3 * 60),
  dir("acme/web", "src", "components", 25),
  file("acme/web", "src", "main.tsx", 540, 42),
  file("acme/web", "src", "app.tsx", 2_180, 25),
  file("acme/web", "src/components", "Button.tsx", 740, 25),
  file("acme/web", "tests", "app.test.ts", 920, 90),
  dir("acme/api", "", "cmd", 80),
  dir("acme/api", "", "internal", 80),
  file("acme/api", "", "go.mod", 860, 6 * 60),
  file("acme/api", "", "README.md", 2_410, 8 * 60),
  file("acme/api", "cmd", "main.go", 1_120, 80),
  file("acme/api", "internal", "orders.go", 3_640, 80),
  dir("acme/shared", "", "src", 15),
  dir("acme/shared", "", "tests", 15),
  file("acme/shared", "", "package.json", 980, 20),
  file("acme/shared", "", "README.md", 1_760, 4 * 60),
  file("acme/shared", "src", "index.ts", 1_480, 15),
  dir("acme/docs", "", "pages", 5 * 60),
  file("acme/docs", "", "README.md", 2_080, 5 * 60),
  file("acme/docs", "pages", "getting-started.mdx", 4_812, 5 * 60),
  dir("acme/legacy-site", "", "public", 30 * 24 * 60),
  dir("acme/legacy-site", "", "includes", 30 * 24 * 60),
  file("acme/legacy-site", "", "index.php", 2_960, 30 * 24 * 60),
  file("acme/legacy-site", "", "README.md", 640, 30 * 24 * 60),
  file("acme/legacy-site", "public", "app.css", 8_140, 30 * 24 * 60),
];
