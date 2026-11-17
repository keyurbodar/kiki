const units = ["B", "KB", "MB", "GB", "TB"] as const;

export function formatBytes(bytes: number, forceUnit?: number) {
  let value = Math.max(0, bytes);
  let unit = forceUnit ?? 0;
  while (forceUnit === undefined && value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  const digits = unit >= 1 && value < 10 ? 1 : 0;
  return `${value.toFixed(digits)} ${units[unit]}`;
}

/** The drive footer's "0.2 GB of 10 GB" line and the bar's width in percent. */
export function formatUsage(usedBytes: number, capacityBytes: number) {
  const capacity = Math.max(1, capacityBytes);
  const percent = Math.min(100, (Math.max(0, usedBytes) / capacity) * 100);
  return {
    label: `${formatBytes(usedBytes / 1024 ** 3, 3)} of ${formatBytes(capacityBytes)}`,
    percent: Number(percent.toFixed(3)),
  };
}
