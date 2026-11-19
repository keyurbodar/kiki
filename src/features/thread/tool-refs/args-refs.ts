import { parsePullHref } from "@/features/thread/pull-ref-link/pull-ref";

/**
 * A tool call's payload is the only place a reference can come from: our rows
 * carry no reference field, so a call that names a thread or a pull says so in
 * its own args, at any depth (`{params: {jamId}}` is as common as `{threadId}`).
 */

const THREAD_KEYS = new Set(["threadId", "jamId", "thread_id", "jam_id"]);
const REPO_KEYS = new Set([
  "repo",
  "repository",
  "repoFullName",
  "repo_full_name",
]);
const NUMBER_KEYS = new Set([
  "number",
  "prNumber",
  "pr_number",
  "pullNumber",
  "pull_number",
]);

/** Deep enough for `{params: {filters: [{jamId}]}}`, shallow enough to stay bounded. */
const MAX_DEPTH = 6;

export type ToolPullRef = { repositoryFullName: string; number: number };

export type ToolRefsFound = {
  threadId?: string;
  pull?: ToolPullRef;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const text = (value: unknown) =>
  typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;

const count = (value: unknown) =>
  typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : undefined;

const pullFromRecord = (
  record: Record<string, unknown>,
): ToolPullRef | undefined => {
  let repositoryFullName: string | undefined;
  let number: number | undefined;
  for (const [key, value] of Object.entries(record)) {
    if (repositoryFullName === undefined && REPO_KEYS.has(key))
      repositoryFullName = text(value);
    if (number === undefined && NUMBER_KEYS.has(key)) number = count(value);
  }
  if (repositoryFullName === undefined || number === undefined) return;
  const [owner, name] = repositoryFullName.split("/");
  if (owner === undefined || name === undefined || owner === "" || name === "")
    return;
  return { repositoryFullName: `${owner}/${name}`, number };
};

export function refsInArgs(args: unknown): ToolRefsFound {
  let threadId: string | undefined;
  let pull: ToolPullRef | undefined;

  const visit = (value: unknown, depth: number) => {
    if (depth > MAX_DEPTH) return;
    if (threadId !== undefined && pull !== undefined) return;
    if (typeof value === "string") {
      const target = parsePullHref(value.trim());
      if (pull === undefined && target !== undefined) pull = target;
      return;
    }
    if (Array.isArray(value)) {
      for (const item of value) visit(item, depth + 1);
      return;
    }
    if (!isRecord(value)) return;
    for (const [key, entry] of Object.entries(value)) {
      if (threadId === undefined && THREAD_KEYS.has(key)) {
        const id = text(entry);
        if (id !== undefined) threadId = id;
      }
    }
    if (pull === undefined) pull = pullFromRecord(value);
    for (const entry of Object.values(value)) visit(entry, depth + 1);
  };

  visit(args, 0);
  return {
    ...(threadId === undefined ? {} : { threadId }),
    ...(pull === undefined ? {} : { pull }),
  };
}
