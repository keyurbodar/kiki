import { useAtomValue } from "@effect/atom-react";
import { Option } from "effect";
import { AsyncResult } from "effect/reactivity";
import { currentUserAtom, organizationsAtom } from "@/data/atoms/session";

/** The active org, the signed-in user and whether they administer the org. */
export function useDriveSession() {
  const organizations = Option.getOrUndefined(
    AsyncResult.value(useAtomValue(organizationsAtom)),
  );
  const user = Option.getOrUndefined(
    AsyncResult.value(useAtomValue(currentUserAtom)),
  );
  const organization = organizations?.[0];
  return {
    orgId: organization?.id as string | undefined,
    organizationName: organization?.name,
    userId: user?.id as string | undefined,
    isAdmin:
      organization?.accessLevel === "admin" ||
      organization?.accessLevel === "owner",
  };
}
