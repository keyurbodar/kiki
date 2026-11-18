import { useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import type { OrgId } from "@/data/api/schemas/ids";
import { organizationsAtom } from "@/data/atoms/session";

/** The organizations read, so a page can tell pending from failed. */
export function useActiveOrgRead() {
  return useAtomValue(organizationsAtom);
}

export function useActiveOrgId(): OrgId | undefined {
  const organizations = useActiveOrgRead();
  return AsyncResult.isSuccess(organizations)
    ? organizations.value[0]?.id
    : undefined;
}
