import { useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import type { OrgId } from "@/data/api/schemas/ids";
import { currentUserAtom, organizationsAtom } from "@/data/atoms/session";

/** The signed-in org. kiki has one org per session until the shell picks one. */
export function useOrgId(): OrgId | undefined {
  const organizations = useAtomValue(organizationsAtom);
  return AsyncResult.isSuccess(organizations)
    ? organizations.value[0]?.id
    : undefined;
}

export function useCurrentUserId(): string | undefined {
  const user = useAtomValue(currentUserAtom);
  return AsyncResult.isSuccess(user) ? user.value.id : undefined;
}
