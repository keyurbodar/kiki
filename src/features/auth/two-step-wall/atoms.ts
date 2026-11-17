import { Effect } from "effect";
import { AuthService, authRuntime } from "@/data/auth";

export const mfaStatusAtom = authRuntime.atom(
  Effect.gen(function* () {
    const auth = yield* AuthService;
    return yield* auth.mfaStatus;
  }),
);

export const verifySecondFactorAtom = authRuntime.fn(() =>
  Effect.gen(function* () {
    const auth = yield* AuthService;
    return yield* auth.verifySecondFactor;
  }),
);

export const signOutAtom = authRuntime.fn(() =>
  Effect.gen(function* () {
    const auth = yield* AuthService;
    yield* auth.signOut;
  }),
);
