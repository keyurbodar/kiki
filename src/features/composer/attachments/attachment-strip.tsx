import { cx } from "class-variance-authority";
import { useState } from "react";
import { Button } from "@/primitives/button";
import { DotGridIcon } from "@/primitives/dot-grid-icon";
import { AttachmentPreview, type PreviewItem } from "./attachment-preview";
import { type AttachmentEntry, statusLabel } from "./attachments";
import { FileIcon } from "./file-icon";
import { CrossMediumIcon } from "./icons";
import { ProgressRing } from "./progress-ring";

export type AttachmentStripProps = {
  entries: ReadonlyArray<AttachmentEntry>;
  onRemove: (localId: string) => void;
};

const previewItem = (entry: AttachmentEntry): PreviewItem | undefined => {
  if (entry.mediaType.startsWith("video/") && entry.original !== undefined)
    return {
      key: entry.localId,
      label: entry.name,
      kind: "video",
      file: entry.original,
    };
  if (!entry.mediaType.startsWith("image/") || entry.previewUrl === undefined)
    return undefined;
  return {
    key: entry.localId,
    label: entry.name,
    kind: "image",
    url: entry.previewUrl,
  };
};

function Thumbnail({ entry }: { entry: AttachmentEntry }) {
  const { status } = entry;
  if (status.phase === "uploading") {
    if (status.progress === undefined || status.progress === 100)
      return (
        <span
          role="status"
          aria-label={`${status.progress === 100 ? "Finishing" : "Preparing"} upload: ${entry.name}`}
        >
          <DotGridIcon size="base" />
        </span>
      );
    return (
      <ProgressRing value={status.progress} label={`Uploading ${entry.name}`} />
    );
  }
  if (entry.previewUrl === undefined)
    return <FileIcon name={entry.name} className="size-(--icon-base)" />;
  return (
    <img
      crossOrigin="anonymous"
      src={entry.previewUrl}
      alt={entry.name}
      className="size-full object-cover"
    />
  );
}

/** The chips under the composer editor: one per attached file. */
export function AttachmentStrip({ entries, onRemove }: AttachmentStripProps) {
  const [previewKey, setPreviewKey] = useState<string | null>(null);
  if (entries.length === 0) return null;
  const previewable = entries.flatMap((entry) => {
    const item = previewItem(entry);
    return item === undefined ? [] : [item];
  });
  const previewIndex = previewable.findIndex((item) => item.key === previewKey);

  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-2">
      {entries.map((entry) => {
        const canPreview = previewable.some(
          (item) => item.key === entry.localId,
        );
        const Content = canPreview ? "button" : "div";
        const failed = entry.status.phase === "failed";
        return (
          <div
            key={entry.localId}
            className="flex h-12 w-60 max-w-full items-center gap-2 rounded-(--radius-card) border-(length:--border-width-hairline) border-border-2 bg-button py-1.5 pr-1 pl-1.5 shadow-plate"
          >
            <Content
              type={canPreview ? "button" : undefined}
              aria-label={canPreview ? `Preview ${entry.name}` : undefined}
              onClick={
                canPreview ? () => setPreviewKey(entry.localId) : undefined
              }
              className={cx(
                "flex min-w-0 flex-1 items-center gap-2 text-left",
                canPreview &&
                  "cursor-zoom-in rounded-(--radius) outline-none focus-visible:outline-ring-inset",
              )}
            >
              <span className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-(--radius) bg-secondary text-icon-muted">
                <Thumbnail entry={entry} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="mask-fade-r overflow-hidden text-sm font-medium whitespace-nowrap [--mask-fade-ramp:calc(var(--spacing)*2)]">
                  {entry.name}
                </span>
                <span
                  title={
                    entry.status.phase === "failed"
                      ? entry.status.message
                      : undefined
                  }
                  className={cx(
                    "truncate text-2xs tabular-nums",
                    failed ? "text-destructive" : "text-muted-foreground-2",
                  )}
                >
                  {statusLabel(entry)}
                </span>
              </span>
            </Content>
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={`Remove ${entry.name}`}
              className="shrink-0"
              onClick={() => onRemove(entry.localId)}
            >
              <CrossMediumIcon />
            </Button>
          </div>
        );
      })}
      {previewIndex >= 0 && (
        <AttachmentPreview
          items={previewable}
          index={previewIndex}
          onIndexChange={(index) =>
            setPreviewKey(previewable[index]?.key ?? null)
          }
          onClose={() => setPreviewKey(null)}
        />
      )}
    </div>
  );
}
