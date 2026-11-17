import { useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import type { OrgId } from "@/data/api/schemas/ids";
import { organizationsAtom } from "@/data/atoms/session";

/** The organization the settings pages act on: the first one the viewer belongs to. */
export function useActiveOrgId(): OrgId | undefined {
  const organizations = useAtomValue(organizationsAtom);
  return AsyncResult.isSuccess(organizations)
    ? organizations.value[0]?.id
    : undefined;
}
