export type AccountEmail = {
  id: string;
  email: string;
  primary: boolean;
  verified: boolean;
  linkedSignIn?: "google" | "github" | "sso";
};

export type Account = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl?: string;
  emails: AccountEmail[];
};

export type DeletedOrganization = { id: string; name: string; purgesAt?: Date };

export const signInLabels = {
  google: "Google",
  github: "GitHub",
  sso: "single sign-on",
} as const;

export const fullName = (account: Account | undefined) =>
  account === undefined
    ? ""
    : [account.firstName, account.lastName]
        .filter((part) => part !== null && part !== "")
        .join(" ");

export function splitName(name: string) {
  const trimmed = name.trim();
  const space = trimmed.indexOf(" ");
  return {
    firstName: space === -1 ? trimmed : trimmed.slice(0, space),
    lastName: space === -1 ? "" : trimmed.slice(space + 1),
  };
}

export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateNewEmail(input: string, current: string) {
  const email = input.trim().toLowerCase();
  if (!emailPattern.test(email)) return "Enter a valid email address";
  if (email === current.toLowerCase()) return "This is already your email";
  return null;
}

export const keptEmailNote = (email: AccountEmail) =>
  email.linkedSignIn === undefined
    ? `${email.email} could not be removed from your account`
    : `${email.email} stays on your account because it's linked to your ${signInLabels[email.linkedSignIn]} sign-in`;

export const restoreDescription = (org: DeletedOrganization) =>
  org.purgesAt === undefined
    ? "Restore member access; subscriptions stay canceled and auto-reload stays off"
    : `Restorable until ${org.purgesAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}; subscriptions stay canceled and auto-reload stays off`;

export const sampleAccount: Account = {
  id: "user_sample_alex",
  firstName: "Alex",
  lastName: "Morgan",
  emails: [
    {
      id: "email_sample_alex",
      email: "alex@example.com",
      primary: true,
      verified: true,
    },
  ],
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const text = (value: unknown) =>
  typeof value === "string" ? value : undefined;

const signIns = ["google", "github", "sso"] as const;

const linkedSignInOf = (value: unknown) =>
  signIns.find((signIn) => signIn === value);

const emailOf = (row: Record<string, unknown>): AccountEmail | undefined => {
  const email = text(row.email);
  if (email === undefined) return undefined;
  const linkedSignIn = linkedSignInOf(row.linkedSignIn);
  return {
    id: text(row.id) ?? email,
    email,
    primary: row.primary === true,
    verified: row.verified === true,
    ...(linkedSignIn === undefined ? {} : { linkedSignIn }),
  };
};

/** The account endpoint is undecoded, so the page reads it through this guard. */
export function readAccount(value: unknown): Account | undefined {
  if (!isRecord(value)) return undefined;
  const id = text(value.id);
  if (id === undefined) return undefined;
  const rows = Array.isArray(value.emails) ? value.emails : [];
  return {
    id,
    firstName: text(value.firstName) ?? null,
    lastName: text(value.lastName) ?? null,
    imageUrl: text(value.imageUrl),
    emails: rows.filter(isRecord).flatMap((row) => {
      const email = emailOf(row);
      return email === undefined ? [] : [email];
    }),
  };
}
