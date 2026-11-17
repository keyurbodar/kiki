import type { ReactNode } from "react";

export type PreviewNoticeStatus =
  | "loading"
  | "asleep"
  | "failed"
  | "too-large"
  | "unavailable";

export const previewNoticeText = (
  status: "failed" | "too-large" | "unavailable",
  hasDetail: boolean,
) =>
  status === "failed"
    ? hasDetail
      ? "Could not render this diff"
      : "File did not load"
    : status === "too-large"
      ? "File is too large to preview"
      : "Preview unavailable";

export type AsleepNotice = {
  line: ReactNode;
  sub?: ReactNode;
  action?: ReactNode;
};

export type PreviewNoticeProps = {
  status: PreviewNoticeStatus;
  errorHref?: string;
  detail?: string;
  asleep?: AsleepNotice;
};

export function PreviewNotice({
  status,
  errorHref,
  detail,
  asleep,
}: PreviewNoticeProps) {
  if (status === "loading")
    return (
      <div className="w-full">
        <div
          data-slot="skeleton"
          aria-hidden
          className="h-24 w-full animate-skeleton-pulse rounded-(--radius) bg-secondary"
        />
      </div>
    );
  if (status === "asleep")
    return (
      <div className="flex h-24 flex-col items-center justify-center gap-2 px-3 font-sans text-xs text-muted-foreground-2">
        <span>{asleep?.line}</span>
        {asleep?.sub !== undefined && (
          <span className="max-w-xs text-center text-balance text-muted-foreground-3">
            {asleep.sub}
          </span>
        )}
        {asleep?.action}
      </div>
    );
  return (
    <div className="diff-preview-notice">
      <p>
        {previewNoticeText(
          status === "failed" || status === "too-large"
            ? status
            : "unavailable",
          detail !== undefined,
        )}
        {errorHref !== undefined && (
          <>
            {", "}
            <a
              href={errorHref}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              view on GitHub
            </a>
          </>
        )}
      </p>
      {detail !== undefined && <pre>{detail}</pre>}
    </div>
  );
}
