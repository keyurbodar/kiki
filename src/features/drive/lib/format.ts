const kib = 1024;
const gib = kib ** 3;

/** Capy's byte formatter: "0 B", "31 KB", "226 MB", 1024-based. */
export function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < kib) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(kib)) - 1,
    units.length - 1,
  );
  const value = bytes / kib ** (index + 1);
  return `${value >= 10 ? Math.round(value) : value.toFixed(1)} ${units[index]}`;
}

/** The usage footer's "0.2 GB": tenths of a GB, rounded up only when full. */
export function formatUsedStorage(bytes: number, full: boolean) {
  if (bytes < gib / 10) return formatBytes(bytes);
  const round = full ? Math.round : Math.floor;
  return `${round((bytes / gib) * 10) / 10} GB`;
}

const second = 1000;
const minute = 60 * second;
const hour = 60 * minute;
const day = 24 * hour;
const week = 7 * day;
const year = 365 * day;

/** Capy's relative time: "just now", "44m ago", "1d ago", "in 3h". */
export function formatRelativeTime(
  time: Date | number,
  options?: { now?: number; minified?: boolean },
) {
  const delta =
    (options?.now ?? Date.now()) -
    (typeof time === "number" ? time : time.getTime());
  const minified = options?.minified === true;
  const abs = Math.abs(delta);
  if (abs < 5 * second) return minified ? "now" : "just now";
  const short =
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
  if (minified) return short;
  return delta < 0 ? `in ${short}` : `${short} ago`;
}
