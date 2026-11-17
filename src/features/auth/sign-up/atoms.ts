import { authRuntime } from "@/data/auth";
import { runSignUpAction, type SignUpAction } from "./sign-up-flow";

export const signUpFlowAtom = authRuntime.fn(
  (action: SignUpAction) => runSignUpAction(action),
  { concurrent: true },
);
