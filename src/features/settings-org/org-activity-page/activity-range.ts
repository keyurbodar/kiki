export type ActivityPreset = "24h" | "7d" | "30d" | "90d" | "custom";
export type ActivityMachineFilter = "cloud" | "device";

export type ActivitySearch = {
  preset?: ActivityPreset;
  from?: string;
  to?: string;
  project?: string[];
  member?: string[];
  machine?: ActivityMachineFilter;
};

export type ActivityRange = {
  preset: ActivityPreset;
  from: Date;
  to: Date;
  timeZone: string;
};

export const hourMs = 3_600_000;
export const dayMs = 24 * hourMs;

const presetDays = { "7d": 7, "30d": 30, "90d": 90 } as const;
const isoDay = /^\d{4}-\d{2}-\d{2}$/;

const stringList = (value: unknown) => {
  const list = (Array.isArray(value) ? value : [value]).filter(
    (item): item is string => typeof item === "string" && item !== "",
  );
  return list.length === 0 ? undefined : list;
};

export const validateActivitySearch = (
  search: Record<string, unknown>,
): ActivitySearch => ({
  preset:
    search.preset === "24h" ||
    search.preset === "7d" ||
    search.preset === "30d" ||
    search.preset === "90d" ||
    search.preset === "custom"
      ? search.preset
      : undefined,
  from:
    typeof search.from === "string" && isoDay.test(search.from)
      ? search.from
      : undefined,
  to:
    typeof search.to === "string" && isoDay.test(search.to)
      ? search.to
      : undefined,
  project: stringList(search.project),
  member: stringList(search.member),
  machine:
    search.machine === "cloud" || search.machine === "device"
      ? search.machine
      : undefined,
});

export const viewerTimeZone = () =>
  Intl.DateTimeFormat().resolvedOptions().timeZone;

const partsFormatters = new Map<string, Intl.DateTimeFormat>();

const zonedParts = (ms: number, timeZone: string) => {
  let format = partsFormatters.get(timeZone);
  if (format === undefined) {
    format = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    });
    partsFormatters.set(timeZone, format);
  }
  const parts = Object.fromEntries(
    format.formatToParts(new Date(ms)).map((part) => [part.type, part.value]),
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
};

const zoneOffset = (ms: number, timeZone: string) => {
  const p = zonedParts(ms, timeZone);
  const asUtc = Date.UTC(
    p.year,
    p.month - 1,
    p.day,
    p.hour,
    p.minute,
    p.second,
  );
  return asUtc - Math.floor(ms / 1000) * 1000;
};

const zonedMidnight = (
  year: number,
  month: number,
  day: number,
  timeZone: string,
) => {
  const guess = Date.UTC(year, month - 1, day);
  const first = guess - zoneOffset(guess, timeZone);
  return guess - zoneOffset(first, timeZone);
};

export const startOfDay = (ms: number, timeZone: string) => {
  const p = zonedParts(ms, timeZone);
  return zonedMidnight(p.year, p.month, p.day, timeZone);
};

export const addDays = (ms: number, days: number, timeZone: string) => {
  const p = zonedParts(ms, timeZone);
  return zonedMidnight(p.year, p.month, p.day + days, timeZone);
};

export const isoDate = (ms: number, timeZone: string) => {
  const p = zonedParts(ms, timeZone);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
};

const parseIsoDay = (value: string, timeZone: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return zonedMidnight(year ?? 1970, month ?? 1, day ?? 1, timeZone);
};

export const resolveRange = (
  search: ActivitySearch,
  now: Date,
  timeZone: string,
): ActivityRange => {
  const preset = search.preset ?? "30d";
  if (preset === "24h")
    return {
      preset,
      from: new Date(now.getTime() - dayMs),
      to: now,
      timeZone,
    };
  if (
    preset === "custom" &&
    search.from !== undefined &&
    search.to !== undefined
  ) {
    const [earlier, later] =
      search.from < search.to
        ? [search.from, search.to]
        : [search.to, search.from];
    const from = parseIsoDay(earlier, timeZone);
    const last = parseIsoDay(later, timeZone);
    return {
      preset,
      from: new Date(from),
      to: new Date(addDays(last, 1, timeZone)),
      timeZone,
    };
  }
  const days = presetDays[preset === "custom" ? "30d" : preset];
  return {
    preset: preset === "custom" ? "30d" : preset,
    from: new Date(addDays(now.getTime(), 1 - days, timeZone)),
    to: now,
    timeZone,
  };
};

export const dayBuckets = (
  range: Pick<ActivityRange, "from" | "to" | "timeZone">,
) => {
  const buckets: Array<{ start: Date }> = [];
  let start = startOfDay(range.from.getTime(), range.timeZone);
  while (start < range.to.getTime()) {
    buckets.push({ start: new Date(start) });
    start = addDays(start, 1, range.timeZone);
  }
  return buckets;
};

export const dayKey = (ms: number, timeZone: string) =>
  startOfDay(ms, timeZone);

export const seriesForRange = <T>(
  rows: ReadonlyArray<T>,
  range: ActivityRange,
  date: (row: T) => number,
  value: (row: T) => number,
) => {
  const byDay = new Map(
    rows.map((row) => [dayKey(date(row), range.timeZone), value(row)]),
  );
  return dayBuckets(range).map(({ start }) => byDay.get(start.getTime()) ?? 0);
};

export const formatCount = (value: number) => value.toLocaleString("en-US");

export const percentOf = (part: number, whole: number) =>
  whole === 0 ? undefined : Math.round((part / whole) * 100);

const tickSteps = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000];

export const niceTicks = (max: number) => {
  const step = tickSteps.find((candidate) => max / candidate <= 4) ?? 1000;
  const top = Math.max(step, Math.ceil(max / step) * step);
  return Array.from({ length: top / step + 1 }, (_, index) => index * step);
};

export const formatDuration = (ms: number) => {
  const minutes = Math.round(ms / 60_000);
  if (minutes < 1) return `${Math.round(ms / 1000)}s`;
  return `${minutes}m`;
};

export const formatAgentHours = (ms: number) =>
  ms === 0
    ? "0h"
    : ms < hourMs
      ? formatDuration(ms)
      : `${(ms / hourMs).toFixed(Number(ms < 10 * hourMs))}h`;

export const roundedHours = (ms: number) => Math.round((ms / hourMs) * 10) / 10;

export const formatTickDate = (value: string | number) =>
  new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

export const formatDayLabel = (value: string | number) =>
  new Date(value).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
