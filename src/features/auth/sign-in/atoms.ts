import { authRuntime } from "@/data/auth";
import { runSignInAction, type SignInAction } from "./sign-in-flow";

export const signInFlowAtom = authRuntime.fn(
  (action: SignInAction) => runSignInAction(action),
  { concurrent: true },
);
