const second = 1000;
const minute = 60 * second;
const hour = 60 * minute;
const day = 24 * hour;
const week = 7 * day;
const year = 365 * day;

/** Capy's relative time label: "just now", "23m ago", "1w ago", "in 2d". */
export function formatRelative(
  date: Date | number,
  options: { readonly now?: number; readonly minified?: boolean } = {},
) {
  const delta =
    (options.now ?? Date.now()) -
    (typeof date === "number" ? date : date.getTime());
  const abs = Math.abs(delta);
  if (abs < 5 * second) return options.minified ? "now" : "just now";
  const amount =
    abs < minute
      ? `${Math.floor(abs / second)}s`
      : abs < hour
        ? `${Math.floor(abs / minute)}m`
        : abs < day
          ? `${Math.floor(abs / hour)}h`
          : abs < week
            ? `${Math.floor(abs / day)}d`
            : abs < year
              ? `${Math.floor(abs / week)}w`
              : `${Math.floor(abs / year)}y`;
  if (options.minified) return amount;
  return delta < 0 ? `in ${amount}` : `${amount} ago`;
}

/** Capy's duration label for build steps: "850ms", "12s", "4m 3s". */
export function formatDuration(ms: number) {
  if (ms < second) return `${ms}ms`;
  const seconds = Math.round(ms / second);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest === 0 ? `${minutes}m` : `${minutes}m ${rest}s`;
}
