import { useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import type { ExploreIndex } from "@/data/api/schemas/explore";
import { orgListingsAtom } from "@/data/atoms/explore";
import { currentUserAtom, organizationsAtom } from "@/data/atoms/session";
import {
  recentlyAddedAtom,
  unversionedKey,
} from "../listing-add-action/recently-added";

const successValue = <A, E>(result: AsyncResult.AsyncResult<A, E>) =>
  AsyncResult.isSuccess(result) ? result.value : undefined;

export function useSignedIn() {
  return AsyncResult.isSuccess(useAtomValue(currentUserAtom));
}

export function useCurrentUserId() {
  return successValue(useAtomValue(currentUserAtom))?.id;
}

export function useOrgId() {
  return successValue(useAtomValue(organizationsAtom))?.[0]?.id;
}

export function useOrgName() {
  return successValue(useAtomValue(organizationsAtom))?.[0]?.name;
}

export function useRecentlyAdded(orgId: string | undefined) {
  const recent = useAtomValue(recentlyAddedAtom);
  return orgId === undefined ? [] : (recent[orgId] ?? []);
}

export const mergeRecentlyAdded = (
  index: ExploreIndex | undefined,
  recent: ReadonlyArray<string>,
) => {
  if (index === undefined) return undefined;
  const recentKeys = recent.map(unversionedKey);
  return {
    added: [...new Set([...index.added, ...recentKeys])],
    updates: (index.updates ?? []).filter((key) => !recentKeys.includes(key)),
  };
};

export function useExploreIndex() {
  const orgId = useOrgId();
  const signedIn = useSignedIn();
  const recent = useRecentlyAdded(orgId);
  const result = useAtomValue(orgListingsAtom(orgId ?? ""));
  const index =
    signedIn && orgId !== undefined ? successValue(result) : undefined;
  return mergeRecentlyAdded(index, recent);
}

export function useAddedSet() {
  return new Set(useExploreIndex()?.added ?? []);
}

export function useUpdatesSet() {
  return new Set(useExploreIndex()?.updates ?? []);
}
