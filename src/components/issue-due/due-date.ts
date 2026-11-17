/** A calendar day as `YYYY-MM-DD`, always read in UTC. */
export type IssueDay = string;

const dayMs = 24 * 60 * 60 * 1000;
const lastDay = Date.UTC(9999, 11, 31);

export const parseDay = (day: IssueDay) => new Date(`${day}T00:00:00Z`);

export const toDay = (date: Date): IssueDay => date.toISOString().slice(0, 10);

/** True for a real calendar date from year 1000 on. */
export const isValidDay = (day: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || day < "1000-01-01") return false;
  const date = parseDay(day);
  return !Number.isNaN(date.getTime()) && toDay(date) === day;
};

export const addDays = (day: IssueDay, days: number) =>
  toDay(new Date(parseDay(day).getTime() + days * dayMs));

/** Shifts a `YYYY-MM` month by whole months. */
export const addMonths = (month: string, months: number) => {
  const first = parseDay(`${month}-01`);
  return toDay(
    new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + months, 1)),
  ).slice(0, 7);
};

/** The coming Sunday, or the day itself when it is one. */
export const endOfWeek = (day: IssueDay) => {
  const date = parseDay(day);
  return toDay(
    new Date(
      Math.min(date.getTime() + ((7 - date.getUTCDay()) % 7) * dayMs, lastDay),
    ),
  );
};

export const isOverdue = (
  due: IssueDay | undefined,
  today: IssueDay,
  closed: boolean,
) => !closed && due !== undefined && due < today;

const format = (options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(undefined, { ...options, timeZone: "UTC" });

export const dueFormats = {
  short: format({ month: "short", day: "numeric" }),
  shortYear: format({ month: "short", day: "numeric", year: "numeric" }),
  long: format({ month: "long", day: "numeric", year: "numeric" }),
  preset: format({ weekday: "short", month: "short", day: "numeric" }),
  month: format({ month: "long", year: "numeric" }),
  cell: format({ weekday: "long", month: "long", day: "numeric" }),
};

export const formatDay = (day: IssueDay, formatter: Intl.DateTimeFormat) =>
  formatter.format(parseDay(day));

/** Today, Tomorrow or Yesterday, else a short date with the year when it differs. */
export const relativeDueLabel = (due: IssueDay, today: IssueDay) => {
  const days = Math.round(
    (parseDay(due).getTime() - parseDay(today).getTime()) / dayMs,
  );
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  return formatDay(
    due,
    due.slice(0, 4) === today.slice(0, 4)
      ? dueFormats.short
      : dueFormats.shortYear,
  );
};

/** The label of a due-date range filter. */
export const dueRangeLabel = (from: IssueDay | null, to: IssueDay | null) => {
  const label = (day: IssueDay) =>
    formatDay(
      day,
      from !== null && to !== null && from.slice(0, 4) === to.slice(0, 4)
        ? dueFormats.short
        : dueFormats.shortYear,
    );
  if (from !== null && to !== null)
    return from === to ? label(from) : `${label(from)} – ${label(to)}`;
  if (from !== null) return `From ${label(from)}`;
  if (to !== null) return `Until ${label(to)}`;
  return "";
};

/** Every day shown for a month, Monday first, padded to whole weeks. */
export const monthGrid = (month: string): ReadonlyArray<IssueDay> => {
  const first = `${month}-01`;
  const lead = (parseDay(first).getUTCDay() + 6) % 7;
  const length = Math.round(
    (parseDay(`${addMonths(month, 1)}-01`).getTime() -
      parseDay(first).getTime()) /
      dayMs,
  );
  return Array.from({ length: Math.ceil((lead + length) / 7) * 7 }, (_, i) =>
    addDays(first, i - lead),
  );
};

export const duePresets = (today: IssueDay) =>
  [
    { label: "Today", date: today },
    { label: "Tomorrow", date: addDays(today, 1) },
    { label: "End of this week", date: endOfWeek(today) },
    { label: "In one week", date: addDays(today, 7) },
  ].filter((preset) => isValidDay(preset.date));

/** The order a range ends up in after picking two days in either order. */
export const orderRange = (
  first: IssueDay,
  second: IssueDay,
): [IssueDay, IssueDay] => (second < first ? [second, first] : [first, second]);
