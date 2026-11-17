import type { ComponentProps } from "react";
import { MediaSpinner, ProgressRing } from "@/components/media-gallery";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";

const track = (owner: string) =>
  `features/settings/background-appearance.tsx#UploadStatus:${owner}`;

export type BackgroundUploadPhase =
  | "preparing"
  | "uploading"
  | "saving"
  | "failed";

export type BackgroundUploadState = {
  phase: BackgroundUploadPhase;
  progress: number;
  image: { blob: Blob } | null;
};

export type BackgroundUpload = {
  state: BackgroundUploadState | null;
  cancel: () => void;
  retry: () => void;
  dismiss: () => void;
};

export const formatUploadSize = (bytes: number) =>
  bytes < 1048576
    ? `${Math.round(bytes / 1024)}KB`
    : `${(bytes / 1024 / 1024).toFixed(1)}MB`;

export function uploadStatusLabel(state: BackgroundUploadState) {
  return state.phase === "preparing"
    ? "Preparing"
    : state.phase === "uploading"
      ? `Uploading ${state.progress}%`
      : state.phase === "saving"
        ? "Saving"
        : "Upload failed";
}

export function uploadStatusDetail(
  state: BackgroundUploadState,
  hadBackground: boolean,
) {
  const size = state.image?.blob.size ?? 0;
  if (state.phase === "uploading")
    return `${formatUploadSize((size * state.progress) / 100)} of ${formatUploadSize(size)}`;
  if (state.phase === "failed")
    return hadBackground ? "Kept the previous image" : "Nothing changed";
  return undefined;
}

export type BackgroundUploadStatusProps = ComponentProps<"div"> & {
  upload?: BackgroundUpload;
  hadBackground?: boolean;
};

export function BackgroundUploadStatus({
  upload,
  hadBackground = false,
  className,
  ...props
}: BackgroundUploadStatusProps) {
  const state = upload?.state ?? null;
  if (upload === undefined || state === null) return null;
  const label = uploadStatusLabel(state);
  const detail = uploadStatusDetail(state, hadBackground);
  return (
    <div
      data-slot="background-upload-status"
      className={[
        "relative flex w-full max-w-xs items-center gap-3 rounded-(--radius-card) border-hairline border-border-2 bg-popover p-3 shadow-overlay",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      <span className="flex size-5 shrink-0 items-center justify-center text-muted-foreground-1">
        {state.phase === "uploading" ? (
          <ProgressRing value={state.progress} label="Upload progress" />
        ) : state.phase === "failed" ? (
          <Icon name="exclamation-circle" className="text-destructive" />
        ) : (
          <MediaSpinner role="img" label={label} />
        )}
      </span>
      <div role="status" className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm font-medium tabular-nums">
          {label}
        </span>
        {detail !== undefined && (
          <span className="truncate text-sm text-muted-foreground-2 tabular-nums">
            {detail}
          </span>
        )}
      </div>
      {state.phase === "preparing" || state.phase === "uploading" ? (
        <Button
          data-track-owner={track("Button[Cancel]")}
          variant="ghost"
          size="sm"
          onClick={upload.cancel}
        >
          Cancel
        </Button>
      ) : state.phase === "failed" ? (
        <div className="flex items-center gap-1">
          <Button
            data-track-owner={track("Button[Retry]")}
            size="sm"
            onClick={upload.retry}
          >
            Retry
          </Button>
          <Button
            data-track-owner={track("Button[Dismiss]")}
            variant="ghost"
            size="icon-sm"
            aria-label="Dismiss"
            onClick={upload.dismiss}
          >
            <Icon name="x" />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
