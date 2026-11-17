/** One CI check or commit status on a pull's head, as Capy's checks endpoint reports it. */
export type PullCheck = {
  kind: "check" | "status";
  name: string;
  state?: string | null;
  conclusion?: string | null;
  detailsUrl: string | null;
};

export type CheckVerdict = "failure" | "pending" | "success" | "neutral";

export const checkVerdict = (check: PullCheck): CheckVerdict => {
  if (check.kind === "status") {
    if (check.state === "failure" || check.state === "error") return "failure";
    return check.state === "success" ? "success" : "pending";
  }
  if (check.conclusion == null) return "pending";
  if (check.conclusion === "success") return "success";
  return check.conclusion === "failure" || check.conclusion === "timed_out"
    ? "failure"
    : "neutral";
};

export const checkVerdictWord = (check: PullCheck) => {
  const verdict = checkVerdict(check);
  if (verdict === "failure") return "Failed";
  if (verdict === "pending") return "Running";
  return verdict === "success" ? "Passed" : "Skipped";
};

const verdictOrder: Record<CheckVerdict, number> = {
  failure: 0,
  pending: 1,
  neutral: 2,
  success: 3,
};

/** Failures first, then running, skipped and passed, each by name. */
export const sortChecks = (checks: ReadonlyArray<PullCheck>) =>
  checks.toSorted(
    (a, b) =>
      verdictOrder[checkVerdict(a)] - verdictOrder[checkVerdict(b)] ||
      a.name.localeCompare(b.name),
  );

export const checksSummary = (checks: ReadonlyArray<PullCheck>) => {
  const counts = { failure: 0, pending: 0, neutral: 0, success: 0 };
  for (const check of checks) counts[checkVerdict(check)] += 1;
  const parts = [
    counts.failure > 0 ? `${counts.failure} failed` : null,
    counts.pending > 0 ? `${counts.pending} running` : null,
    counts.success > 0 ? `${counts.success} passed` : null,
    counts.neutral > 0 ? `${counts.neutral} skipped` : null,
  ].filter((part) => part !== null);
  return parts.length === 0 ? "No checks yet" : parts.join(", ");
};

/** The rolled-up verdict of a set of checks, worst first. */
export const checksVerdict = (
  checks: ReadonlyArray<PullCheck>,
): CheckVerdict => {
  const verdicts = checks.map(checkVerdict);
  if (verdicts.includes("failure")) return "failure";
  if (verdicts.includes("pending")) return "pending";
  return verdicts.includes("success") ? "success" : "neutral";
};
