import type { CommitAuthor, FeedbackMode } from "../threads/agent-settings";

export type CommitAuthorOption = {
  author: CommitAuthor;
  coAuthor: boolean;
  label: string;
  description: string;
};

const defaultCommitAuthor: CommitAuthorOption = {
  author: "user",
  coAuthor: true,
  label: "You, Capy co-author",
  description: "Your account authors, Capy credited as co-author",
};

export const commitAuthorOptions: readonly CommitAuthorOption[] = [
  defaultCommitAuthor,
  {
    author: "user",
    coAuthor: false,
    label: "You",
    description: "Your account authors, no co-author",
  },
  {
    author: "capy",
    coAuthor: true,
    label: "Capy, you co-author",
    description: "The Capy bot authors, you credited as co-author",
  },
  {
    author: "capy",
    coAuthor: false,
    label: "Capy",
    description: "The Capy bot authors, no co-author",
  },
];

export const selectedCommitAuthor = (author: CommitAuthor, coAuthor: boolean) =>
  commitAuthorOptions.find(
    (option) => option.author === author && option.coAuthor === coAuthor,
  ) ?? defaultCommitAuthor;

export const defaultBranchPrefix = "capy";

export const isValidBranchPrefix = (prefix: string) =>
  prefix.length <= 32 &&
  /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(prefix) &&
  prefix !== "release";

export const isValidCommitEmail = (email: string) =>
  email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export type DraftCommit<T> =
  | { kind: "reject"; error: string }
  | { kind: "keep"; value: string }
  | { kind: "save"; value: string; next: T };

/** Committing the branch prefix field: lowercase it, reject invalid prefixes, and save null for the default. */
export const commitBranchPrefix = (
  draft: string,
  saved: string | undefined,
): DraftCommit<string | null> => {
  const value = draft.trim().toLowerCase();
  if (!isValidBranchPrefix(value))
    return {
      kind: "reject",
      error:
        value === "release"
          ? "The release prefix is reserved"
          : "Use lowercase letters, numbers, or interior hyphens",
    };
  return value === (saved ?? defaultBranchPrefix)
    ? { kind: "keep", value }
    : {
        kind: "save",
        value,
        next: value === defaultBranchPrefix ? null : value,
      };
};

/** Committing the commit email field: empty clears it, anything else must be an email. */
export const commitCommitEmail = (
  draft: string,
  saved: string | undefined,
): DraftCommit<string | null> => {
  const value = draft.trim();
  if (value !== "" && !isValidCommitEmail(value))
    return { kind: "reject", error: "Enter a valid email address" };
  return value === (saved ?? "")
    ? { kind: "keep", value }
    : { kind: "save", value, next: value === "" ? null : value };
};

export type SigningRegistration = "registered" | "pending" | "manual_required";

export type GitSigning = {
  hasKey: boolean;
  registrationStatus: SigningRegistration;
  publicKey: string | null;
  fingerprint: string | null;
};

type Raw = Record<string, unknown>;

const record = (value: unknown): Raw | undefined =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Raw)
    : undefined;

const text = (value: unknown) =>
  typeof value === "string" && value !== "" ? value : null;

export const readGitSigning = (value: unknown): GitSigning | undefined => {
  const raw = record(value);
  if (raw === undefined) return undefined;
  const status = raw.registrationStatus;
  return {
    hasKey: raw.hasKey === true,
    registrationStatus:
      status === "registered" || status === "pending"
        ? status
        : "manual_required",
    publicKey: text(raw.publicKey),
    fingerprint: text(raw.fingerprint),
  };
};

export const signingStatusLabel = (status: SigningRegistration) =>
  status === "registered"
    ? "Verified on GitHub"
    : status === "pending"
      ? "Registration pending"
      : "Manual setup required";

export const signingDescription = (
  author: CommitAuthor,
  signCommits: boolean,
  signing: GitSigning | undefined,
) =>
  author === "user"
    ? signCommits && signing?.hasKey
      ? signingStatusLabel(signing.registrationStatus)
      : "Sign commits with your managed GPG key"
    : "Available when commits are authored as you";

export const feedbackModeLabels: Record<FeedbackMode, string> = {
  off: "Ignore",
  listen: "Keep as context",
  react: "React",
};

export const feedbackModeOptions = (["off", "listen", "react"] as const).map(
  (value) => ({ value, label: feedbackModeLabels[value] }),
);

export const botAllowlistMax = 20;

export const botLoginPattern = /^[A-Za-z0-9][A-Za-z0-9-]{0,38}(\[bot\])?$/;

/** Whether a typed GitHub login can be added to the bot list. */
export const canAddBot = (login: string, listed: ReadonlyArray<string>) =>
  botLoginPattern.test(login) &&
  !listed.some((entry) => entry.toLowerCase() === login.toLowerCase());

export const withoutBot = (list: ReadonlyArray<string>, login: string) =>
  list.filter((entry) => entry.toLowerCase() !== login.toLowerCase());

export const replaceBot = (
  list: ReadonlyArray<string>,
  login: string,
  replacement: string,
) =>
  list.map((entry) =>
    entry.toLowerCase() === login.toLowerCase() ? replacement : entry,
  );

export type BotHealth =
  | { login: string; status: "active" }
  | { login: string; status: "stale"; lastSeenAt: string | null }
  | { login: string; status: "unseen"; suggestion: string | null };

export const readBotHealth = (value: unknown): BotHealth[] =>
  (Array.isArray(value) ? value : []).flatMap((item): BotHealth[] => {
    const raw = record(item);
    const login = text(raw?.login);
    if (raw === undefined || login === null) return [];
    if (raw.status === "active") return [{ login, status: "active" }];
    if (raw.status === "stale")
      return [{ login, status: "stale", lastSeenAt: text(raw.lastSeenAt) }];
    if (raw.status === "unseen")
      return [{ login, status: "unseen", suggestion: text(raw.suggestion) }];
    return [];
  });

export type SeenBot = { login: string; avatarUrl: string | null };

export const readSeenBots = (value: unknown): SeenBot[] =>
  (Array.isArray(value) ? value : []).flatMap((item) => {
    const raw = record(item);
    const login = text(raw?.login);
    return login === null ? [] : [{ login, avatarUrl: text(raw?.avatarUrl) }];
  });

export const githubAvatarUrl = (login: string) =>
  `https://avatars.githubusercontent.com/${encodeURIComponent(login)}`;
