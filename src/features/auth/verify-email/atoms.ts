import { Effect } from "effect";
import {
  AuthService,
  authRuntime,
  type EmailLinkFailure,
  emailLinkFailure,
} from "@/data/auth";

export type VerifyStatus = "verifying" | EmailLinkFailure;

export const emailLinkAtom = authRuntime.atom(
  Effect.gen(function* () {
    const auth = yield* AuthService;
    return yield* auth.handleEmailLinkVerification.pipe(
      Effect.as<VerifyStatus>("verifying"),
      Effect.catchTag("AuthError", (error) =>
        Effect.succeed<VerifyStatus>(emailLinkFailure(error)),
      ),
    );
  }),
);
