import { cx } from "class-variance-authority";
import { useEffect, useState } from "react";
import { folderIconClass } from "@/components/directory-view/file-icon";
import { fileCountLabel } from "@/components/directory-view/format-bytes";
import { Icon } from "@/primitives/icon";
import { ScrollArea, ScrollAreaViewport } from "@/primitives/scroll-area";
import {
  type BrowserFile,
  baseName,
  type FileIndexFolder,
  folderAt,
  folderEntries,
} from "./file-index";
import { PreviewContent } from "./preview-content";
import {
  canLoadPreview,
  type LivePreview,
  type OpenFile,
  type PassivePreview,
} from "./preview-tile";

const crumbButtonClass =
  "focus-gutter min-w-0 cursor-pointer truncate rounded font-medium text-muted-foreground-2 outline-none hover:text-foreground focus-visible:outline-ring-inset";

const rowClass =
  "flex h-12 cursor-pointer items-center gap-3 rounded px-2 text-left outline-none select-none hover:bg-secondary focus-visible:outline-ring-inset";

type ListThumbProps<F extends BrowserFile> = {
  file: F;
  canLoad: boolean;
  passive: PassivePreview<F>;
  preview: LivePreview<F>;
  onSettled: () => void;
};

function ListThumb<F extends BrowserFile>({
  file,
  canLoad,
  passive,
  preview,
  onSettled,
}: ListThumbProps<F>) {
  const content = passive(file);
  const hasPassive = content !== undefined;
  useEffect(() => {
    if (hasPassive) onSettled();
  }, [hasPassive, onSettled]);
  if (content !== undefined)
    return (
      <PreviewContent
        content={content}
        name={baseName(file.path)}
        size="list"
      />
    );
  return canLoad ? preview(file, onSettled, "list") : null;
}

export type FolderFileRowProps<F extends BrowserFile> = {
  file: F;
  label: string;
  decoration: string;
  canLoad: boolean;
  passive: PassivePreview<F>;
  preview: LivePreview<F>;
  onOpen: OpenFile;
  onSettled: (path: string) => void;
};

export function FolderFileRow<F extends BrowserFile>({
  file,
  label,
  decoration,
  canLoad,
  passive,
  preview,
  onOpen,
  onSettled,
}: FolderFileRowProps<F>) {
  return (
    <button
      data-track-owner="shared/files/file-browser.tsx#module:button.1"
      type="button"
      className={rowClass}
      onClick={(event) => onOpen(file.path, event.metaKey || event.ctrlKey)}
    >
      <span className="relative h-9 w-7 shrink-0 overflow-hidden rounded-(--radius-sm) border-(length:--border-width-hairline) border-border-1 bg-card">
        <span className="absolute inset-0" data-preview-size="list">
          <ListThumb
            file={file}
            canLoad={canLoad}
            passive={passive}
            preview={preview}
            onSettled={() => onSettled(file.path)}
          />
        </span>
      </span>
      <span className="min-w-0 flex-1 truncate text-xs text-foreground">
        {label}
      </span>
      <span className="shrink-0 text-2xs text-muted-foreground-3 tabular-nums">
        {decoration}
      </span>
    </button>
  );
}

export type FolderListingProps<F extends BrowserFile> = {
  path: string;
  index: FileIndexFolder;
  filtering: boolean;
  files: ReadonlyArray<F>;
  decorations: ReadonlyMap<string, string>;
  passive: PassivePreview<F>;
  preview: LivePreview<F>;
  onOpen: OpenFile;
  onBrowse: (path: string) => void;
};

export function FolderListing<F extends BrowserFile>({
  path,
  index,
  filtering,
  files,
  decorations,
  passive,
  preview,
  onOpen,
  onBrowse,
}: FolderListingProps<F>) {
  const folder = folderAt(index, path);
  const entries = folder === undefined ? [] : folderEntries(folder, path);
  const byPath = new Map(files.map((file) => [file.path, file]));
  const crumbs = path.split("/");
  const [settled, setSettled] = useState<ReadonlySet<string>>(() => new Set());
  const positions = new Map(
    entries
      .flatMap((entry) => (entry.kind === "file" ? [entry.path] : []))
      .map((filePath, position) => [filePath, position]),
  );
  const markSettled = (filePath: string) =>
    setSettled((current) =>
      current.has(filePath) ? current : new Set([...current, filePath]),
    );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-9 shrink-0 items-center gap-1 border-b-(length:--border-width-hairline) border-border-1 px-4 text-xs whitespace-nowrap">
        <button
          data-track-owner="shared/files/file-browser.tsx#FolderListing:button[All files]"
          type="button"
          className={crumbButtonClass}
          onClick={() => onBrowse("")}
        >
          All files
        </button>
        {crumbs.map((crumb, position) => (
          <span
            key={crumbs.slice(0, position + 1).join("/")}
            className="flex min-w-0 items-center gap-1"
          >
            <span className="text-muted-foreground-3">/</span>
            {position === crumbs.length - 1 ? (
              <span className="min-w-0 truncate font-medium text-foreground">
                {crumb}
              </span>
            ) : (
              <button
                data-track-owner="shared/files/file-browser.tsx#FolderListing:button.1"
                type="button"
                className={crumbButtonClass}
                onClick={() =>
                  onBrowse(crumbs.slice(0, position + 1).join("/"))
                }
              >
                {crumb}
              </button>
            )}
          </span>
        ))}
        <span className="ml-auto shrink-0 pl-3 text-muted-foreground-3">
          {fileCountLabel(folder?.fileCount ?? 0)}
        </span>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <ScrollAreaViewport className="size-full">
          <div className="flex flex-col px-2 py-2">
            {entries.length === 0 && (
              <div className="px-2 py-6 text-center text-sm text-muted-foreground-2">
                {filtering ? "No results found" : "Empty folder"}
              </div>
            )}
            {entries.map((entry) => {
              if (entry.kind === "folder")
                return (
                  <button
                    key={entry.path}
                    data-track-owner="shared/files/file-browser.tsx#FolderListing:button.2"
                    type="button"
                    className={rowClass}
                    onClick={() => onBrowse(entry.path)}
                  >
                    <span className="flex h-9 w-7 shrink-0 items-center justify-center">
                      <Icon
                        name="folder-1"
                        className={cx("size-5", folderIconClass)}
                      />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-xs text-foreground">
                      {entry.label}
                    </span>
                    <span className="shrink-0 text-2xs text-muted-foreground-3 tabular-nums">
                      {fileCountLabel(entry.fileCount)}
                    </span>
                  </button>
                );
              const file = byPath.get(entry.path);
              if (file === undefined) return null;
              return (
                <FolderFileRow
                  key={entry.path}
                  file={file}
                  label={entry.label}
                  decoration={decorations.get(entry.path) ?? ""}
                  canLoad={canLoadPreview(
                    positions.get(entry.path) ?? 0,
                    settled.size,
                  )}
                  passive={passive}
                  preview={preview}
                  onOpen={onOpen}
                  onSettled={markSettled}
                />
              );
            })}
          </div>
        </ScrollAreaViewport>
      </ScrollArea>
    </div>
  );
}
