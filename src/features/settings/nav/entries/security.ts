import type { SettingsNavEntry } from "../registry";

export const entry: SettingsNavEntry = {
  id: "security",
  label: "Security",
  to: "/settings/security",
  section: "personal",
  order: 30,
  icon: "shield",
  keywords:
    "authentication two-step verification 2fa mfa authenticator totp backup codes sign-in",
  rows: [
    {
      id: "sign-in-methods",
      title: "Sign-in methods",
      keywords: "login password email code google github connect disconnect",
    },
    {
      id: "two-step-verification",
      title: "Two-step verification",
      keywords: "2fa mfa",
    },
    {
      id: "authenticator-app",
      title: "Authenticator app",
      keywords: "totp code app 2fa",
    },
    {
      id: "backup-codes",
      title: "Backup codes",
      keywords: "recovery regenerate lost",
    },
    {
      id: "passkeys",
      title: "Passkeys",
      keywords: "passkey security key face id touch id",
    },
  ],
};
