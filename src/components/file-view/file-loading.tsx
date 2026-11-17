import { useEffect, useState } from "react";
import type { FileDownload } from "./file-content";
import { formatBytes } from "./file-kind";

const rows = [
  { id: "a", width: "w-3/5" },
  { id: "b", width: "w-4/5" },
  { id: "c", width: "w-2/3" },
  { id: "d", width: "w-3/4" },
  { id: "e", width: "w-1/2" },
  { id: "f", width: "w-4/5" },
  { id: "g", width: "w-3/5" },
  { id: "h", width: "w-2/3" },
];

export function FileLoading() {
  return (
    <div
      role="status"
      aria-label="Loading file"
      className="flex min-h-0 flex-1 flex-col gap-1 bg-card px-3 pt-2.5"
    >
      {rows.map(({ id, width }) => (
        <div key={id} className="flex h-4 items-center gap-3">
          <span className="h-2.5 w-4 shrink-0 animate-pulse rounded-sm bg-muted" />
          <span
            className={`h-2.5 animate-pulse rounded-sm bg-muted ${width}`}
          />
        </div>
      ))}
    </div>
  );
}

export const downloadProgressDelay = 600;

export const downloadFraction = ({ loaded, total }: FileDownload) =>
  total === undefined || total === 0 ? undefined : Math.min(1, loaded / total);

export const downloadLabel = ({ loaded, total }: FileDownload) =>
  total === undefined
    ? `Loading ${formatBytes(loaded)}`
    : `Loading ${formatBytes(loaded)} of ${formatBytes(total)}`;

export function DownloadProgress({ loaded, total }: FileDownload) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(
      () => setVisible(true),
      downloadProgressDelay,
    );
    return () => window.clearTimeout(timer);
  }, []);
  if (!visible) return null;
  const fraction = downloadFraction({ loaded, total });
  return (
    <div
      role="progressbar"
      aria-label="Downloading file"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={
        fraction === undefined ? undefined : Math.floor(fraction * 100)
      }
      className="flex h-7 shrink-0 items-center gap-3 border-b-hairline border-border-1 px-3 text-2xs text-muted-foreground-2 tabular-nums"
    >
      <span className="shrink-0">{downloadLabel({ loaded, total })}</span>
      <span className="relative h-1 max-w-48 min-w-16 flex-1 overflow-hidden rounded-full bg-muted">
        {fraction !== undefined && (
          <span
            className="absolute inset-y-0 left-0 rounded-full bg-progress"
            style={{ width: `${fraction * 100}%` }}
          />
        )}
      </span>
    </div>
  );
}
