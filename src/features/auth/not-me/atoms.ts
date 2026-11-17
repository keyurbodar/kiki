import { Effect } from "effect";
import { AuthService, authRuntime } from "@/data/auth";

export const reportUnrecognizedMfaAtom = authRuntime.fn((token: string) =>
  Effect.gen(function* () {
    const auth = yield* AuthService;
    yield* auth.reportUnrecognizedMfa({ token });
  }),
);
