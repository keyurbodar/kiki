import { Effect } from "effect";
import { AuthService, authRuntime } from "@/data/auth";

export const ssoCallbackAtom = authRuntime.fn(() =>
  Effect.gen(function* () {
    const auth = yield* AuthService;
    yield* auth.handleRedirectCallback;
  }),
);
