import { DateTime } from "effect";
import type {
  ApiKey,
  ApiKeyPrivateProject,
  ServiceUser,
  ServiceUserRole,
} from "@/data/api/schemas/api-keys";

export type ApiKeyState =
  | "revoked"
  | "disabled"
  | "unavailable"
  | "expired"
  | "expires"
  | "active";

export const roleLabels: Record<ServiceUserRole, string> = {
  read_only: "Read-only",
  read_write: "Read-write",
  admin: "Admin",
};

export const toDate = (value: DateTime.DateTime) => DateTime.toDateUtc(value);

/** Capy's `$`: "No API keys", "1 API key", "3 API keys". */
export const pluralize = (count: number, noun: string) =>
  count === 0 ? `No ${noun}s` : count === 1 ? `1 ${noun}` : `${count} ${noun}s`;

export const projectScope = (user: Pick<ServiceUser, "projectAccessMode">) =>
  user.projectAccessMode === "all_org_projects"
    ? "all projects"
    : "selected projects";

export const apiKeyState = (
  key: ApiKey,
  serviceUsers: ReadonlyMap<string, Pick<ServiceUser, "disabledAt">>,
  now = Date.now(),
): ApiKeyState => {
  if (key.revokedAt !== null) return "revoked";
  if (key.principalKind === "service") {
    const user = serviceUsers.get(key.principalUserId);
    if (user === undefined) return "unavailable";
    if (user.disabledAt !== null) return "disabled";
  }
  if (key.expiresAt === null) return "active";
  return toDate(key.expiresAt).getTime() <= now ? "expired" : "expires";
};

export const apiKeyStateOrder: Record<ApiKeyState, number> = {
  active: 0,
  expires: 0,
  disabled: 1,
  unavailable: 1,
  expired: 2,
  revoked: 3,
};

/** Live keys first, then newest. */
export const sortApiKeys = (
  keys: ReadonlyArray<ApiKey>,
  serviceUsers: ReadonlyMap<string, Pick<ServiceUser, "disabledAt">>,
  now = Date.now(),
) =>
  keys.toSorted((a, b) => {
    const order =
      apiKeyStateOrder[apiKeyState(a, serviceUsers, now)] -
      apiKeyStateOrder[apiKeyState(b, serviceUsers, now)];
    return order === 0
      ? toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime()
      : order;
  });

/** Enabled first, then by name. */
export const sortServiceUsers = <
  T extends Pick<ServiceUser, "disabledAt" | "name">,
>(
  users: ReadonlyArray<T>,
) =>
  users.toSorted(
    (a, b) =>
      Number(a.disabledAt !== null) - Number(b.disabledAt !== null) ||
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
  );

export const unreachedProjects = (
  key: Pick<ApiKey, "revokedAt" | "privateProjects">,
): ReadonlyArray<ApiKeyPrivateProject> =>
  key.revokedAt === null
    ? key.privateProjects.filter((project) => !project.carried)
    : [];

export const formatShortDate = (date: Date) =>
  date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const thisYear = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});
const otherYear = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

/** Capy's timestamp format: drops the year inside the current year. */
export const formatTimestamp = (date: Date, now = Date.now()) =>
  (date.getFullYear() === new Date(now).getFullYear()
    ? thisYear
    : otherYear
  ).format(date);

export type ExpirationChoice = "never" | "30" | "90" | "365" | "custom";

/** Expiry for the mint dialog; undefined means never (or an invalid custom date). */
export const expirationDate = (
  choice: ExpirationChoice,
  customDate: string,
  now = Date.now(),
): Date | undefined => {
  if (choice === "never") return undefined;
  if (choice === "custom") {
    const date = new Date(`${customDate}T23:59:59`);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }
  return new Date(now + Number(choice) * 24 * 60 * 60 * 1000);
};

export const creditsPerDollar = 1000;

/** Parses the spend-cap field: null when blank, "invalid" when not a positive dollar amount. */
export const parseSpendCap = (input: string): number | null | "invalid" => {
  if (input.trim() === "") return null;
  const dollars = Number(input);
  const credits = Math.round(dollars * creditsPerDollar);
  return !Number.isFinite(dollars) ||
    dollars <= 0 ||
    !Number.isSafeInteger(credits) ||
    credits <= 0
    ? "invalid"
    : credits;
};

export const spendCapInput = (credits: number | null) =>
  credits === null ? "" : String(credits / creditsPerDollar);

export const roleDescription = (role: ServiceUserRole) =>
  role === "read_only"
    ? "Can read allowed resources"
    : role === "read_write"
      ? "Can read and mutate ordinary project and thread resources"
      : "Can use organization-admin API operations";

/** Capy's error-to-toast helper: the error's message when it has one. */
export const errorMessage = (error: unknown, fallback: string) => {
  const message =
    typeof error === "object" && error !== null && "message" in error
      ? (error as { message: unknown }).message
      : undefined;
  return typeof message === "string" && message !== "" ? message : fallback;
};
