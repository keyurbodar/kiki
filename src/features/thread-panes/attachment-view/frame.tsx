import { cx } from "class-variance-authority";
import type { ReactNode } from "react";
import {
  DownloadGlyph,
  LinkGlyph,
  MediaSkeletonRow,
} from "@/components/media-gallery";
import { Button } from "@/primitives/button";
import { toast } from "@/primitives/toaster";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";

const track = (owner: string) =>
  `features/thread/pane/attachment-view.tsx#${owner}`;

export function copyWithToast(value: string, noun: string, title: string) {
  return navigator.clipboard.writeText(value).then(
    () => toast.success(title, { description: value }),
    () =>
      toast.error(noun === "" ? "Could not copy" : `Could not copy ${noun}`),
  );
}

export type PaneEmptyStateProps = {
  line: string;
  sub?: string;
  action?: ReactNode;
};

export function PaneEmptyState({ line, sub, action }: PaneEmptyStateProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-1 bg-card px-6 py-8 text-center">
      <p className="text-sm font-medium text-foreground">{line}</p>
      {sub !== undefined && (
        <p className="text-xs text-muted-foreground-2">{sub}</p>
      )}
      {action !== undefined && <div className="pt-2">{action}</div>}
    </div>
  );
}

export function RetryButton({
  onRetry,
  owner,
}: {
  onRetry: () => void;
  owner: string;
}) {
  return (
    <Button
      data-track-owner={owner}
      variant="ghost"
      size="xs"
      onClick={onRetry}
    >
      Retry
    </Button>
  );
}

const loadingWidths = [
  "w-2/5",
  "w-3/5",
  "w-1/4",
  "w-1/2",
  "w-2/3",
  "w-1/3",
  "w-1/2",
  "w-1/5",
];

export function PaneLoading() {
  return (
    <div
      role="status"
      aria-label="Loading file"
      className="flex min-h-0 flex-1 flex-col gap-1 bg-card px-3 pt-2.5"
    >
      {loadingWidths.map((width, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: fixed skeleton rows never reorder
        <MediaSkeletonRow key={index} width={width} />
      ))}
    </div>
  );
}

export type AttachmentFrameProps = {
  name: string;
  meta: string;
  path?: string;
  leading?: ReactNode;
  copyPath?: string | false;
  download?: boolean;
  onDownload?: () => void;
  actions?: ReactNode;
  children: ReactNode;
};

export function AttachmentFrame({
  name,
  meta,
  path,
  leading,
  copyPath = false,
  download = false,
  onDownload,
  actions,
  children,
}: AttachmentFrameProps) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col contain-inline-size">
      <div className="flex h-9 shrink-0 items-center gap-1.5 border-b-hairline border-border-1 px-2">
        {leading}
        <span className="flex min-w-0 flex-1 items-baseline gap-1.5">
          <span
            title={path}
            className="min-w-0 truncate text-xs font-medium text-foreground"
          >
            {name}
          </span>
          <span className="shrink-0 text-2xs text-muted-foreground-2">
            {meta}
          </span>
        </span>
        {copyPath !== false && (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  data-track-owner={track("AttachmentFrame:Button[Copy path]")}
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Copy path"
                  onClick={() =>
                    void copyWithToast(copyPath, "path", "Path copied")
                  }
                />
              }
            >
              <LinkGlyph className="size-(--icon-sm)" />
            </TooltipTrigger>
            <TooltipContent side="bottom">Copy path</TooltipContent>
          </Tooltip>
        )}
        {download && (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  data-track-owner={track("AttachmentFrame:Button[Download]")}
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Download"
                  disabled={onDownload === undefined}
                  onClick={onDownload}
                />
              }
            >
              <DownloadGlyph className="size-(--icon-sm)" />
            </TooltipTrigger>
            <TooltipContent side="bottom">Download</TooltipContent>
          </Tooltip>
        )}
        {actions}
      </div>
      <div className={cx("flex min-h-0 min-w-0 flex-1 flex-col")}>
        {children}
      </div>
    </div>
  );
}

export type AttachmentContent =
  | {
      kind: "media";
      media: "image" | "video" | "audio";
      url: string;
      label: string;
      onFailed?: () => void;
    }
  | { kind: "gated"; sizeBytes: number; onLoad: () => void }
  | { kind: "text"; text: string }
  | { kind: "no_preview" };

export const looksBinary = (text: string) => text.slice(0, 8192).includes("\0");

export function textContent(text: string): AttachmentContent {
  return looksBinary(text) ? { kind: "no_preview" } : { kind: "text", text };
}

export function AttachmentBody({
  content,
  sizeLabel,
}: {
  content: AttachmentContent;
  sizeLabel: (bytes: number) => string;
}) {
  switch (content.kind) {
    case "media":
      return (
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-card p-4">
          {content.media === "image" ? (
            <img
              src={content.url}
              crossOrigin="anonymous"
              alt={content.label}
              className="max-h-full max-w-full rounded-(--radius-card) object-contain"
              onError={content.onFailed}
            />
          ) : content.media === "video" ? (
            // biome-ignore lint/a11y/useMediaCaption: attachments carry no caption track
            <video
              src={content.url}
              crossOrigin="anonymous"
              aria-label={content.label}
              controls
              playsInline
              className="max-h-full max-w-full rounded-(--radius-card)"
              onError={content.onFailed}
            />
          ) : (
            // biome-ignore lint/a11y/useMediaCaption: attachments carry no caption track
            <audio
              src={content.url}
              crossOrigin="anonymous"
              aria-label={content.label}
              controls
              onError={content.onFailed}
            />
          )}
        </div>
      );
    case "gated":
      return (
        <PaneEmptyState
          line={`${sizeLabel(content.sizeBytes)} file`}
          action={
            <Button
              data-track-owner="shared/files/file-view.tsx#FileBody:Button[Load anyway]"
              variant="ghost"
              size="xs"
              onClick={content.onLoad}
            >
              Load anyway
            </Button>
          }
        />
      );
    case "text":
      return (
        <pre className="min-h-0 flex-1 overflow-auto bg-card px-3 py-2.5 font-mono text-xs whitespace-pre-wrap text-foreground">
          {content.text}
        </pre>
      );
    case "no_preview":
      return <PaneEmptyState line="No preview" />;
  }
}
