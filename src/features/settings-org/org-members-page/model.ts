import type {
  AccessLevel,
  InvitationView,
  InviteOutcomeView,
  MemberView,
} from "./data";

export type MfaLevel = "any" | "passkey";
export type RoleFilter = "all" | AccessLevel | "neither";
export type SortKey = "name" | "email" | "status" | "joined";
export type SortDirection = "ascending" | "descending";
export type SortState = { key: SortKey; direction: SortDirection };

export const roleLabels: Record<AccessLevel, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
};

const roleRank: Record<AccessLevel, number> = { owner: 0, admin: 1, member: 2 };

export const roleFilterLabels: Record<RoleFilter, string> = {
  all: "All roles",
  owner: "Owner",
  admin: "Admin",
  member: "Member",
  neither: "Neither",
};

export const assignableRoles: ReadonlyArray<AccessLevel> = [
  "member",
  "admin",
  "owner",
];

export const extendOptions = {
  "7": "7 more days",
  "14": "14 more days",
  "30": "30 more days",
} as const;

export type ExtendDays = keyof typeof extendOptions;

export const defaultSort: SortState = { key: "status", direction: "ascending" };

const dayMs = 24 * 60 * 60 * 1000;

const joinedFormat = new Intl.DateTimeFormat(undefined, {
  month: "short",
  year: "numeric",
});

/** Capy's member display name: first and last name, else the email. */
export const displayName = (member: {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
}) =>
  [member.firstName, member.lastName]
    .flatMap((part) =>
      part === null || part.trim() === "" ? [] : [part.trim()],
    )
    .join(" ") ||
  member.email ||
  "";

export const memberName = (member: MemberView) =>
  displayName(member) || member.userId;

export const formatShortDate = (date: Date) =>
  date.toLocaleDateString(undefined, { month: "short", day: "numeric" });

export const formatJoined = (date: Date) => joinedFormat.format(date);

/** Whether a member already meets the org's two-step requirement. */
export const meetsMfa = (member: MemberView, level: MfaLevel) =>
  member.enterpriseSso ||
  member.passkeyTrusted ||
  (level === "any" && member.mfaEnabled);

/** The member's own deadline extension, when it runs past `after`. */
export const extensionAfter = (member: MemberView, after: number) => {
  if (member.mfaExtendedUntil === null) return undefined;
  return member.mfaExtendedUntil.getTime() > after
    ? member.mfaExtendedUntil
    : undefined;
};

/** The new deadline the extend dialog offers: `days` past the later of now and the org deadline. */
export const extendedDeadline = (
  days: ExtendDays,
  enforceAt: Date | null,
  now: number,
) => {
  const from =
    enforceAt !== null && enforceAt.getTime() > now ? enforceAt.getTime() : now;
  return new Date(from + Number(days) * dayMs);
};

const compareText = (a: string, b: string) =>
  a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });

/** Sorts by `value`, breaking ties by `name` ascending whatever the direction. */
export const sortRows = <T>(
  rows: ReadonlyArray<T>,
  value: (row: T) => string | number,
  direction: SortDirection,
  name: (row: T) => string,
) =>
  rows.toSorted((a, b) => {
    const left = value(a);
    const right = value(b);
    const order =
      typeof left === "number" && typeof right === "number"
        ? left - right
        : compareText(String(left), String(right));
    if (order === 0) return compareText(name(a), name(b));
    return direction === "ascending" ? order : -order;
  });

export const memberSortValue = (member: MemberView, key: SortKey) => {
  if (key === "name") return memberName(member);
  if (key === "email") return member.email ?? "";
  if (key === "status") return roleRank[member.accessLevel];
  return member.createdAt.getTime();
};

export const invitationSortValue = (
  invitation: InvitationView,
  key: SortKey,
) => {
  if (key === "name" || key === "email") return invitation.email;
  if (key === "status") return "Invited";
  return invitation.createdAt.getTime();
};

export const nextSort = (current: SortState, key: SortKey): SortState => ({
  key,
  direction:
    current.key === key && current.direction === "ascending"
      ? "descending"
      : "ascending",
});

const normalized = (query: string) => query.trim().toLowerCase();

export const matchesMember = (
  member: MemberView,
  query: string,
  role: RoleFilter,
  mfaLevel: MfaLevel,
) =>
  (role === "all" ||
    member.accessLevel === role ||
    (role === "neither" && !meetsMfa(member, mfaLevel))) &&
  `${memberName(member)} ${member.email ?? ""}`
    .toLowerCase()
    .includes(normalized(query));

export const matchesInactive = (
  member: MemberView,
  query: string,
  role: RoleFilter,
) =>
  member.disabled &&
  (role === "all" || member.accessLevel === role) &&
  `${memberName(member)} ${member.email ?? ""}`
    .toLowerCase()
    .includes(normalized(query));

export const matchesInvitation = (
  invitation: InvitationView,
  query: string,
  role: RoleFilter,
) =>
  (role === "all" || role === "member") &&
  invitation.email.toLowerCase().includes(normalized(query));

export const parseEmails = (text: string) =>
  text.split(/[\s,;]+/).filter((email) => email.length > 0);

export const summarizeInvites = (
  outcomes: ReadonlyArray<InviteOutcomeView>,
) => ({
  sent: outcomes.filter((outcome) => outcome.status === "invited").length,
  skipped: outcomes
    .filter((outcome) => outcome.status !== "invited")
    .map(
      (outcome) =>
        `${outcome.email} (${outcome.status === "already_member" ? "already a member" : "invalid"})`,
    ),
});

export const roleArticle = (role: AccessLevel) =>
  role === "member" ? "a member" : `an ${role}`;

/** Whether the "Set role" item for `role` is disabled for this member. */
export const roleItemDisabled = (
  role: AccessLevel,
  member: MemberView,
  viewerIsOwner: boolean,
  lastOwner: boolean,
) =>
  (role !== member.accessLevel &&
    (role === "owner" || member.accessLevel === "owner") &&
    !viewerIsOwner) ||
  (lastOwner && role !== "owner");

/** Capy's API error text when the server sent one, else the fallback. */
export const errorMessage = (error: unknown, fallback: string) => {
  if (typeof error !== "object" || error === null) return fallback;
  const tag = "_tag" in error ? error._tag : undefined;
  const message = "message" in error ? error.message : undefined;
  return typeof tag === "string" &&
    tag.startsWith("capy/") &&
    typeof message === "string" &&
    message.length > 0
    ? message
    : fallback;
};
