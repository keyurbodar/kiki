export type MergeMethod = "squash" | "merge" | "rebase";

export const mergeMethods: ReadonlyArray<{
  method: MergeMethod;
  label: string;
  shortLabel: string;
  description: string;
}> = [
  {
    method: "squash",
    label: "Squash and merge",
    shortLabel: "Squash",
    description: "Combine all commits",
  },
  {
    method: "merge",
    label: "Merge commit",
    shortLabel: "Merge commit",
    description: "Preserve commit history",
  },
  {
    method: "rebase",
    label: "Rebase and merge",
    shortLabel: "Rebase",
    description: "Reapply all commits",
  },
];

export const retryLabels: Record<MergeMethod, string> = {
  squash: "Retry squash merge",
  merge: "Retry merge commit",
  rebase: "Retry rebase merge",
};

export type PullState =
  | "ready"
  | "pending"
  | "failed"
  | "draft"
  | "merged"
  | "closed";

export type ChecksState = "passed" | "failed" | "pending" | "none" | string;

export type MergeGateInput = {
  open: boolean;
  draft: boolean;
  checksState: ChecksState;
  mergeableVerdict: string | null;
  blockers: ReadonlyArray<string>;
};

const mergeableNow = new Set(["clean", "unstable", "has_hooks"]);

const canMergeNow = (verdict: string | null) =>
  verdict !== null && mergeableNow.has(verdict);

/** Joins GitHub's blocker sentences, sharing one trailing ruleset suffix. */
export const joinBlockers = (blockers: ReadonlyArray<string>) => {
  const suffix = / \((?:ruleset|branch protection) “[^”]*”\)$/.exec(
    blockers[0] ?? "",
  )?.[0];
  const shared =
    blockers.length > 1 &&
    suffix !== undefined &&
    blockers.every((blocker) => blocker.endsWith(suffix));
  const parts = blockers.map((blocker, index) => {
    const text = shared ? blocker.slice(0, -suffix.length) : blocker;
    return index === 0 ? text : text.charAt(0).toLowerCase() + text.slice(1);
  });
  const joined =
    parts.length > 1
      ? `${parts.slice(0, -1).join(", ")} and ${parts.at(-1)}`
      : (parts[0] ?? "");
  return shared ? `${joined}${suffix}` : joined;
};

export const blockedOnGitHub = (blockers: ReadonlyArray<string>) =>
  blockers.length > 0
    ? `Blocked on GitHub: ${joinBlockers(blockers)}`
    : "Blocked by a rule on GitHub";

/** Why the pull cannot merge right now, or null when it can. */
export const mergeGate = (input: MergeGateInput): string | null => {
  if (!input.open) return "Pull request is not open";
  if (input.draft) return "Draft pull requests cannot merge";
  const verdict = input.mergeableVerdict;
  if (verdict === "dirty") return "Merge conflicts with the base branch";
  if (canMergeNow(verdict)) return null;
  if (verdict === "behind") return "Branch is out of date with the base branch";
  if (verdict === "blocked" && input.blockers.length > 0) {
    return blockedOnGitHub(input.blockers);
  }
  if (input.checksState === "failed") return "Checks are failing";
  if (input.checksState === "pending") return "Waiting on checks";
  if (verdict === "blocked") return blockedOnGitHub(input.blockers);
  return input.checksState === "none" ? "Waiting on checks" : null;
};

/** Why auto-merge cannot be enabled, or null when it can. */
export const autoMergeBlocked = (input: MergeGateInput): string | null => {
  if (!input.open) return "Pull request is not open";
  if (input.draft) return "Draft pull requests cannot auto-merge";
  if (input.mergeableVerdict === "dirty") {
    return "Merge conflicts with the base branch";
  }
  return canMergeNow(input.mergeableVerdict) ? "Can merge now" : null;
};

/** Why a force merge is unavailable, or null when it can be attempted. */
export const forceMergeBlocked = (input: MergeGateInput): string | null => {
  if (!input.open) return "Pull request is not open";
  if (input.draft) return "Draft pull requests cannot merge";
  return input.mergeableVerdict === "dirty"
    ? "Merge conflicts with the base branch"
    : null;
};

/** Refusals that come from branch rules, which a stack cannot bypass. */
export const isRuleRefusal = (detail: string) =>
  /required|rule|protect/i.test(detail);

export const mergeFailureDescription = (detail: string | null) =>
  detail === null
    ? undefined
    : `${detail.replace(/\.$/, "")}${isRuleRefusal(detail) ? ", a stack cannot bypass checks" : ""}`;

export type StackMember = {
  id: string;
  number: number;
  title: string;
  position: number;
  state: PullState;
  headRef: string;
};

export type PullStack = {
  number: number | null;
  position: number;
  size: number;
  baseRef: string;
  members: ReadonlyArray<StackMember>;
};

/** The stack members a merge from this position lands, top first. */
export const landingPulls = (stack: PullStack | null) =>
  stack === null
    ? []
    : stack.members
        .filter((member) => member.position <= stack.position)
        .toSorted((a, b) => b.position - a.position);
