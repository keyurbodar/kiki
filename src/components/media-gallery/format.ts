/** Capy's byte formatter (`shared/format`): "512 B", "26 KB", "1.5 MB". */
export const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  const unit = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)) - 1,
    units.length - 1,
  );
  const value = bytes / 1024 ** (unit + 1);
  return `${value >= 10 ? Math.round(value) : value.toFixed(1)} ${units[unit]}`;
};

/** The short label a file card shows for its type: "PNG", "CSV", "PDF". */
export const fileKindLabel = (file: { name: string; mediaType: string }) =>
  (file.name.includes(".")
    ? file.name.split(".").at(-1)?.toUpperCase()
    : undefined) ||
  file.mediaType.split("/").at(-1) ||
  "file";

/** Milliseconds as the player's clock: "0:07", "12:31". */
export const formatDuration = (milliseconds: number) => {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
};
