import { useAtomRefresh, useAtomValue } from "@effect/atom-react";
import { Option } from "effect";
import { AsyncResult, type Atom } from "effect/reactivity";
import {
  currentUserAtom,
  organizationsAtom,
  useActiveOrgId,
} from "@/data/atoms/session";

/** Capy's useOrgAdmin: admins and owners may manage admin service users. */
export function useOrgAdmin() {
  const organizations = useAtomValue(organizationsAtom);
  const activeOrgId = useActiveOrgId();
  const accessLevel = AsyncResult.isSuccess(organizations)
    ? organizations.value.find((candidate) => candidate.id === activeOrgId)
        ?.accessLevel
    : undefined;
  const isAdmin = accessLevel === "admin" || accessLevel === "owner";
  return {
    isAdmin,
    adminReason: isAdmin
      ? undefined
      : "Only organization admins can change this",
  };
}

export function useCurrentUserId(): string | undefined {
  const user = useAtomValue(currentUserAtom);
  return AsyncResult.isSuccess(user) ? user.value.id : undefined;
}

/** One query's state the way Capy's api pages read it. */
export function useQueryState<A, E>(
  atom: Atom.Atom<AsyncResult.AsyncResult<ReadonlyArray<A>, E>>,
) {
  const result = useAtomValue(atom);
  const refresh = useAtomRefresh(atom);
  const value = AsyncResult.value(result);
  return {
    rows: Option.getOrElse(value, (): ReadonlyArray<A> => []),
    loading: AsyncResult.isInitial(result),
    failed:
      AsyncResult.isFailure(result) && Option.isNone(result.previousSuccess),
    loaded: Option.isSome(value),
    refresh,
  };
}

/** Capy shows "You" for the viewer and the raw id when no member matches. */
export const principalName = (userId: string, viewerId: string | undefined) =>
  userId === viewerId ? "You" : userId;
