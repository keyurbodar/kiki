const second = 1000;
const minute = 60 * second;
const hour = 60 * minute;
const day = 24 * hour;
const week = 7 * day;
const year = 365 * day;

export type RelativeTimeOptions = {
  readonly now?: number;
  /** "41m" instead of "41m ago", "now" instead of "just now". */
  readonly minified?: boolean;
};

/** Capy's relative time: seconds, minutes, hours, days, weeks, then years. */
export function formatRelativeTime(
  date: Date | number,
  options?: RelativeTimeOptions,
) {
  const delta =
    (options?.now ?? Date.now()) -
    (typeof date === "number" ? date : date.getTime());
  const minified = options?.minified === true;
  const size = Math.abs(delta);
  if (size < 5 * second) return minified ? "now" : "just now";
  const short =
    size < minute
      ? `${Math.floor(size / second)}s`
      : size < hour
        ? `${Math.floor(size / minute)}m`
        : size < day
          ? `${Math.floor(size / hour)}h`
          : size < week
            ? `${Math.floor(size / day)}d`
            : size < year
              ? `${Math.floor(size / week)}w`
              : `${Math.floor(size / year)}y`;
  if (minified) return short;
  return delta < 0 ? `in ${short}` : `${short} ago`;
}

const sameYearFormat = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const otherYearFormat = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

/** The full timestamp a tooltip or the inspector shows; the year only when it isn't this year. */
export function formatTimestamp(
  date: Date,
  options?: { readonly now?: number },
) {
  const thisYear = new Date(options?.now ?? Date.now()).getFullYear();
  return (
    date.getFullYear() === thisYear ? sameYearFormat : otherYearFormat
  ).format(date);
}
