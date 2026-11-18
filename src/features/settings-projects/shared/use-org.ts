import { useAtomValue } from "@effect/atom-react";
import { organizationsAtom } from "@/data/atoms/session";

export { useActiveOrgId } from "@/data/atoms/session";

/** The organizations read, so a page can tell pending from failed. */
export function useActiveOrgRead() {
  return useAtomValue(organizationsAtom);
}
