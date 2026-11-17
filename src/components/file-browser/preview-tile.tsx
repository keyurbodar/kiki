import { cx } from "class-variance-authority";
import { Fragment, type ReactNode, useEffect, useRef, useState } from "react";
import { Card } from "@/primitives/card";
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@/primitives/collapsible";
import { Icon } from "@/primitives/icon";
import { type BrowserFile, baseName, parentPath } from "./file-index";
import type { PreviewContentValue, PreviewSize } from "./passive-preview";
import { PreviewContent, PreviewSkeleton } from "./preview-content";
import { useRecentCollapsed } from "./tree-state";

export const eagerPreviews = 2;

export const canLoadPreview = (position: number, settled: number) =>
  position < eagerPreviews || settled >= position - eagerPreviews + 1;

export type PassivePreview<F extends BrowserFile> = (
  file: F,
) => PreviewContentValue | undefined;

export type LivePreview<F extends BrowserFile> = (
  file: F,
  onSettled: () => void,
  size: PreviewSize,
) => ReactNode;

export type OpenFile = (path: string, inTab?: boolean) => void;

export type PreviewTileProps<F extends BrowserFile> = {
  file: F;
  caption: ReactNode;
  canLoad: boolean;
  passive: PassivePreview<F>;
  preview: LivePreview<F>;
  onSettled: () => void;
  onOpen: (inTab: boolean) => void;
  size?: PreviewSize;
  className?: string;
};

export function PreviewTile<F extends BrowserFile>({
  file,
  caption,
  canLoad,
  passive,
  preview,
  onSettled,
  onOpen,
  size = "shelf",
  className,
}: PreviewTileProps<F>) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (visible || element === null) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) setVisible(true);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [visible]);
  const name = baseName(file.path);
  const content = passive(file);
  const hasPassive = content !== undefined;
  useEffect(() => {
    if (hasPassive) onSettled();
  }, [hasPassive, onSettled]);

  return (
    <article className={cx("flex min-w-0 flex-col", className)}>
      <Card
        ref={ref}
        variant="interactive"
        className={cx(
          "relative aspect-[3/4] w-full rounded-(--radius)",
          "focus-within:outline-ring-inset",
        )}
      >
        <div className="absolute inset-0" data-preview-size={size}>
          {content === undefined ? (
            visible ? (
              canLoad ? (
                preview(file, onSettled, size)
              ) : (
                <PreviewSkeleton />
              )
            ) : null
          ) : (
            <PreviewContent content={content} name={name} size={size} />
          )}
        </div>
        <button
          data-track-owner="shared/files/file-browser.tsx#PreviewTile:button.1"
          type="button"
          aria-label={`Open ${file.path}`}
          className="absolute inset-0 cursor-pointer rounded-[inherit] outline-none"
          onClick={(event) => onOpen(event.metaKey || event.ctrlKey)}
        />
      </Card>
      <div
        className={cx(
          "truncate pt-1.5 text-foreground",
          size === "index" ? "text-2xs" : "text-xs",
        )}
      >
        {name}
      </div>
      <div className="min-h-4 truncate pt-0.5 text-2xs text-muted-foreground-3">
        {caption}
      </div>
    </article>
  );
}

export type TileStripProps<F extends BrowserFile> = {
  files: ReadonlyArray<F>;
  size?: PreviewSize;
  passive: PassivePreview<F>;
  preview: LivePreview<F>;
  onOpen: OpenFile;
  wrapTile?: (file: F, tile: ReactNode) => ReactNode;
  trailing?: ReactNode;
  className?: string;
};

export function TileStrip<F extends BrowserFile>({
  files,
  size = "shelf",
  passive,
  preview,
  onOpen,
  wrapTile,
  trailing,
  className,
}: TileStripProps<F>) {
  const [settled, setSettled] = useState<ReadonlySet<string>>(() => new Set());
  return (
    <div
      className={cx(
        "flex snap-x overflow-x-auto px-4 pb-1 scroll-px-4",
        size === "index" ? "gap-2.5" : "gap-3",
        className,
      )}
    >
      {files.map((file, position) => {
        const tile = (
          <PreviewTile
            file={file}
            caption={parentPath(file.path)}
            canLoad={canLoadPreview(position, settled.size)}
            passive={passive}
            preview={preview}
            onSettled={() =>
              setSettled((current) =>
                current.has(file.path)
                  ? current
                  : new Set([...current, file.path]),
              )
            }
            onOpen={(inTab) => onOpen(file.path, inTab)}
            size={size}
            className={cx(
              "shrink-0 snap-start",
              size === "index" ? "w-25" : "w-30 sm:w-35",
            )}
          />
        );
        return (
          <Fragment key={file.path}>
            {wrapTile === undefined ? tile : wrapTile(file, tile)}
          </Fragment>
        );
      })}
      {trailing}
    </div>
  );
}

const chevronClass = cx(
  "size-(--icon-xs) shrink-0 text-muted-foreground-3 transition-opacity duration-100",
  "group-data-[panel-open]/collapsible:rotate-90",
  "[@media(hover:hover)]:group-data-[panel-open]/collapsible:opacity-0",
  "[@media(hover:hover)]:group-data-[panel-open]/collapsible:group-hover/collapsible:opacity-100",
  "[@media(hover:hover)]:group-data-[panel-open]/collapsible:group-focus-visible/collapsible:opacity-100",
);

export type RecentShelfProps<F extends BrowserFile> = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  files: ReadonlyArray<F>;
  size?: PreviewSize;
  passive: PassivePreview<F>;
  preview: LivePreview<F>;
  onOpen: OpenFile;
  className?: string;
};

export function RecentShelf<F extends BrowserFile>({
  open,
  onOpenChange,
  files,
  size = "shelf",
  passive,
  preview,
  onOpen,
  className,
}: RecentShelfProps<F>) {
  return (
    <section aria-label="Recently changed files" className={className}>
      <Collapsible open={open} onOpenChange={(next) => onOpenChange(next)}>
        <div className="px-4 pb-2">
          <CollapsibleTrigger
            data-track-owner="shared/files/file-browser.tsx#RecentShelf:CollapsibleTrigger[Recent]"
            className="group/collapsible flex items-center gap-1 text-xs text-muted-foreground-2 transition-colors duration-100 hover:text-foreground"
          >
            Recent
            <Icon name="chevron-right" className={chevronClass} />
          </CollapsibleTrigger>
        </div>
        <CollapsiblePanel>
          <TileStrip
            files={files}
            size={size}
            passive={passive}
            preview={preview}
            onOpen={onOpen}
          />
        </CollapsiblePanel>
      </Collapsible>
    </section>
  );
}

export type RecentFilesProps<F extends BrowserFile> = Omit<
  RecentShelfProps<F>,
  "open" | "onOpenChange"
>;

export function RecentFiles<F extends BrowserFile>(props: RecentFilesProps<F>) {
  const { collapsed, onCollapsedChange } = useRecentCollapsed();
  return (
    <RecentShelf
      open={!collapsed}
      onOpenChange={(open) => onCollapsedChange(!open)}
      {...props}
    />
  );
}
