export type SummaryPullRequestRef = {
  kind: "pr";
  number: number;
  url: string;
};

export type SummaryLivePullRequest = {
  number: number;
  repo: string;
  title: string;
  state: "ready" | "pending" | "draft" | "merged" | "failed" | "closed";
  additions: number;
  deletions: number;
};

export type SummaryPort = {
  kind: "port";
  title: string;
  owningJamId?: string;
  machineId: string;
  port: number;
};

export type SummaryAutomation = { bound: boolean };

export type SummaryEnvironmentRequest = { variables: readonly string[] };

export type SummaryBuildStatus =
  | "building"
  | "succeeded"
  | "failed"
  | "cancelled";

export type SummarySetupReference =
  | { kind: "version"; versionId: string; toolCallId: string }
  | {
      kind: "build";
      buildId: string;
      test: boolean;
      toolCallId: string;
      /** What the call itself reported, for when the build's record is not on hand. */
      status?: SummaryBuildStatus;
    }
  | { kind: "snapshots"; enabled: boolean; toolCallId: string };

export type SummarySetupVersion = { id: string; versionNumber: number };

export type SummaryTurn = {
  prs: readonly SummaryPullRequestRef[];
  ports: readonly SummaryPort[];
  automations: readonly SummaryAutomation[];
  environmentRequests: readonly SummaryEnvironmentRequest[];
  setup: readonly SummarySetupReference[];
};

export const repoName = (repo: string) => repo.split("/")[1] ?? repo;

export const repoFullNameFromPullUrl = (url: string) =>
  /^https?:\/\/[^/]+\/([^/]+\/[^/]+)\/pull\/\d+(?:[/?#]|$)/.exec(url)?.[1];

export const repoNameFromPullUrl = (url: string) =>
  repoFullNameFromPullUrl(url)?.split("/")[1];

export const livePullRequest = (
  reference: SummaryPullRequestRef,
  live: readonly SummaryLivePullRequest[],
) => {
  const repo = repoFullNameFromPullUrl(reference.url);
  return live.find(
    (candidate) =>
      candidate.number === reference.number &&
      (repo === undefined ||
        candidate.repo.toLowerCase() === repo.toLowerCase()),
  );
};

export const pullRequestLabel = (
  reference: SummaryPullRequestRef,
  live: SummaryLivePullRequest | undefined,
) => {
  const repo =
    live === undefined
      ? repoNameFromPullUrl(reference.url)
      : repoName(live.repo);
  return repo === undefined
    ? `#${reference.number}`
    : `${repo}#${reference.number}`;
};

const pullRequestPhrases = (
  prs: readonly SummaryPullRequestRef[],
  live: readonly SummaryLivePullRequest[],
) => {
  if (prs.length === 0) return [];
  const verbs = prs.map((pr) => {
    const state = livePullRequest(pr, live)?.state;
    return state === "merged"
      ? "merged"
      : state === "closed"
        ? "closed"
        : "opened";
  });
  const [pr] = prs;
  if (prs.length === 1 && pr !== undefined) {
    const match = livePullRequest(pr, live);
    const repo =
      match === undefined ? repoNameFromPullUrl(pr.url) : repoName(match.repo);
    return [
      `${verbs[0]} ${repo === undefined ? `PR #${pr.number}` : `${repo}#${pr.number}`}`,
    ];
  }
  return (["merged", "closed", "opened"] as const).flatMap((verb) => {
    const count = verbs.filter((v) => v === verb).length;
    return count === 0
      ? []
      : [
          `${verb} ${count === 1 ? "a pull request" : `${count} pull requests`}`,
        ];
  });
};

export const summarizeTurn = (
  turn: SummaryTurn,
  live: readonly SummaryLivePullRequest[] = [],
  setupVersions: readonly SummarySetupVersion[] = [],
) => {
  const parts: string[] = [...pullRequestPhrases(turn.prs, live)];
  if (turn.ports.length > 0)
    parts.push(
      turn.ports.length === 1
        ? "exposed a preview"
        : `exposed ${turn.ports.length} previews`,
    );
  if (turn.automations.length > 0) {
    const bound = turn.automations.filter((a) => a.bound).length;
    const count = turn.automations.length;
    parts.push(
      count === 1
        ? bound === 1
          ? "set up an automation that runs in this thread"
          : "set up an automation"
        : bound === count
          ? `set up ${count} automations that run in this thread`
          : `set up ${count} automations`,
    );
  }
  if (turn.environmentRequests.length > 0) {
    const variables = turn.environmentRequests.flatMap((r) => r.variables);
    parts.push(
      variables.length === 1
        ? `requested ${variables[0]}`
        : `requested ${variables.length} environment variables`,
    );
  }
  const versions = turn.setup.filter((s) => s.kind === "version");
  if (versions.length > 0) {
    const numbers = versions.flatMap(
      (v) =>
        setupVersions.find((s) => s.id === v.versionId)?.versionNumber ?? [],
    );
    parts.push(
      versions.length === 1
        ? numbers[0] === undefined
          ? "saved the Setup"
          : `saved the Setup, version ${numbers[0]}`
        : `saved the Setup ${versions.length} times`,
    );
  }
  const builds = turn.setup.filter((s) => s.kind === "build");
  if (builds.length > 0)
    parts.push(
      builds.length === 1
        ? builds[0]?.test
          ? "started a test build"
          : "started a snapshot build"
        : `started ${builds.length} builds`,
    );
  const snapshots = turn.setup.filter((s) => s.kind === "snapshots").at(-1);
  if (snapshots !== undefined)
    parts.push(snapshots.enabled ? "enabled snapshots" : "disabled snapshots");
  const text =
    parts.length <= 1
      ? (parts[0] ?? "")
      : parts.length === 2
        ? `${parts[0]} and ${parts[1]}`
        : `${parts.slice(0, -1).join(", ")}, and ${parts.at(-1)}`;
  return text.charAt(0).toUpperCase() + text.slice(1);
};
