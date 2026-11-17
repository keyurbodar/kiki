import { useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import { currentUserAtom, organizationsAtom } from "@/data/atoms/session";

/** The value of a settled query, or undefined while it loads or after it fails. */
export const resultValue = <A, E>(result: AsyncResult.AsyncResult<A, E>) =>
  AsyncResult.isSuccess(result) ? result.value : undefined;

/** The active organization and signed-in user the drive screens read with. */
export function useDriveSession() {
  const organizations = useAtomValue(organizationsAtom);
  const user = useAtomValue(currentUserAtom);
  const org = resultValue(organizations)?.[0];
  return {
    orgId: org?.id as string | undefined,
    orgName: org?.name,
    userId: resultValue(user)?.id as string | undefined,
    failed: AsyncResult.isFailure(organizations),
  };
}
