import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AuthService, emailLinkFailure } from "./AuthService.ts";
import {
  sampleEmailCode,
  sampleExpiredCode,
  sampleFailingNotMeToken,
  sampleNotMeToken,
  sampleTicket,
} from "./fixtures.ts";
import { makeAuthServiceMock } from "./mock.ts";

const provide = Effect.provide(makeAuthServiceMock({ latency: 0 }));

describe("AuthService mock", () => {
  it.effect("signs a password account in and records the strategy", () =>
    Effect.gen(function* () {
      const auth = yield* AuthService;
      const created = yield* auth.signIn.create({
        identifier: " Alex@Example.com ",
      });
      assert.strictEqual(created.status, "needs_first_factor");
      const done = yield* auth.signIn.attemptFirstFactor({
        strategy: "password",
        password: "sample-password",
      });
      assert.strictEqual(done.status, "complete");
      assert.isNotNull(done.createdSessionId);
      assert.strictEqual(yield* auth.lastAuthenticationStrategy, "password");
    }).pipe(provide),
  );

  it.effect("rejects unknown accounts, wrong and expired codes", () =>
    Effect.gen(function* () {
      const auth = yield* AuthService;
      const unknown = yield* Effect.flip(
        auth.signIn.create({ identifier: "nobody@example.com" }),
      );
      assert.strictEqual(unknown.code, "form_identifier_not_found");
      yield* auth.signIn.create({ identifier: "sam@example.com" });
      const wrong = yield* Effect.flip(
        auth.signIn.attemptFirstFactor({
          strategy: "email_code",
          code: "111111",
        }),
      );
      assert.strictEqual(wrong.code, "form_code_incorrect");
      const expired = yield* Effect.flip(
        auth.signIn.attemptFirstFactor({
          strategy: "email_code",
          code: sampleExpiredCode,
        }),
      );
      assert.strictEqual(expired.code, "verification_expired");
    }).pipe(provide),
  );

  it.effect("asks TOTP accounts for a second factor", () =>
    Effect.gen(function* () {
      const auth = yield* AuthService;
      yield* auth.signIn.create({ identifier: "jordan@example.com" });
      const first = yield* auth.signIn.attemptFirstFactor({
        strategy: "email_code",
        code: sampleEmailCode,
      });
      assert.strictEqual(first.status, "needs_second_factor");
      const done = yield* auth.signIn.attemptSecondFactor({
        strategy: "backup_code",
        code: "sample-backup-01",
      });
      assert.strictEqual(done.status, "complete");
    }).pipe(provide),
  );

  it.effect("routes SSO domains to enterprise SSO", () =>
    Effect.gen(function* () {
      const auth = yield* AuthService;
      const created = yield* auth.signIn.create({
        identifier: "kim@sso.example.com",
      });
      assert.deepStrictEqual(created.supportedFirstFactors, [
        { strategy: "enterprise_sso" },
      ]);
    }).pipe(provide),
  );

  it.effect("finishes a redirect only when one is pending", () =>
    Effect.gen(function* () {
      const auth = yield* AuthService;
      const none = yield* Effect.flip(auth.handleRedirectCallback);
      assert.strictEqual(none.code, "no_redirect_in_progress");
      yield* auth.signIn.authenticateWithRedirect({
        strategy: "oauth_github",
        redirectUrl: "/sign-in/sso-callback",
        redirectUrlComplete: "/new",
      });
      yield* auth.handleRedirectCallback;
      assert.isTrue(yield* auth.isSignedIn);
      assert.strictEqual(
        yield* auth.lastAuthenticationStrategy,
        "oauth_github",
      );
    }).pipe(provide),
  );

  it.effect("signs up, verifies the email and rejects taken addresses", () =>
    Effect.gen(function* () {
      const auth = yield* AuthService;
      const taken = yield* Effect.flip(
        auth.signUp.create({
          emailAddress: "alex@example.com",
          password: "long-enough",
        }),
      );
      assert.strictEqual(taken.code, "form_identifier_exists");
      const short = yield* Effect.flip(
        auth.signUp.create({
          emailAddress: "new@example.com",
          password: "short",
        }),
      );
      assert.strictEqual(short.code, "form_password_length_too_short");
      yield* auth.signUp.create({
        emailAddress: "new@example.com",
        password: "long-enough",
      });
      const done = yield* auth.signUp.attemptEmailAddressVerification({
        code: sampleEmailCode,
      });
      assert.strictEqual(done.status, "complete");
      const again = yield* auth.signIn.create({
        identifier: "new@example.com",
      });
      assert.strictEqual(again.status, "needs_first_factor");
    }).pipe(provide),
  );

  it.effect(
    "signs in with a ticket, reports not-me tokens, fails email links",
    () =>
      Effect.gen(function* () {
        const auth = yield* AuthService;
        const ticket = yield* auth.signIn.create({
          strategy: "ticket",
          ticket: sampleTicket,
        });
        assert.strictEqual(ticket.status, "complete");
        yield* auth.reportUnrecognizedMfa({ token: sampleNotMeToken });
        const failed = yield* Effect.flip(
          auth.reportUnrecognizedMfa({ token: sampleFailingNotMeToken }),
        );
        assert.strictEqual(failed.code, "report_failed");
        const link = yield* Effect.flip(auth.handleEmailLinkVerification);
        assert.strictEqual(emailLinkFailure(link), "failed");
      }).pipe(provide),
  );
});
