import { deviceCompletionKinds } from "../notification-filter-rows/notification-kinds";

export type PushSubscriptionView = {
  id: string;
  label: string;
  kinds: Readonly<Record<string, boolean>>;
  origins: Readonly<Record<string, boolean>>;
  lastSeenAt: Date;
  lastDeliveredAt: Date | null;
  failedAt: Date | null;
};

export type PushStateView = {
  vapidPublicKey: string | null;
  subscriptions: readonly PushSubscriptionView[];
};

const record = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};

const flags = (value: unknown): Record<string, boolean> =>
  Object.fromEntries(
    Object.entries(record(value)).filter(
      (entry): entry is [string, boolean] => typeof entry[1] === "boolean",
    ),
  );

const date = (value: unknown): Date | null => {
  if (value instanceof Date) return value;
  if (typeof value !== "string" && typeof value !== "number") return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export function readPushState(raw: unknown): PushStateView {
  const state = record(raw);
  const subscriptions = Array.isArray(state.subscriptions)
    ? state.subscriptions
    : [];
  return {
    vapidPublicKey:
      typeof state.vapidPublicKey === "string"
        ? state.vapidPublicKey
        : "vapidPublicKey" in state
          ? null
          : "",
    subscriptions: subscriptions.flatMap((value) => {
      const row = record(value);
      if (typeof row.id !== "string") return [];
      return [
        {
          id: row.id,
          label: typeof row.label === "string" ? row.label : "Browser",
          kinds: flags(row.kinds),
          origins: flags(row.origins),
          lastSeenAt:
            date(row.lastSeenAt) ?? date(row.createdAt) ?? new Date(0),
          lastDeliveredAt: date(row.lastDeliveredAt),
          failedAt: date(row.failedAt),
        },
      ];
    }),
  };
}

const kindNouns = { mention: "mentions", error: "errors" } as const;

export function subscriptionKindsSummary(subscription: PushSubscriptionView) {
  const kinds = deviceCompletionKinds
    .filter((kind) => subscription.kinds[kind] !== false)
    .map((kind) => kindNouns[kind]);
  if (kinds.length === 0) return "Nothing";
  const text = kinds.join(", ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const second = 1000;
const minute = 60 * second;
const hour = 60 * minute;
const day = 24 * hour;
const week = 7 * day;
const year = 365 * day;

export function formatRelativeTime(at: Date, now: number) {
  const delta = now - at.getTime();
  const distance = Math.abs(delta);
  if (distance < 5 * second) return "just now";
  const amount =
    distance < minute
      ? `${Math.floor(distance / second)}s`
      : distance < hour
        ? `${Math.floor(distance / minute)}m`
        : distance < day
          ? `${Math.floor(distance / hour)}h`
          : distance < week
            ? `${Math.floor(distance / day)}d`
            : distance < year
              ? `${Math.floor(distance / week)}w`
              : `${Math.floor(distance / year)}y`;
  return delta < 0 ? `in ${amount}` : `${amount} ago`;
}

export function subscriptionActivity(
  subscription: PushSubscriptionView,
  now: number,
) {
  if (
    subscription.failedAt !== null &&
    (subscription.lastDeliveredAt === null ||
      subscription.failedAt > subscription.lastDeliveredAt)
  )
    return "Last push failed, retrying";
  const last = subscription.lastDeliveredAt ?? subscription.lastSeenAt;
  return now - last.getTime() < minute
    ? "Active now"
    : `Active ${formatRelativeTime(last, now)}`;
}

export const pushPatchPayload = (prefs: {
  mention: boolean;
  error: boolean;
  origins: Readonly<Record<string, boolean>>;
}) => ({
  kinds: { mention: prefs.mention, error: prefs.error },
  origins: prefs.origins,
});
