import { useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import type { OrgId } from "@/data/api/schemas/ids";
import { organizationsAtom } from "@/data/atoms/session";

/** The organizations read, so a page can tell pending from failed. */
export function useActiveOrgRead() {
  return useAtomValue(organizationsAtom);
}

/**
 * The organization the settings pages act on: the first one the viewer belongs
 * to. `undefined` means "no org to act on yet", which is true both while the
 * read is in flight and after it failed — a page that must tell those apart
 * reads `useActiveOrgRead` and gates on it.
 */
export function useActiveOrgId(): OrgId | undefined {
  const organizations = useActiveOrgRead();
  return AsyncResult.isSuccess(organizations)
    ? organizations.value[0]?.id
    : undefined;
}
