import type { UsageWindow } from "./types.ts";

export const usageColumns = [
  { minutes: 300, label: "5h", short: true },
  { minutes: 10080, label: "7d", short: false },
] as const;

const fableLimitId = "seven_day_overage_included";

const resetIfPast = (window: UsageWindow, now: number): UsageWindow =>
  window.resetsAt !== undefined && window.resetsAt.getTime() <= now
    ? { ...window, usedPercent: 0, resetsAt: undefined }
    : window;

export const columnWindows = (
  windows: ReadonlyArray<UsageWindow>,
  service: string,
  now: number,
) => {
  const current = windows
    .filter((w) => w.limitId === undefined || w.limitId === service)
    .map((w) => resetIfPast(w, now))
    .toSorted(
      (a, b) =>
        (a.windowMinutes ?? Number.POSITIVE_INFINITY) -
        (b.windowMinutes ?? Number.POSITIVE_INFINITY),
    );
  return usageColumns.map((column) => {
    const matching = current.filter(
      (w) =>
        (w.windowMinutes !== undefined && w.windowMinutes <= 1440) ===
        column.short,
    );
    return (
      matching.find((w) => w.windowMinutes === column.minutes) ?? matching[0]
    );
  });
};

export const fableWindow = (
  windows: ReadonlyArray<UsageWindow>,
  now: number,
) => {
  const window = windows.find((w) => w.limitId === fableLimitId);
  return window === undefined ? undefined : resetIfPast(window, now);
};

export const earliestReset = (
  windows: ReadonlyArray<UsageWindow | undefined>,
) =>
  windows
    .flatMap((w) => (w?.resetsAt === undefined ? [] : [w.resetsAt]))
    .toSorted((a, b) => a.getTime() - b.getTime())[0];

export const resetIn = (date: Date, now: number) => {
  const minutes = Math.max(1, Math.round((date.getTime() - now) / 6e4));
  const hours = Math.round(minutes / 60);
  return minutes < 60
    ? `${minutes}m`
    : hours < 24
      ? `${hours}h`
      : date.toLocaleDateString(undefined, { weekday: "short" });
};

export const usedPercent = (window: UsageWindow | undefined) =>
  window === undefined
    ? undefined
    : Math.round(Math.max(0, Math.min(100, window.usedPercent)));

const windowSpan = (window: UsageWindow) => {
  const minutes = window.windowMinutes;
  return minutes === undefined
    ? window.limiter
    : minutes >= 40320
      ? "Monthly"
      : minutes === 10080
        ? "Weekly"
        : minutes % 60 === 0
          ? `${minutes / 60} hr`
          : `${minutes} min`;
};

const resetsLabel = (date: Date | undefined, now: number) => {
  if (date === undefined) return undefined;
  const ms = date.getTime() - now;
  return ms < 864e5
    ? `resets ${date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`
    : ms < 6048e5
      ? `resets ${date.toLocaleDateString(undefined, { weekday: "short" })}`
      : `resets ${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
};

export type UsageDisplay = {
  readonly label: string;
  readonly usedPercent: number;
  readonly entitlement?: number;
  readonly remaining?: number;
  readonly resets?: string;
};

export const describeWindow = (
  window: UsageWindow,
  now: number,
): UsageDisplay => {
  const past =
    window.resetsAt !== undefined && window.resetsAt.getTime() <= now;
  const span = windowSpan(window);
  return {
    label:
      window.limitName === undefined ? span : `${window.limitName} · ${span}`,
    usedPercent: past ? 0 : window.usedPercent,
    entitlement: window.entitlement,
    remaining: window.remaining,
    resets: past ? undefined : resetsLabel(window.resetsAt, now),
  };
};

export const exhaustedWindows = (
  windows: ReadonlyArray<UsageWindow>,
  usageCap: number | undefined,
  now: number,
) => {
  const cap = Math.min(100, usageCap ?? 100);
  return windows
    .map((w) => resetIfPast(w, now))
    .filter((w) => w.usedPercent >= cap && w.resetsAt !== undefined);
};
