const minute = 60_000;
const hour = 60 * minute;
const day = 24 * hour;
const week = 7 * day;
const year = 365 * day;

/**
 * Capy's minified relative time for overview rows: "now", "5m", "11h", "3d",
 * "2w", "1y".
 */
export function formatAgoMinified(date: Date, now: Date): string {
  const elapsed = Math.max(0, now.getTime() - date.getTime());
  if (elapsed < minute) return "now";
  if (elapsed < hour) return `${Math.floor(elapsed / minute)}m`;
  if (elapsed < day) return `${Math.floor(elapsed / hour)}h`;
  if (elapsed < week) return `${Math.floor(elapsed / day)}d`;
  if (elapsed < year) return `${Math.floor(elapsed / week)}w`;
  return `${Math.floor(elapsed / year)}y`;
}
