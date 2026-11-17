export interface SampleAccount {
  readonly email: string;
  readonly emailAddressId: string;
  readonly password: string | null;
  readonly passkey: boolean;
  readonly totp: {
    readonly code: string;
    readonly backupCodes: ReadonlyArray<string>;
  } | null;
}

export const sampleEmailCode = "424242";
export const sampleExpiredCode = "000000";
export const sampleTicket = "sample-invitation-ticket";
export const sampleNotMeToken = "sample-report-token";
export const sampleFailingNotMeToken = "sample-failing-token";
export const sampleSsoDomain = "sso.example.com";

export const sampleAccounts: ReadonlyArray<SampleAccount> = [
  {
    email: "alex@example.com",
    emailAddressId: "idn_sample_alex",
    password: "sample-password",
    passkey: true,
    totp: null,
  },
  {
    email: "sam@example.com",
    emailAddressId: "idn_sample_sam",
    password: null,
    passkey: false,
    totp: null,
  },
  {
    email: "jordan@example.com",
    emailAddressId: "idn_sample_jordan",
    password: "sample-password",
    passkey: false,
    totp: { code: "135790", backupCodes: ["sample-backup-01"] },
  },
];

export const authErrorMessages = {
  form_identifier_not_found: "Couldn't find your account.",
  form_identifier_exists: "That email address is taken. Please try another.",
  form_password_incorrect:
    "Password is incorrect. Try again, or use another method.",
  form_password_length_too_short: "Passwords must be 8 characters or more.",
  form_code_incorrect: "Incorrect code",
  verification_expired: "This code has expired, request a new one",
  verification_failed: "Something went wrong, try again",
  client_mismatch: "Something went wrong, try again",
  passkey_cancelled: "Passkey sign-in was cancelled",
  no_redirect_in_progress: "Something went wrong, try again",
  report_failed: "Capy could not file this report, contact support",
} as const;
