export type DateRangePreset = "today" | "week" | "month" | "older";

export type CustomDateRange = {
  readonly kind: "custom";
  readonly from: string;
  readonly to: string;
};

export type DateRange = DateRangePreset | CustomDateRange;

export type DateBounds = { readonly after?: Date; readonly before?: Date };

export const dateRangePresets: ReadonlyArray<DateRangePreset> = [
  "today",
  "week",
  "month",
  "older",
];

export const dateRangePresetLabels: Record<DateRangePreset, string> = {
  today: "Today",
  week: "Last week",
  month: "Last month",
  older: "Older",
};

const hour = 60 * 60 * 1000;
const day = 24 * hour;
const isoDay = /^\d{4}-\d{2}-\d{2}$/u;

export const isCustomDateRange = (range: DateRange): range is CustomDateRange =>
  typeof range !== "string";

export const isIsoDay = (value: string) => isoDay.test(value);

const parseDay = (value: string) => {
  if (!isIsoDay(value)) return undefined;
  const [year = 0, month = 1, date = 1] = value.split("-").map(Number);
  const parsed = new Date(year, month - 1, date);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

export const customDateBounds = (
  from: string,
  to: string,
): { after: Date; before: Date } | undefined => {
  const start = parseDay(from <= to ? from : to);
  const end = parseDay(from <= to ? to : from);
  if (start === undefined || end === undefined) return undefined;
  const before = new Date(end);
  before.setHours(23, 59, 59, 999);
  return { after: start, before };
};

export const formatDay = (value: string, now: number = Date.now()) => {
  const parsed = parseDay(value);
  if (parsed === undefined) return value;
  const sameYear = parsed.getFullYear() === new Date(now).getFullYear();
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
};

export const dateRangeLabel = (range: DateRange, now: number = Date.now()) => {
  if (!isCustomDateRange(range)) return dateRangePresetLabels[range];
  const from = range.from <= range.to ? range.from : range.to;
  const to = range.from <= range.to ? range.to : range.from;
  const start = formatDay(from, now);
  return from === to ? start : `${start} to ${formatDay(to, now)}`;
};

export const matchesDateRange = (
  date: Date,
  range: DateRange,
  now: number = Date.now(),
) => {
  if (isCustomDateRange(range)) {
    const bounds = customDateBounds(range.from, range.to);
    if (bounds === undefined) return false;
    const time = date.getTime();
    return time >= bounds.after.getTime() && time <= bounds.before.getTime();
  }
  const age = now - date.getTime();
  switch (range) {
    case "today":
      return date.getTime() >= new Date(now).setHours(0, 0, 0, 0);
    case "week":
      return age < 7 * day;
    case "month":
      return age < 30 * day;
    case "older":
      return age >= 30 * day;
  }
};

export const dateRangeBounds = (
  range: DateRange,
  now: number = Date.now(),
): DateBounds => {
  const hourFloor = Math.floor(now / hour) * hour;
  if (isCustomDateRange(range))
    return customDateBounds(range.from, range.to) ?? {};
  if (range === "older") return { before: new Date(hourFloor - 30 * day) };
  if (range === "today")
    return { after: new Date(new Date(now).setHours(0, 0, 0, 0)) };
  return { after: new Date(hourFloor - (range === "week" ? 7 : 30) * day) };
};

export const newSavedViewId = () => `view_${crypto.randomUUID()}`;
