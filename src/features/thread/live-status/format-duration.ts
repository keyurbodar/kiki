const SECOND = 1000;

export type DurationStyle = "summary" | "latency";

export function formatDuration(ms: number, style: DurationStyle = "summary") {
  if (!Number.isFinite(ms) || ms < 0) return "—";
  if (style === "latency") {
    if (ms < SECOND) return `${Math.round(ms)}ms`;
    if (ms < 60 * SECOND)
      return `${(ms / SECOND).toFixed(ms >= 10 * SECOND ? 1 : 2)}s`;
  }
  const seconds = Math.max(1, Math.ceil(ms / SECOND));
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const rest = seconds % 60;
    return rest === 0 ? `${minutes}m` : `${minutes}m ${rest}s`;
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}
