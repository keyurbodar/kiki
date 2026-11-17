import { useState } from "react";
import { MediaLightbox } from "@/components/media-lightbox";
import { SkeletonPanel } from "@/primitives/skeleton-panel";
import { useActiveOrgId, useFileUrl } from "./screenshot-url";

const track = (owner: string) => `features/thread/mobile-view.tsx#${owner}`;

const lightboxMediaClass =
  "max-h-[calc(100dvh-6rem-var(--lightbox-strip,0rem))] max-w-[calc(100vw-2*var(--lightbox-gutter,1.5rem))] rounded-(--radius-card) object-contain";

export type MobileScreenshot = { fileId: string; name?: string };

export type ScreenshotEntry = {
  key: string;
  label: string;
  kind: "image";
  file: MobileScreenshot;
};

export function screenshotEntries(
  screenshots: readonly MobileScreenshot[],
): ScreenshotEntry[] {
  const newestFirst = [...screenshots].reverse();
  return newestFirst.map((file, index) => ({
    key: file.fileId,
    label: `Screenshot ${newestFirst.length - index}`,
    kind: "image",
    file,
  }));
}

type ScreenshotImageProps = {
  jamId: string;
  file: MobileScreenshot;
  label: string;
};

function WithOrg({ render }: { render: (orgId: string) => React.ReactNode }) {
  const orgId = useActiveOrgId();
  return orgId === undefined ? null : render(orgId);
}

function ThumbnailImage({
  orgId,
  jamId,
  file,
  label,
}: ScreenshotImageProps & { orgId: string }) {
  const { url, mediaFailed } = useFileUrl(orgId, jamId, file.fileId);
  if (url === undefined) return null;
  return (
    <img
      src={url}
      crossOrigin="anonymous"
      alt={label}
      loading="lazy"
      decoding="async"
      draggable={false}
      className="absolute inset-0 size-full object-cover"
      onError={mediaFailed}
    />
  );
}

export function ScreenshotThumbnail(props: ScreenshotImageProps) {
  return (
    <WithOrg render={(orgId) => <ThumbnailImage orgId={orgId} {...props} />} />
  );
}

function ScreenshotSkeleton({ label }: { label: string }) {
  return (
    <SkeletonPanel
      className="h-96 w-48 max-w-full rounded-(--radius-card)"
      role="status"
      aria-label={`Loading ${label}`}
    />
  );
}

function LightboxImage({
  orgId,
  jamId,
  file,
  label,
}: ScreenshotImageProps & { orgId: string }) {
  const { url, mediaFailed } = useFileUrl(orgId, jamId, file.fileId);
  if (url === undefined) return <ScreenshotSkeleton label={label} />;
  return (
    <img
      src={url}
      crossOrigin="anonymous"
      alt={label}
      draggable={false}
      className={lightboxMediaClass}
      onError={mediaFailed}
    />
  );
}

export function ScreenshotMedia(props: ScreenshotImageProps) {
  const orgId = useActiveOrgId();
  if (orgId === undefined) return <ScreenshotSkeleton label={props.label} />;
  return <LightboxImage orgId={orgId} {...props} />;
}

export type ScreenshotHistoryProps = {
  jamId: string;
  screenshots: readonly MobileScreenshot[];
};

export function ScreenshotHistory({
  jamId,
  screenshots,
}: ScreenshotHistoryProps) {
  const [selected, setSelected] = useState<string | null>(null);
  if (screenshots.length === 0) return null;
  const entries = screenshotEntries(screenshots);
  const open = entries.find((entry) => entry.key === selected);
  return (
    <section
      aria-label="Screenshots"
      className="flex shrink-0 flex-col gap-2 border-t-hairline border-border-1 pt-3 pb-1"
    >
      <div className="flex items-baseline gap-1.5 px-3 text-xs">
        <span className="font-medium text-muted-foreground-1">Screenshots</span>
        <span className="text-muted-foreground-3 tabular-nums">
          {entries.length}
        </span>
      </div>
      <div className="flex gap-2 overflow-x-auto scroll-px-3 px-3 pb-2">
        {entries.map((entry) => (
          <button
            key={entry.key}
            data-track-owner={track("ScreenshotHistory:button.1")}
            type="button"
            aria-label={`Preview ${entry.label}`}
            onClick={() => setSelected(entry.key)}
            className="relative aspect-9/19 h-24 shrink-0 cursor-zoom-in overflow-hidden rounded-md border-hairline border-border-1 bg-background outline-none focus-visible:outline-ring-inset"
          >
            <ScreenshotThumbnail
              jamId={jamId}
              file={entry.file}
              label={entry.label}
            />
          </button>
        ))}
      </div>
      {open !== undefined && (
        <MediaLightbox
          role="dialog"
          aria-label={open.label}
          onKeyDown={(event) => {
            if (event.key === "Escape") setSelected(null);
          }}
        >
          <ScreenshotMedia jamId={jamId} file={open.file} label={open.label} />
        </MediaLightbox>
      )}
    </section>
  );
}
