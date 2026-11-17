import { type Duration, Effect, Layer, Ref } from "effect";
import {
  AuthError,
  AuthService,
  type AuthStrategy,
  type FirstFactor,
  type RedirectStrategy,
  type SignInResource,
  type SignUpResource,
} from "./AuthService.ts";
import {
  authErrorMessages,
  type SampleAccount,
  sampleAccounts,
  sampleEmailCode,
  sampleExpiredCode,
  sampleFailingNotMeToken,
  sampleSsoDomain,
  sampleTicket,
} from "./fixtures.ts";

type Stage =
  | "first_factor"
  | "second_factor"
  | "reset_code"
  | "new_password"
  | "complete";

interface SignInAttempt {
  readonly account: SampleAccount;
  readonly stage: Stage;
}

interface SignUpAttempt {
  readonly email: string;
  readonly password: string;
  readonly verified: boolean;
}

interface State {
  readonly accounts: ReadonlyArray<SampleAccount>;
  readonly signIn: SignInAttempt | null;
  readonly signUp: SignUpAttempt | null;
  readonly session: string | null;
  readonly pendingRedirect: RedirectStrategy | null;
  readonly lastStrategy: AuthStrategy | null;
}

const fail = (code: AuthError["code"]) =>
  Effect.fail(new AuthError({ code, message: authErrorMessages[code] }));

const firstFactors = (account: SampleAccount): ReadonlyArray<FirstFactor> => [
  ...(account.password === null ? [] : [{ strategy: "password" } as const]),
  { strategy: "email_code", emailAddressId: account.emailAddressId },
  ...(account.passkey ? [{ strategy: "passkey" } as const] : []),
];

const signInResource = (
  attempt: SignInAttempt | null,
  session: string | null = null,
): SignInResource => ({
  status:
    attempt === null
      ? "needs_identifier"
      : attempt.stage === "second_factor"
        ? "needs_second_factor"
        : attempt.stage === "new_password"
          ? "needs_new_password"
          : attempt.stage === "complete"
            ? "complete"
            : "needs_first_factor",
  identifier: attempt?.account.email ?? null,
  supportedFirstFactors: attempt === null ? [] : firstFactors(attempt.account),
  supportedSecondFactors:
    attempt?.account.totp == null
      ? []
      : [{ strategy: "totp" }, { strategy: "backup_code" }],
  createdSessionId: session,
});

const ssoResource = (email: string): SignInResource => ({
  status: "needs_first_factor",
  identifier: email,
  supportedFirstFactors: [{ strategy: "enterprise_sso" }],
  supportedSecondFactors: [],
  createdSessionId: null,
});

const isSsoEmail = (email: string) =>
  email.toLowerCase().endsWith(`@${sampleSsoDomain}`);

const normalize = (email: string) => email.trim().toLowerCase();

export interface AuthServiceMockOptions {
  readonly latency?: Duration.Input;
  readonly accounts?: ReadonlyArray<SampleAccount>;
}

export const makeAuthServiceMock = (options: AuthServiceMockOptions = {}) =>
  Layer.effect(
    AuthService,
    Effect.gen(function* () {
      const state = yield* Ref.make<State>({
        accounts: options.accounts ?? sampleAccounts,
        signIn: null,
        signUp: null,
        session: null,
        pendingRedirect: null,
        lastStrategy: null,
      });
      const latency = options.latency ?? "350 millis";
      const delay = <A, E>(effect: Effect.Effect<A, E>) =>
        Effect.andThen(Effect.sleep(latency), effect);

      const findAccount = (email: string) =>
        Ref.get(state).pipe(
          Effect.map((s) =>
            s.accounts.find((account) => account.email === normalize(email)),
          ),
        );

      const currentSignIn = Ref.get(state).pipe(
        Effect.flatMap((s) =>
          s.signIn === null
            ? fail("verification_failed")
            : Effect.succeed(s.signIn),
        ),
      );

      const advance = (stage: Stage, strategy?: AuthStrategy) =>
        Ref.modify(state, (s) => {
          if (s.signIn === null) return [signInResource(null), s];
          const signIn = { ...s.signIn, stage };
          const session =
            stage === "complete"
              ? `sess_sample_${signIn.account.emailAddressId}`
              : null;
          return [
            signInResource(signIn, session),
            {
              ...s,
              signIn,
              lastStrategy: strategy ?? s.lastStrategy,
            },
          ];
        });

      const afterFirstFactor = (strategy: AuthStrategy) =>
        currentSignIn.pipe(
          Effect.flatMap((attempt) =>
            advance(
              attempt.account.totp === null ? "complete" : "second_factor",
              strategy,
            ),
          ),
        );

      const checkCode = (code: string, expected: string) =>
        code === sampleExpiredCode
          ? fail("verification_expired")
          : code === expected
            ? Effect.void
            : fail("form_code_incorrect");

      const startRedirect = (strategy: RedirectStrategy) =>
        Ref.update(state, (s) => ({ ...s, pendingRedirect: strategy }));

      return AuthService.of({
        signIn: {
          create: (params) =>
            delay(
              Effect.gen(function* () {
                if ("ticket" in params) {
                  if (params.ticket !== sampleTicket)
                    return yield* fail("verification_failed");
                  const [account] = (yield* Ref.get(state)).accounts;
                  if (account === undefined)
                    return yield* fail("verification_failed");
                  yield* Ref.update(state, (s) => ({
                    ...s,
                    signIn: { account, stage: "first_factor" as const },
                  }));
                  return yield* advance("complete");
                }
                if (isSsoEmail(params.identifier))
                  return ssoResource(normalize(params.identifier));
                const account = yield* findAccount(params.identifier);
                if (account === undefined)
                  return yield* fail("form_identifier_not_found");
                const stage: Stage =
                  "strategy" in params ? "reset_code" : "first_factor";
                const signIn: SignInAttempt = { account, stage };
                yield* Ref.update(state, (s) => ({ ...s, signIn }));
                return signInResource(signIn);
              }),
            ),
          prepareFirstFactor: () =>
            delay(
              currentSignIn.pipe(
                Effect.map((attempt) => signInResource(attempt)),
              ),
            ),
          attemptFirstFactor: (params) =>
            delay(
              Effect.gen(function* () {
                const attempt = yield* currentSignIn;
                if (params.strategy === "password") {
                  if (params.password !== attempt.account.password)
                    return yield* fail("form_password_incorrect");
                  return yield* afterFirstFactor("password");
                }
                yield* checkCode(params.code, sampleEmailCode);
                if (params.strategy === "reset_password_email_code")
                  return yield* advance("new_password");
                return yield* afterFirstFactor("email_code");
              }),
            ),
          attemptSecondFactor: (params) =>
            delay(
              Effect.gen(function* () {
                const attempt = yield* currentSignIn;
                const totp = attempt.account.totp;
                if (totp === null) return yield* fail("verification_failed");
                const valid =
                  params.strategy === "totp"
                    ? params.code === totp.code
                    : totp.backupCodes.includes(params.code);
                if (!valid) return yield* fail("form_code_incorrect");
                return yield* advance("complete");
              }),
            ),
          resetPassword: (params) =>
            delay(
              params.password.length < 8
                ? fail("form_password_length_too_short")
                : afterFirstFactor("password"),
            ),
          authenticateWithPasskey: () =>
            delay(
              Effect.gen(function* () {
                const s = yield* Ref.get(state);
                const account = s.accounts.find((a) => a.passkey);
                if (account === undefined)
                  return yield* fail("passkey_cancelled");
                yield* Ref.set(state, {
                  ...s,
                  signIn: { account, stage: "first_factor" as const },
                });
                return yield* advance("complete", "passkey");
              }),
            ),
          authenticateWithRedirect: (params) => startRedirect(params.strategy),
        },
        signUp: {
          create: (params) =>
            delay(
              Effect.gen(function* () {
                const email = normalize(params.emailAddress);
                if (isSsoEmail(email)) {
                  return {
                    status: "missing_requirements",
                    emailAddress: email,
                    missingFields: ["enterprise_sso"],
                    createdSessionId: null,
                  } satisfies SignUpResource;
                }
                if ((yield* findAccount(email)) !== undefined)
                  return yield* fail("form_identifier_exists");
                if (params.password.length < 8)
                  return yield* fail("form_password_length_too_short");
                yield* Ref.update(state, (s) => ({
                  ...s,
                  signUp: { email, password: params.password, verified: false },
                }));
                return {
                  status: "missing_requirements",
                  emailAddress: email,
                  missingFields: [],
                  createdSessionId: null,
                } satisfies SignUpResource;
              }),
            ),
          prepareEmailAddressVerification: () =>
            delay(
              Ref.get(state).pipe(
                Effect.flatMap((s) =>
                  s.signUp === null
                    ? fail("verification_failed")
                    : Effect.succeed<SignUpResource>({
                        status: "missing_requirements",
                        emailAddress: s.signUp.email,
                        missingFields: [],
                        createdSessionId: null,
                      }),
                ),
              ),
            ),
          attemptEmailAddressVerification: (params) =>
            delay(
              Effect.gen(function* () {
                const s = yield* Ref.get(state);
                if (s.signUp === null)
                  return yield* fail("verification_failed");
                yield* checkCode(params.code, sampleEmailCode);
                const signUp = s.signUp;
                const account: SampleAccount = {
                  email: signUp.email,
                  emailAddressId: `idn_sample_${s.accounts.length + 1}`,
                  password: signUp.password,
                  passkey: false,
                  totp: null,
                };
                yield* Ref.set(state, {
                  ...s,
                  accounts: [...s.accounts, account],
                  signUp: { ...signUp, verified: true },
                  lastStrategy: "email_code",
                });
                return {
                  status: "complete",
                  emailAddress: signUp.email,
                  missingFields: [],
                  createdSessionId: `sess_sample_${account.emailAddressId}`,
                } satisfies SignUpResource;
              }),
            ),
          authenticateWithRedirect: (params) => startRedirect(params.strategy),
        },
        setActive: ({ session }) =>
          Ref.update(state, (s) => ({ ...s, session })),
        isSignedIn: Ref.get(state).pipe(Effect.map((s) => s.session !== null)),
        signOut: Ref.update(state, (s) => ({
          ...s,
          session: null,
          signIn: null,
        })),
        lastAuthenticationStrategy: Ref.get(state).pipe(
          Effect.map((s) => s.lastStrategy),
        ),
        handleRedirectCallback: delay(
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            if (s.pendingRedirect === null)
              return yield* fail("no_redirect_in_progress");
            yield* Ref.set(state, {
              ...s,
              pendingRedirect: null,
              session: "sess_sample_redirect",
              lastStrategy:
                s.pendingRedirect === "enterprise_sso"
                  ? "email_code"
                  : s.pendingRedirect,
            });
          }),
        ),
        handleEmailLinkVerification: delay(fail("verification_failed")),
        reportUnrecognizedMfa: ({ token }) =>
          delay(
            token === sampleFailingNotMeToken
              ? fail("report_failed")
              : Effect.void,
          ),
        mfaStatus: delay(
          Effect.succeed({ mfaEnabled: false, enterpriseSso: false }),
        ),
        verifySecondFactor: delay(Effect.succeed(false)),
      });
    }),
  );

export const AuthServiceMock = makeAuthServiceMock();
