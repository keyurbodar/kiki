import { Atom } from "effect/reactivity";
import type { OrgId } from "../api/schemas/ids.ts";
import { ApiClient } from "../client/ApiClient.ts";

export const repoBranchesKey = (orgId: OrgId, repoFullName: string) =>
  `${orgId}\u0000${repoFullName}`;

const branchesQuery = Atom.family((key: string) => {
  const [orgId = "", repo = ""] = key.split("\u0000");
  return ApiClient.query("repos", "branches", {
    params: { orgId },
    query: { repo },
    timeToLive: "1 minute",
  });
});

export const repoBranchesAtom = (orgId: OrgId, repoFullName: string) =>
  branchesQuery(repoBranchesKey(orgId, repoFullName));
