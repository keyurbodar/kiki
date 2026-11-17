import { Effect } from "effect";
import { AuthService, type AuthStrategy, authRuntime } from "@/data/auth";
import type { LastUsed } from "./oauth-buttons";

const lastUsedByStrategy: Record<AuthStrategy, LastUsed> = {
  oauth_google: "google",
  oauth_github: "github",
  passkey: "passkey",
  password: "email",
  email_code: "email",
};

export const lastUsedAtom = authRuntime.atom(
  Effect.gen(function* () {
    const auth = yield* AuthService;
    const strategy = yield* auth.lastAuthenticationStrategy;
    return strategy === null ? undefined : lastUsedByStrategy[strategy];
  }),
);
