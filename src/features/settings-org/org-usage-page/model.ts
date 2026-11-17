import { Option } from "effect";
import { AsyncResult } from "effect/reactivity";
import type { UsageRange } from "./types";

export type UsageQuery = {
  preset: "period" | "24h" | "7d" | "30d" | "custom";
  from?: string;
  to?: string;
  route?: string;
  dim?: "routes" | "models" | "members" | "private";
  board?: "tokens";
  order?: "cost" | "activity" | "created";
  scope?: "you";
};

const DAY = 86_400_000;
const HOUR = 3_600_000;

export const resolveRange = (
  query: UsageQuery,
  now: Date,
  timeZone: string,
  periodStart?: string,
): UsageRange => {
  if (query.preset === "24h") {
    return { from: new Date(now.getTime() - DAY), to: now, timeZone };
  }
  if (query.preset === "7d" || query.preset === "30d") {
    const days = query.preset === "7d" ? 7 : 30;
    return {
      from: new Date(now.getTime() - days * DAY),
      to: now,
      timeZone,
    };
  }
  if (query.preset === "custom" && query.from && query.to) {
    return {
      from: new Date(`${query.from}T00:00:00`),
      to: new Date(`${query.to}T00:00:00`),
      timeZone,
    };
  }
  const start = periodStart === undefined ? undefined : new Date(periodStart);
  return {
    from:
      start === undefined || Number.isNaN(start.getTime())
        ? new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
        : start,
    to: now,
    timeZone,
  };
};

export const loadResult = <A, E>(
  result: AsyncResult.AsyncResult<A, E>,
): A | undefined => Option.getOrUndefined(AsyncResult.value(result));

export const col = (units: number) => `calc(var(--spacing) * ${units})`;

export const formatCredits = (credits: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(credits / 100_000);

export const formatAxisCredits = (credits: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(credits / 100_000);

export const formatCompact = (value: number) =>
  new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

export const formatShare = (part: number, total: number) =>
  `${(total === 0 ? 0 : (part / total) * 100).toFixed(1)}%`;

export const formatBucketLabel = (
  date: Date,
  bucket: "hour" | "day",
  timeZone: string,
) =>
  new Intl.DateTimeFormat("en-US", {
    ...(bucket === "hour"
      ? { hour: "numeric" as const, minute: "2-digit" as const }
      : { month: "short" as const, day: "numeric" as const }),
    timeZone,
  }).format(date);

export const formatRangeLabel = (from: Date, to: Date, timeZone: string) => {
  const format = (value: Date) =>
    new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      timeZone,
    }).format(value);
  return `${format(from)} – ${format(to)}`;
};

export const hoursUntil = (end: Date, now: Date) =>
  Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (DAY / 24)));

export const daysUntil = (end: Date, now: Date) =>
  Math.max(0, Math.ceil((end.getTime() - now.getTime()) / DAY));

export const ROUTE_LABELS: Record<string, string> = {
  paid: "Billed",
  inference: "Inference",
  machines: "Machines",
  byok: "BYOK",
  subscription: "Subscription",
  allowance: "OSS allowance",
  internal: "Internal",
  no_charge: "No charge",
};

export const ROUTE_SHORT_LABELS: Record<string, string> = {
  paid: "",
  byok: "BYOK",
  subscription: "Sub",
  allowance: "OSS",
  internal: "Internal",
  no_charge: "Free",
  inference: "Models",
  machines: "Machines",
};

export const routeLabel = (route: string) =>
  ROUTE_LABELS[route] ??
  ROUTE_SHORT_LABELS[route] ??
  `${route.charAt(0).toUpperCase()}${route.slice(1)}`;

export const routeBadgeLabel = (route: string) =>
  ROUTE_SHORT_LABELS[route] ??
  `${route.charAt(0).toUpperCase()}${route.slice(1)}`;

export const dimensionWire = (dimension: UsageQuery["dim"]) =>
  dimension === "routes" || dimension === undefined
    ? "route"
    : dimension === "models"
      ? "entry"
      : dimension;

export const bucketFor = (range: UsageRange) =>
  range.to.getTime() - range.from.getTime() <= 2 * DAY ? "hour" : "day";

export const seriesWindow = (series: {
  buckets: ReadonlyArray<{ start: string; end: string }>;
}) => {
  const first = series.buckets[0];
  const last = series.buckets.at(-1);
  if (first === undefined || last === undefined) return undefined;
  const from = new Date(first.start);
  const to = new Date(last.end);
  return Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())
    ? undefined
    : { from, to };
};

export const usageSeriesBuckets = (range: UsageRange) => {
  const bucket = bucketFor(range);
  const step = bucket === "hour" ? HOUR : DAY;
  const start = Math.floor(range.from.getTime() / step) * step;
  const result: Date[] = [];
  for (let time = start; time < range.to.getTime(); time += step)
    result.push(new Date(time));
  return { bucket, starts: result };
};
