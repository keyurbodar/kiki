const DAY_MS = 86_400_000;

const time = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});
const weekdayTime = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  hour: "numeric",
  minute: "2-digit",
});
const sameYear = new Intl.DateTimeFormat(undefined, {
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

export function formatMessageStamp(date: Date, now = Date.now()): string {
  const today = new Date(now);
  if (date.toDateString() === today.toDateString()) return time.format(date);
  const yesterday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - 1,
  );
  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday ${time.format(date)}`;
  }
  if (now - date.getTime() < 6 * DAY_MS) return weekdayTime.format(date);
  return (
    date.getFullYear() === today.getFullYear() ? sameYear : otherYear
  ).format(date);
}
