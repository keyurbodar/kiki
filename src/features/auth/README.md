# features/auth

Owner: D7 (D7a-auth). Scope: sign-in, sign-up, verify, SSO callbacks, not-me and the two-step wall, all against the mocked `AuthService` in `src/data/auth` (a Clerk stand-in; Clerk itself is deferred).

| Unit             | What it renders                                                                                                                                              |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `auth-layout/`   | Capy's `AuthLayout`: back button, centred `max-w-84` column, fabric panel on `lg` and up. Used by `routes/_auth/route.tsx` and `routes/security/not-me.tsx`. |
| `shared/`        | `AuthStep`, `AuthHeader`, `AuthFooter`, `AuthNote`, `FieldError`, `OAuthButtons`, `CodeField`, the Capy logo and redirect helpers.                           |
| `sign-in/`       | `SignInPage` and `runSignInAction` (Capy's `sign-in-flow` as an Effect over `AuthService`).                                                                  |
| `sign-up/`       | `SignUpPage` and `runSignUpAction`.                                                                                                                          |
| `verify-email/`  | `VerifyEmailPage` for `/sign-in/verify` and `/sign-up/verify`.                                                                                               |
| `sso-callback/`  | `SsoCallbackPage` for both SSO callbacks.                                                                                                                    |
| `not-me/`        | `NotMePage` for `/security/not-me`.                                                                                                                          |
| `two-step-wall/` | `TwoStepWall`, for the signed-in shell to mount when an organization requires two-step verification.                                                         |
| `welcome/`       | Reserved for the welcome unit (another WP).                                                                                                                  |

Sample accounts live in `src/data/auth/fixtures.ts` (`alex@example.com` / `sample-password`, code `424242`; `000000` is an expired code; `jordan@example.com` needs TOTP `135790`; any `@sso.example.com` address goes through SSO).

Nothing here imports from `src/routes/`. See [CONTRIBUTING.md](../../../CONTRIBUTING.md).
