import { describe, expect, it } from "vitest";
import {
  currentReverification,
  nextVerifyStep,
  requestDesktopReverification,
  VERIFY_ON_WEB,
  verifyDescription,
} from "./reverification";

describe("nextVerifyStep", () => {
  it("blocks on errors and settles on complete", () => {
    expect(nextVerifyStep({ ok: false, message: "Nope" })).toEqual({
      kind: "state",
      state: { kind: "blocked", message: "Nope" },
    });
    expect(nextVerifyStep({ ok: true, status: "complete" })).toEqual({
      kind: "settle",
    });
  });

  it("prefers the authenticator app for second factors", () => {
    expect(
      nextVerifyStep({
        ok: true,
        status: "needs_second_factor",
        secondFactors: [{ strategy: "backup_code" }, { strategy: "totp" }],
      }),
    ).toEqual({ kind: "state", state: { kind: "totp", backupCode: true } });
    expect(
      nextVerifyStep({
        ok: true,
        status: "needs_second_factor",
        secondFactors: [{ strategy: "backup_code" }],
      }),
    ).toEqual({ kind: "state", state: { kind: "backup-code", totp: false } });
    expect(
      nextVerifyStep({
        ok: true,
        status: "needs_second_factor",
        secondFactors: [{ strategy: "phone_code" }],
      }),
    ).toEqual({
      kind: "state",
      state: { kind: "blocked", message: VERIFY_ON_WEB },
    });
  });

  it("falls back to password, then an emailed code", () => {
    const email = {
      strategy: "email_code",
      emailAddressId: "ea_1",
      safeIdentifier: "a***@example.com",
    };
    expect(
      nextVerifyStep({
        ok: true,
        status: "needs_first_factor",
        firstFactors: [{ strategy: "password" }, email],
      }),
    ).toEqual({
      kind: "state",
      state: { kind: "password", emailAddressId: "ea_1" },
    });
    expect(
      nextVerifyStep({
        ok: true,
        status: "needs_first_factor",
        firstFactors: [email],
      }),
    ).toEqual({
      kind: "email-code",
      emailAddressId: "ea_1",
      identifier: "a***@example.com",
    });
    expect(
      nextVerifyStep({
        ok: true,
        status: "needs_first_factor",
        firstFactors: [],
      }),
    ).toEqual({
      kind: "state",
      state: { kind: "blocked", message: VERIFY_ON_WEB },
    });
  });
});

it("describes each state with Capy's copy", () => {
  expect(verifyDescription({ kind: "email-code", identifier: null })).toBe(
    "Enter the code Capy sent to your email",
  );
  expect(
    verifyDescription({ kind: "email-code", identifier: "a***@example.com" }),
  ).toBe("Enter the code sent to a***@example.com");
  expect(verifyDescription({ kind: "totp", backupCode: false })).toBe(
    "Enter the code from your authenticator app",
  );
  expect(verifyDescription({ kind: "loading" })).toBe(
    "This change needs a quick check that you're still you",
  );
});

describe("requestDesktopReverification", () => {
  it("publishes a prompt and resolves when it settles", async () => {
    const pending = requestDesktopReverification();
    const prompt = currentReverification();
    expect(prompt).toBeDefined();
    prompt?.settle(true);
    await expect(pending).resolves.toBe(true);
    expect(currentReverification()).toBeUndefined();
  });

  it("cancels the previous prompt when a new one arrives", async () => {
    const first = requestDesktopReverification();
    const second = requestDesktopReverification();
    await expect(first).resolves.toBe(false);
    currentReverification()?.settle(false);
    await expect(second).resolves.toBe(false);
  });
});
