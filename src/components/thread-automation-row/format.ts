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

/** A date and time, with the year only when it isn't the current one. */
export const formatDateTime = (date: Date, now: number) =>
  (date.getFullYear() === new Date(now).getFullYear()
    ? sameYear
    : otherYear
  ).format(date);
