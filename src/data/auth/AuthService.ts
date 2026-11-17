import { Context, type Effect, Schema } from "effect";

export const authErrorCodes = [
  "form_identifier_not_found",
  "form_identifier_exists",
  "form_password_incorrect",
  "form_password_length_too_short",
  "form_code_incorrect",
  "verification_expired",
  "verification_failed",
  "client_mismatch",
  "passkey_cancelled",
  "no_redirect_in_progress",
  "report_failed",
] as const;

export class AuthError extends Schema.TaggedError<AuthError>()("AuthError", {
  code: Schema.Literals(authErrorCodes),
  message: Schema.String,
}) {}

export type FirstFactor =
  | { readonly strategy: "password" }
  | { readonly strategy: "email_code"; readonly emailAddressId: string }
  | { readonly strategy: "enterprise_sso" }
  | { readonly strategy: "oauth_google" }
  | { readonly strategy: "oauth_github" }
  | { readonly strategy: "passkey" };

export type SecondFactor = { readonly strategy: "totp" | "backup_code" };

export type SignInStatus =
  | "needs_identifier"
  | "needs_first_factor"
  | "needs_second_factor"
  | "needs_new_password"
  | "complete";

export interface SignInResource {
  readonly status: SignInStatus;
  readonly identifier: string | null;
  readonly supportedFirstFactors: ReadonlyArray<FirstFactor>;
  readonly supportedSecondFactors: ReadonlyArray<SecondFactor>;
  readonly createdSessionId: string | null;
}

export type SignUpStatus = "missing_requirements" | "complete";

export interface SignUpResource {
  readonly status: SignUpStatus;
  readonly emailAddress: string | null;
  readonly missingFields: ReadonlyArray<"enterprise_sso">;
  readonly createdSessionId: string | null;
}

export type OAuthStrategy = "oauth_google" | "oauth_github";
export type RedirectStrategy = OAuthStrategy | "enterprise_sso";
export type AuthStrategy =
  | OAuthStrategy
  | "passkey"
  | "password"
  | "email_code";

export type EmailLinkFailure = "failed" | "expired" | "mismatch";

export interface RedirectParams {
  readonly strategy: RedirectStrategy;
  readonly redirectUrl: string;
  readonly redirectUrlComplete: string;
}

export interface SignInApi {
  readonly create: (
    params:
      | { readonly identifier: string }
      | { readonly strategy: "ticket"; readonly ticket: string }
      | {
          readonly strategy: "reset_password_email_code";
          readonly identifier: string;
        },
  ) => Effect.Effect<SignInResource, AuthError>;
  readonly prepareFirstFactor: (params: {
    readonly strategy: "email_code";
    readonly emailAddressId: string;
  }) => Effect.Effect<SignInResource, AuthError>;
  readonly attemptFirstFactor: (
    params:
      | { readonly strategy: "password"; readonly password: string }
      | {
          readonly strategy: "email_code" | "reset_password_email_code";
          readonly code: string;
        },
  ) => Effect.Effect<SignInResource, AuthError>;
  readonly attemptSecondFactor: (params: {
    readonly strategy: "totp" | "backup_code";
    readonly code: string;
  }) => Effect.Effect<SignInResource, AuthError>;
  readonly resetPassword: (params: {
    readonly password: string;
    readonly signOutOfOtherSessions: boolean;
  }) => Effect.Effect<SignInResource, AuthError>;
  readonly authenticateWithPasskey: (params: {
    readonly flow: "discoverable";
  }) => Effect.Effect<SignInResource, AuthError>;
  readonly authenticateWithRedirect: (
    params: RedirectParams,
  ) => Effect.Effect<void, AuthError>;
}

export interface SignUpApi {
  readonly create: (params: {
    readonly emailAddress: string;
    readonly password: string;
  }) => Effect.Effect<SignUpResource, AuthError>;
  readonly prepareEmailAddressVerification: (params: {
    readonly strategy: "email_code";
  }) => Effect.Effect<SignUpResource, AuthError>;
  readonly attemptEmailAddressVerification: (params: {
    readonly code: string;
  }) => Effect.Effect<SignUpResource, AuthError>;
  readonly authenticateWithRedirect: (
    params: RedirectParams,
  ) => Effect.Effect<void, AuthError>;
}

export interface MfaStatus {
  readonly mfaEnabled: boolean;
  readonly enterpriseSso: boolean;
}

export class AuthService extends Context.Service<
  AuthService,
  {
    readonly signIn: SignInApi;
    readonly signUp: SignUpApi;
    readonly setActive: (params: {
      readonly session: string;
    }) => Effect.Effect<void>;
    readonly isSignedIn: Effect.Effect<boolean>;
    readonly signOut: Effect.Effect<void>;
    readonly lastAuthenticationStrategy: Effect.Effect<AuthStrategy | null>;
    readonly handleRedirectCallback: Effect.Effect<void, AuthError>;
    readonly handleEmailLinkVerification: Effect.Effect<void, AuthError>;
    readonly reportUnrecognizedMfa: (params: {
      readonly token: string;
    }) => Effect.Effect<void, AuthError>;
    readonly mfaStatus: Effect.Effect<MfaStatus>;
    readonly verifySecondFactor: Effect.Effect<boolean>;
  }
>()("kiki/AuthService") {}

export const emailLinkFailure = (error: AuthError): EmailLinkFailure =>
  error.code === "verification_expired"
    ? "expired"
    : error.code === "client_mismatch"
      ? "mismatch"
      : "failed";
