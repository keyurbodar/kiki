import { useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import { currentUserAtom } from "@/data/atoms/session";

export type AuthState = { isLoaded: boolean; isSignedIn: boolean };

export function useAuthState(): AuthState {
  const user = useAtomValue(currentUserAtom);
  if (AsyncResult.isInitial(user))
    return { isLoaded: false, isSignedIn: false };
  return { isLoaded: true, isSignedIn: AsyncResult.isSuccess(user) };
}
