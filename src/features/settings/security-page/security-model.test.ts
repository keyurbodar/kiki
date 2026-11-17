import { describe, expect, it } from "vitest";
import {
  generateBackupCodes,
  passkeyCountLabel,
  passkeyDescription,
  removeTotpDescription,
  requirePasskeyDescription,
  sampleSecurity,
  signInMethodCount,
  twoStepDescription,
} from "./security-model";

const passkey = (
  over: Partial<Parameters<typeof passkeyDescription>[0]> = {},
) => ({
  id: "pk1",
  name: "MacBook",
  createdAt: new Date("2026-03-04T00:00:00Z"),
  lastUsedAt: null,
  trusted: true,
  ...over,
});

describe("sign-in methods", () => {
  it("counts the primary email plus password and external accounts", () => {
    expect(signInMethodCount(sampleSecurity)).toBe(2);
    expect(
      signInMethodCount({
        ...sampleSecurity,
        passwordEnabled: true,
        externalAccounts: [
          { provider: "github", login: "alex", linkedAt: new Date() },
        ],
      }),
    ).toBe(3);
  });

  it("pluralizes the passkey count", () => {
    expect(passkeyCountLabel(0)).toBe("No passkeys");
    expect(passkeyCountLabel(1)).toBe("1 passkey");
    expect(passkeyCountLabel(3)).toBe("3 passkeys");
  });
});

describe("passkey copy", () => {
  it("marks untrusted passkeys and points at the fix", () => {
    expect(passkeyDescription(passkey({ trusted: false }), true)).toContain(
      "pause your access until you trust or remove it",
    );
    expect(passkeyDescription(passkey({ trusted: false }), false)).toBe(
      "Not trusted yet, turn on an authenticator app to trust it or remove it",
    );
  });

  it("shows added and last-used dates for trusted passkeys", () => {
    expect(passkeyDescription(passkey(), false)).toBe("Added Mar 4, 2026");
    expect(
      passkeyDescription(
        passkey({ lastUsedAt: new Date("2026-05-06T00:00:00Z") }),
        false,
      ),
    ).toBe("Added Mar 4, 2026, last used May 6, 2026");
  });
});

describe("two-step copy", () => {
  it("reads as a plain description when no organization requires it", () => {
    expect(twoStepDescription([])).toBe(
      "A second check after you sign in, from an app or a trusted passkey",
    );
    expect(removeTotpDescription([])).toBe(
      "Sign-ins stop asking for a code and your backup codes stop working",
    );
  });

  it("names the organizations requiring it", () => {
    expect(twoStepDescription(["Acme"])).toBe(
      "Acme requires a second check after you sign in, from an app or a trusted passkey",
    );
    expect(twoStepDescription(["Acme", "Globex"])).toBe(
      "Acme and Globex require a second check after you sign in, from an app or a trusted passkey",
    );
    expect(removeTotpDescription(["Acme", "Globex"])).toBe(
      "You will lose access to Acme and Globex until you set up a new method",
    );
  });
});

describe("requiring passkeys", () => {
  it("asks for a passkey before it can be required", () => {
    expect(requirePasskeyDescription(sampleSecurity)).toBe(
      "Add a passkey to turn this on",
    );
  });

  it("suggests a backup passkey when only one is registered", () => {
    expect(
      requirePasskeyDescription({
        ...sampleSecurity,
        passkeyRequired: true,
        passkeys: [passkey()],
      }),
    ).toBe(
      "Only passkeys sign you in, so add a second passkey as a backup in case you lose this one",
    );
  });

  it("describes the account-wide effect otherwise", () => {
    expect(
      requirePasskeyDescription({ ...sampleSecurity, passkeys: [passkey()] }),
    ).toBe("Stop password and email code sign-ins for your account");
    expect(
      requirePasskeyDescription({
        ...sampleSecurity,
        passkeyRequired: true,
        passkeys: [passkey(), passkey({ id: "pk2" })],
      }),
    ).toBe(
      "Only passkey sign-ins work for your account, in every organization and app",
    );
  });
});

describe("backup codes", () => {
  it("makes ten eight-character codes from the injected source", () => {
    const codes = generateBackupCodes(() => 0.5);
    expect(codes).toHaveLength(10);
    for (const code of codes) {
      expect(code).toMatch(/^[0-9a-z]{8}$/);
    }
  });
});
