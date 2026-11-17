import { Effect } from "effect";
import {
  AuthService,
  type FirstFactor,
  type SignInResource,
} from "@/data/auth";
import { authErrorMessages } from "@/data/auth/fixtures";
import type { OAuthProvider } from "../shared/oauth-buttons";
import { ssoCallbackUrl } from "../shared/redirect";

export const signInSteps = [
  "start",
  "password",
  "email-code",
  "totp",
  "backup-code",
  "forgot-password",
  "reset-code",
  "reset-password",
] as const;

export type SignInStep = (typeof signInSteps)[number];

export const parseSignInStep = (value: string | undefined): SignInStep =>
  signInSteps.find((step) => step === value) ?? "start";

export type SignInAction =
  | {
      readonly kind: "identify";
      readonly email: string;
      readonly redirectTo: string;
    }
  | { readonly kind: "send-email-code"; readonly email: string }
  | { readonly kind: "password"; readonly password: string }
  | { readonly kind: "email-code"; readonly code: string }
  | { readonly kind: "totp"; readonly code: string }
  | { readonly kind: "backup-code"; readonly code: string }
  | { readonly kind: "send-reset-code"; readonly email: string }
  | { readonly kind: "reset-code"; readonly code: string }
  | { readonly kind: "new-password"; readonly password: string }
  | { readonly kind: "ticket"; readonly ticket: string }
  | { readonly kind: "passkey" }
  | { readonly kind: "sso"; readonly redirectTo: string }
  | {
      readonly kind: "oauth";
      readonly provider: OAuthProvider;
      readonly redirectTo: string;
    };

export type FlowResult<Step extends string> =
  | { readonly kind: "step"; readonly step: Step }
  | { readonly kind: "complete" }
  | { readonly kind: "error"; readonly message: string }
  | { readonly kind: "redirect"; readonly href: string };

const step = (s: SignInStep): FlowResult<SignInStep> => ({
  kind: "step",
  step: s,
});
const genericError: FlowResult<SignInStep> = {
  kind: "error",
  message: authErrorMessages.verification_failed,
};

const emailCodeId = (factors: ReadonlyArray<FirstFactor>) =>
  factors.flatMap((f) =>
    f.strategy === "email_code" ? [f.emailAddressId] : [],
  )[0];
const hasPassword = (factors: ReadonlyArray<FirstFactor>) =>
  factors.some((f) => f.strategy === "password");
const hasEnterpriseSso = (factors: ReadonlyArray<FirstFactor>) =>
  factors.some((f) => f.strategy === "enterprise_sso");

export const runSignInAction = Effect.fnUntraced(function* (
  action: SignInAction,
) {
  const auth = yield* AuthService;
  const { signIn } = auth;

  const finish = Effect.fnUntraced(function* (resource: SignInResource) {
    if (resource.status === "needs_second_factor") {
      const strategies = resource.supportedSecondFactors.map((f) => f.strategy);
      return strategies.includes("totp")
        ? step("totp")
        : strategies.includes("backup_code")
          ? step("backup-code")
          : genericError;
    }
    if (resource.status !== "complete" || resource.createdSessionId === null)
      return genericError;
    yield* auth.setActive({ session: resource.createdSessionId });
    return { kind: "complete" } as const;
  });

  const sendEmailCode = Effect.fnUntraced(function* (
    factors: ReadonlyArray<FirstFactor>,
  ) {
    const emailAddressId = emailCodeId(factors);
    if (emailAddressId === undefined) return genericError;
    yield* signIn.prepareFirstFactor({
      strategy: "email_code",
      emailAddressId,
    });
    return step("email-code");
  });

  const redirect = Effect.fnUntraced(function* (
    strategy: "enterprise_sso" | "oauth_google" | "oauth_github",
    redirectTo: string,
  ) {
    const href = ssoCallbackUrl("/sign-in/sso-callback", redirectTo);
    yield* signIn.authenticateWithRedirect({
      strategy,
      redirectUrl: href,
      redirectUrlComplete: redirectTo,
    });
    return { kind: "redirect", href } as const;
  });

  const run = Effect.gen(function* () {
    switch (action.kind) {
      case "identify": {
        const resource = yield* signIn.create({
          identifier: action.email.trim(),
        });
        if (hasEnterpriseSso(resource.supportedFirstFactors))
          return yield* redirect("enterprise_sso", action.redirectTo);
        if (resource.status !== "needs_first_factor")
          return yield* finish(resource);
        return hasPassword(resource.supportedFirstFactors)
          ? step("password")
          : yield* sendEmailCode(resource.supportedFirstFactors);
      }
      case "send-email-code": {
        const resource = yield* signIn.create({
          identifier: action.email.trim(),
        });
        return yield* sendEmailCode(resource.supportedFirstFactors);
      }
      case "password":
        return yield* finish(
          yield* signIn.attemptFirstFactor({
            strategy: "password",
            password: action.password,
          }),
        );
      case "email-code":
        return yield* finish(
          yield* signIn.attemptFirstFactor({
            strategy: "email_code",
            code: action.code,
          }),
        );
      case "totp":
        return yield* finish(
          yield* signIn.attemptSecondFactor({
            strategy: "totp",
            code: action.code,
          }),
        );
      case "backup-code":
        return yield* finish(
          yield* signIn.attemptSecondFactor({
            strategy: "backup_code",
            code: action.code.trim(),
          }),
        );
      case "send-reset-code":
        yield* signIn.create({
          strategy: "reset_password_email_code",
          identifier: action.email.trim(),
        });
        return step("reset-code");
      case "reset-code": {
        const resource = yield* signIn.attemptFirstFactor({
          strategy: "reset_password_email_code",
          code: action.code,
        });
        return resource.status === "needs_new_password"
          ? step("reset-password")
          : yield* finish(resource);
      }
      case "new-password":
        return yield* finish(
          yield* signIn.resetPassword({
            password: action.password,
            signOutOfOtherSessions: true,
          }),
        );
      case "ticket":
        return yield* finish(
          yield* signIn.create({ strategy: "ticket", ticket: action.ticket }),
        );
      case "passkey":
        return yield* finish(
          yield* signIn.authenticateWithPasskey({ flow: "discoverable" }),
        );
      case "sso":
        return yield* redirect("enterprise_sso", action.redirectTo);
      case "oauth":
        return yield* redirect(
          action.provider === "google" ? "oauth_google" : "oauth_github",
          action.redirectTo,
        );
    }
  });

  return yield* run.pipe(
    Effect.catchTag("AuthError", (error) =>
      Effect.succeed<FlowResult<SignInStep>>({
        kind: "error",
        message: error.message,
      }),
    ),
  );
});
