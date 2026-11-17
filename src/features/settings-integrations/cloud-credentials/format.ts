const day = 24 * 60 * 60 * 1000;

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
const timeOnly = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});
const weekdayTime = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  hour: "numeric",
  minute: "2-digit",
});

export const formatDateTime = (date: Date, now = new Date()) =>
  (date.getFullYear() === now.getFullYear() ? sameYear : otherYear).format(
    date,
  );

export const formatRecent = (date: Date, now = new Date()) => {
  if (date.toDateString() === now.toDateString()) return timeOnly.format(date);
  const yesterday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 1,
  );
  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday ${timeOnly.format(date)}`;
  }
  return now.getTime() - date.getTime() < 6 * day
    ? weekdayTime.format(date)
    : formatDateTime(date, now);
};
