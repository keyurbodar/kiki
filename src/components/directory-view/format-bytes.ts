export function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)) - 1,
    units.length - 1,
  );
  const value = bytes / 1024 ** (index + 1);
  return `${value >= 10 ? Math.round(value) : value.toFixed(1)} ${units[index]}`;
}

export const fileCountLabel = (count: number) =>
  `${count} ${count === 1 ? "file" : "files"}`;
