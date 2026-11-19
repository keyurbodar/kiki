import { useAtomValue } from "@effect/atom-react";
import { AsyncResult, Atom } from "effect/reactivity";
import { ApiClient } from "@/data/client/ApiClient";
import { BranchTrigger } from "./composer-footer";
import type { FooterBranch } from "./machine";

export const gitStatusAtom = Atom.family((key: string) => {
  const [orgId = "", jamId = ""] = key.split("\n");
  return ApiClient.query("git", "status", {
    params: { orgId, jamId },
    reactivityKeys: [`git:${jamId}`],
  });
});

/** `git/status` is undecoded; the footer only needs the branch it is on. */
const footerBranch = (status: unknown): FooterBranch | null => {
  if (typeof status !== "object" || status === null) return null;
  const row = status as { repo?: unknown; branch?: unknown };
  if (typeof row.branch !== "string" || row.branch === "") return null;
  const repoFullName =
    typeof row.repo === "string" && row.repo !== "" ? row.repo : null;
  return { repo: repoFullName ?? ".", repoFullName, branch: row.branch };
};

export type ThreadBranchChipProps = {
  orgId: string;
  jamId: string;
  onCopied?: (branch: string) => void;
};

/** The thread's branch, clicked to copy it. Renders nothing until git answers. */
export function ThreadBranchChip({
  orgId,
  jamId,
  onCopied,
}: ThreadBranchChipProps) {
  const status = AsyncResult.getOrElse(
    useAtomValue(gitStatusAtom(`${orgId}\n${jamId}`)),
    () => null,
  );
  const branch = footerBranch(status);
  if (branch === null) return null;
  return <BranchTrigger repos={[branch]} onCopied={onCopied} />;
}
