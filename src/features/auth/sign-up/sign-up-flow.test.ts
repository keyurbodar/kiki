import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import {
  makeAuthServiceMock,
  sampleEmailCode,
  sampleExpiredCode,
} from "@/data/auth";
import { parseSignUpStep, runSignUpAction } from "./sign-up-flow";

const provide = Effect.provide(makeAuthServiceMock({ latency: 0 }));

describe("runSignUpAction", () => {
  it("parses the continue search param", () => {
    assert.strictEqual(parseSignUpStep("verify-code"), "verify-code");
    assert.strictEqual(parseSignUpStep(undefined), "start");
  });

  it.effect("creates an account and verifies the email code", () =>
    Effect.gen(function* () {
      const created = yield* runSignUpAction({
        kind: "create",
        email: "new@example.com",
        password: "long-enough",
        redirectTo: "/new",
      });
      assert.deepStrictEqual(created, { kind: "step", step: "verify-code" });
      const expired = yield* runSignUpAction({
        kind: "verify",
        code: sampleExpiredCode,
      });
      assert.strictEqual(expired.kind, "error");
      const done = yield* runSignUpAction({
        kind: "verify",
        code: sampleEmailCode,
      });
      assert.deepStrictEqual(done, { kind: "complete" });
    }).pipe(provide),
  );

  it.effect("reports a taken email", () =>
    Effect.gen(function* () {
      const taken = yield* runSignUpAction({
        kind: "create",
        email: "alex@example.com",
        password: "long-enough",
        redirectTo: "/new",
      });
      assert.strictEqual(taken.kind, "error");
    }).pipe(provide),
  );

  it.effect("sends SSO domains through the sign-up callback", () =>
    Effect.gen(function* () {
      const sso = yield* runSignUpAction({
        kind: "create",
        email: "kim@sso.example.com",
        password: "long-enough",
        redirectTo: "/new",
      });
      assert.deepStrictEqual(sso, {
        kind: "redirect",
        href: "/sign-up/sso-callback?redirect_url=%2Fnew",
      });
    }).pipe(provide),
  );
});
