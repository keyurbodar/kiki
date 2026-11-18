import { useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import type { OrgId } from "@/data/api/schemas/ids";
import { currentUserAtom, useActiveOrgId } from "@/data/atoms/session";

/** The org the viewer is acting on. */
export function useOrgId(): OrgId | undefined {
  return useActiveOrgId();
}

export function useCurrentUserId(): string | undefined {
  const user = useAtomValue(currentUserAtom);
  return AsyncResult.isSuccess(user) ? user.value.id : undefined;
}
