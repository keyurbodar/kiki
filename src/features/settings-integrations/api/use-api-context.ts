import { useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import { currentUserAtom, organizationsAtom } from "@/data/atoms/session";

/** Capy's useOrgAdmin: admins and owners may manage admin service users. */
export function useOrgAdmin() {
  const organizations = useAtomValue(organizationsAtom);
  const accessLevel = AsyncResult.isSuccess(organizations)
    ? organizations.value[0]?.accessLevel
    : undefined;
  const isAdmin = accessLevel === "admin" || accessLevel === "owner";
  return {
    isAdmin,
    adminReason: isAdmin ? undefined : "Only organization admins can change this",
  };
}

export function useCurrentUserId(): string | undefined {
  const user = useAtomValue(currentUserAtom);
  return AsyncResult.isSuccess(user) ? user.value.id : undefined;
}
