import { useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import type { OrgId } from "@/data/api/schemas/ids";
import { organizationsAtom, selectedOrgIdAtom } from "@/data/atoms/session";

/** The organizations read, so a page can tell pending from failed. */
export function useActiveOrgRead() {
  return useAtomValue(organizationsAtom);
}

/**
 * The organization the settings pages act on: the one the viewer switched to,
 * or the first they belong to when they never switched. `undefined` means "no
 * org to act on yet", which is true both while the read is in flight and after
 * it failed — a page that must tell those apart reads `useActiveOrgRead` and
 * gates on it.
 */
export function useActiveOrgId(): OrgId | undefined {
  const organizations = useActiveOrgRead();
  const selected = useAtomValue(selectedOrgIdAtom);
  if (!AsyncResult.isSuccess(organizations)) return undefined;
  const available = organizations.value;
  return (
    available.find((organization) => organization.id === selected) ??
    available[0]
  )?.id;
}
