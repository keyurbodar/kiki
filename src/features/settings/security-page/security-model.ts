export type OAuthProvider = "google" | "github";

export const providerNames: Record<OAuthProvider, string> = {
  google: "Google",
  github: "GitHub",
};

export type ExternalAccount = {
  provider: OAuthProvider;
  emailAddress: string;
  verified: boolean;
};

export type Passkey = {
  id: string;
  name: string;
  createdAt: Date;
  lastUsedAt: Date | null;
  trusted: boolean;
};

export type SecurityState = {
  emailAddress: string;
  emailVerified: boolean;
  passwordEnabled: boolean;
  externalAccounts: ExternalAccount[];
  totpEnabled: boolean;
  passkeys: Passkey[];
  passkeyRequired: boolean;
};

export const sampleSecurity: SecurityState = {
  emailAddress: "alex@example.com",
  emailVerified: true,
  passwordEnabled: false,
  externalAccounts: [
    { provider: "google", emailAddress: "alex@example.com", verified: true },
  ],
  totpEnabled: false,
  passkeys: [],
  passkeyRequired: false,
};

export const signInMethodCount = (state: SecurityState) =>
  1 + (state.passwordEnabled ? 1 : 0) + state.externalAccounts.length;

export const passkeyCountLabel = (count: number) =>
  count === 0 ? "No passkeys" : count === 1 ? "1 passkey" : `${count} passkeys`;

const shortDate = (date: Date) =>
  date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export function passkeyDescription(passkey: Passkey, totpEnabled: boolean) {
  if (!passkey.trusted)
    return totpEnabled
      ? "Not trusted yet, organizations that require two-step verification pause your access until you trust or remove it"
      : "Not trusted yet, turn on an authenticator app to trust it or remove it";
  return `Added ${shortDate(passkey.createdAt)}${passkey.lastUsedAt == null ? "" : `, last used ${shortDate(passkey.lastUsedAt)}`}`;
}

export const twoStepDescription = (requiredBy: string[]) =>
  requiredBy.length === 0
    ? "A second check after you sign in, from an app or a trusted passkey"
    : `${new Intl.ListFormat("en", { type: "conjunction" }).format(requiredBy)} ${requiredBy.length === 1 ? "requires" : "require"} a second check after you sign in, from an app or a trusted passkey`;

export const removeTotpDescription = (requiredBy: string[]) =>
  requiredBy.length === 0
    ? "Sign-ins stop asking for a code and your backup codes stop working"
    : `You will lose access to ${new Intl.ListFormat("en", { type: "conjunction" }).format(requiredBy)} until you set up a new method`;

export function requirePasskeyDescription(state: SecurityState) {
  if (state.passkeyRequired)
    return state.passkeys.length === 1
      ? "Only passkeys sign you in, so add a second passkey as a backup in case you lose this one"
      : "Only passkey sign-ins work for your account, in every organization and app";
  return state.passkeys.some((p) => p.trusted)
    ? "Stop password and email code sign-ins for your account"
    : "Add a passkey to turn this on";
}

export function generateBackupCodes(random: () => number = Math.random) {
  return Array.from({ length: 10 }, () =>
    Array.from({ length: 8 }, () =>
      Math.floor(random() * 36).toString(36),
    ).join(""),
  );
}
