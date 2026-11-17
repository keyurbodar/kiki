import { useAtomValue } from "@effect/atom-react";
import { Option } from "effect";
import { AsyncResult } from "effect/reactivity";
import { currentUserAtom } from "@/data/atoms/session";

export function useExploreSession() {
  const user = Option.getOrUndefined(
    AsyncResult.value(useAtomValue(currentUserAtom)),
  );
  return {
    signedIn: user !== undefined,
    superadmin: user?.superadmin === true,
  };
}
