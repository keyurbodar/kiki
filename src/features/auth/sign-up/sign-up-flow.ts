import { Effect } from "effect";
import { AuthService, type SignUpResource } from "@/data/auth";
import { authErrorMessages } from "@/data/auth/fixtures";
import type { OAuthProvider } from "../shared/oauth-buttons";
import { ssoCallbackUrl } from "../shared/redirect";
import type { FlowResult } from "../sign-in/sign-in-flow";

export type SignUpStep = "start" | "verify-code";

export const parseSignUpStep = (value: string | undefined): SignUpStep =>
  value === "verify-code" ? "verify-code" : "start";

export type SignUpAction =
  | {
      readonly kind: "create";
      readonly email: string;
      readonly password: string;
      readonly redirectTo: string;
    }
  | { readonly kind: "resend" }
  | { readonly kind: "verify"; readonly code: string }
  | {
      readonly kind: "oauth";
      readonly provider: OAuthProvider;
      readonly redirectTo: string;
    };

const verifyCode: FlowResult<SignUpStep> = {
  kind: "step",
  step: "verify-code",
};

export const runSignUpAction = Effect.fnUntraced(function* (
  action: SignUpAction,
) {
  const auth = yield* AuthService;
  const { signUp } = auth;

  const finish = Effect.fnUntraced(function* (resource: SignUpResource) {
    if (resource.status !== "complete" || resource.createdSessionId === null)
      return {
        kind: "error",
        message: authErrorMessages.verification_failed,
      } satisfies FlowResult<SignUpStep>;
    yield* auth.setActive({ session: resource.createdSessionId });
    return { kind: "complete" } satisfies FlowResult<SignUpStep>;
  });

  const redirect = Effect.fnUntraced(function* (
    strategy: "enterprise_sso" | "oauth_google" | "oauth_github",
    redirectTo: string,
  ) {
    const href = ssoCallbackUrl("/sign-up/sso-callback", redirectTo);
    yield* signUp.authenticateWithRedirect({
      strategy,
      redirectUrl: href,
      redirectUrlComplete: redirectTo,
    });
    return { kind: "redirect", href } satisfies FlowResult<SignUpStep>;
  });

  const run = Effect.gen(function* () {
    switch (action.kind) {
      case "create": {
        const resource = yield* signUp.create({
          emailAddress: action.email.trim(),
          password: action.password,
        });
        if (resource.status === "complete") return yield* finish(resource);
        if (resource.missingFields.includes("enterprise_sso"))
          return yield* redirect("enterprise_sso", action.redirectTo);
        yield* signUp.prepareEmailAddressVerification({
          strategy: "email_code",
        });
        return verifyCode;
      }
      case "resend":
        yield* signUp.prepareEmailAddressVerification({
          strategy: "email_code",
        });
        return verifyCode;
      case "verify":
        return yield* finish(
          yield* signUp.attemptEmailAddressVerification({ code: action.code }),
        );
      case "oauth":
        return yield* redirect(
          action.provider === "google" ? "oauth_google" : "oauth_github",
          action.redirectTo,
        );
    }
  });

  return yield* run.pipe(
    Effect.catchTag("AuthError", (error) =>
      Effect.succeed<FlowResult<SignUpStep>>({
        kind: "error",
        message: error.message,
      }),
    ),
  );
});
