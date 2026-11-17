const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const time = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});
const weekdayTime = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  hour: "numeric",
  minute: "2-digit",
});
const dateTime = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});
const yearDateTime = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

/** Capy's chat stamp label: time today, "Yesterday" plus time, weekday within six days, then the date. */
export function formatStamp(at: Date, now: number = Date.now()): string {
  const today = new Date(now);
  if (at.toDateString() === today.toDateString()) return time.format(at);
  const yesterday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - 1,
  );
  if (at.toDateString() === yesterday.toDateString()) {
    return `Yesterday ${time.format(at)}`;
  }
  if (now - at.getTime() < 6 * DAY) return weekdayTime.format(at);
  return (
    at.getFullYear() === today.getFullYear() ? dateTime : yearDateTime
  ).format(at);
}

export const STAMP_GAP = HOUR;
