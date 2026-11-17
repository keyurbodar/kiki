import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { makeAuthServiceMock, sampleEmailCode } from "@/data/auth";
import { parseSignInStep, runSignInAction } from "./sign-in-flow";

const provide = Effect.provide(makeAuthServiceMock({ latency: 0 }));

describe("runSignInAction", () => {
  it("parses the continue search param", () => {
    assert.strictEqual(parseSignInStep("totp"), "totp");
    assert.strictEqual(parseSignInStep("nope"), "start");
    assert.strictEqual(parseSignInStep(undefined), "start");
  });

  it.effect("goes to the password step, then completes", () =>
    Effect.gen(function* () {
      const identify = yield* runSignInAction({
        kind: "identify",
        email: "alex@example.com",
        redirectTo: "/new",
      });
      assert.deepStrictEqual(identify, { kind: "step", step: "password" });
      const wrong = yield* runSignInAction({
        kind: "password",
        password: "nope",
      });
      assert.strictEqual(wrong.kind, "error");
      const done = yield* runSignInAction({
        kind: "password",
        password: "sample-password",
      });
      assert.deepStrictEqual(done, { kind: "complete" });
    }).pipe(provide),
  );

  it.effect("emails a code to passwordless accounts", () =>
    Effect.gen(function* () {
      const identify = yield* runSignInAction({
        kind: "identify",
        email: "sam@example.com",
        redirectTo: "/new",
      });
      assert.deepStrictEqual(identify, { kind: "step", step: "email-code" });
      const wrong = yield* runSignInAction({
        kind: "email-code",
        code: "999999",
      });
      assert.deepStrictEqual(wrong, {
        kind: "error",
        message: "Incorrect code",
      });
      const done = yield* runSignInAction({
        kind: "email-code",
        code: sampleEmailCode,
      });
      assert.deepStrictEqual(done, { kind: "complete" });
    }).pipe(provide),
  );

  it.effect("asks for TOTP after the first factor", () =>
    Effect.gen(function* () {
      yield* runSignInAction({
        kind: "identify",
        email: "jordan@example.com",
        redirectTo: "/new",
      });
      const first = yield* runSignInAction({
        kind: "password",
        password: "sample-password",
      });
      assert.deepStrictEqual(first, { kind: "step", step: "totp" });
      const done = yield* runSignInAction({ kind: "totp", code: "135790" });
      assert.deepStrictEqual(done, { kind: "complete" });
    }).pipe(provide),
  );

  it.effect("redirects SSO and OAuth through the sign-in callback", () =>
    Effect.gen(function* () {
      const sso = yield* runSignInAction({
        kind: "identify",
        email: "kim@sso.example.com",
        redirectTo: "/threads",
      });
      assert.deepStrictEqual(sso, {
        kind: "redirect",
        href: "/sign-in/sso-callback?redirect_url=%2Fthreads",
      });
      const oauth = yield* runSignInAction({
        kind: "oauth",
        provider: "google",
        redirectTo: "/new",
      });
      assert.strictEqual(oauth.kind, "redirect");
    }).pipe(provide),
  );

  it.effect("resets a password through the reset code", () =>
    Effect.gen(function* () {
      const sent = yield* runSignInAction({
        kind: "send-reset-code",
        email: "alex@example.com",
      });
      assert.deepStrictEqual(sent, { kind: "step", step: "reset-code" });
      const code = yield* runSignInAction({
        kind: "reset-code",
        code: sampleEmailCode,
      });
      assert.deepStrictEqual(code, { kind: "step", step: "reset-password" });
      const done = yield* runSignInAction({
        kind: "new-password",
        password: "another-password",
      });
      assert.deepStrictEqual(done, { kind: "complete" });
    }).pipe(provide),
  );

  it.effect("completes passkey sign-in", () =>
    Effect.gen(function* () {
      assert.deepStrictEqual(yield* runSignInAction({ kind: "passkey" }), {
        kind: "complete",
      });
    }).pipe(provide),
  );
});
