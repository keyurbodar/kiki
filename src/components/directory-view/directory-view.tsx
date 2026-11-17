import { cx } from "class-variance-authority";
import { type ReactNode, useState } from "react";
import {
  type BrowserFile,
  buildFileIndex,
  folderAt,
  folderEntries,
} from "@/components/file-browser/file-index";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { ScrollArea, ScrollAreaViewport } from "@/primitives/scroll-area";
import { FileIcon, folderIconClass } from "./file-icon";
import { fileCountLabel, formatBytes } from "./format-bytes";

export const directoryPageSize = 150;

export type DirectoryCrumbProps = {
  label: ReactNode;
  current: boolean;
  onOpen: () => void;
};

export function DirectoryCrumb({
  label,
  current,
  onOpen,
}: DirectoryCrumbProps) {
  if (current)
    return (
      <span className="min-w-0 truncate font-medium text-foreground">
        {label}
      </span>
    );
  return (
    <button
      data-track-owner="shared/files/directory-view.tsx#DirectoryCrumb:button[onClick=onOpen]"
      type="button"
      className="focus-gutter relative min-w-0 cursor-pointer truncate rounded font-medium text-muted-foreground-2 outline-none hover:text-foreground focus-visible:outline-ring-inset pointer-coarse:after:absolute pointer-coarse:after:top-1/2 pointer-coarse:after:left-1/2 pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 pointer-coarse:after:-translate-x-1/2 pointer-coarse:after:-translate-y-1/2"
      onClick={onOpen}
    >
      {label}
    </button>
  );
}

export type DirectoryViewProps = {
  rootLabel: ReactNode;
  path: string;
  entries: ReadonlyArray<BrowserFile>;
  decorations?: ReadonlyMap<string, string>;
  rootMeta?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  onOpenDirectory: (path: string) => void;
  onOpenFile: (path: string) => void;
};

export function DirectoryView({
  rootLabel,
  path,
  entries,
  decorations,
  rootMeta,
  leading,
  trailing,
  onOpenDirectory,
  onOpenFile,
}: DirectoryViewProps) {
  const folder = folderAt(buildFileIndex(entries), path);
  const items = folder === undefined ? [] : folderEntries(folder, path);
  const [paging, setPaging] = useState({ path, pages: 1 });
  const pages = paging.path === path ? paging.pages : 1;
  const shown = items.slice(0, pages * directoryPageSize);
  const segments = path === "" ? [] : path.split("/");

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div
        className={cx(
          "flex min-h-9 shrink-0 items-center gap-1 border-b-(length:--border-width-hairline) border-border-1 text-xs whitespace-nowrap",
          leading === undefined ? "pl-4" : "pl-2",
          trailing === undefined ? "pr-4" : "pr-1.5",
        )}
      >
        {leading !== undefined && (
          <span className="mr-0.5 flex items-center gap-1">{leading}</span>
        )}
        <DirectoryCrumb
          label={rootLabel}
          current={segments.length === 0}
          onOpen={() => onOpenDirectory("")}
        />
        {segments.map((segment, index) => (
          <span
            key={segments.slice(0, index + 1).join("/")}
            className="flex min-w-0 items-center gap-1"
          >
            <span className="text-muted-foreground-3">/</span>
            <DirectoryCrumb
              label={segment}
              current={index === segments.length - 1}
              onOpen={() =>
                onOpenDirectory(segments.slice(0, index + 1).join("/"))
              }
            />
          </span>
        ))}
        {folder !== undefined && (
          <span className="ml-auto shrink-0 pl-3 font-normal text-muted-foreground-3">
            {[
              fileCountLabel(folder.fileCount),
              formatBytes(folder.totalBytes),
              ...(path === "" && rootMeta !== undefined ? [rootMeta] : []),
            ].join(" · ")}
          </span>
        )}
        {trailing !== undefined && (
          <span
            className={cx(
              "flex shrink-0 items-center",
              folder === undefined && "ml-auto",
            )}
          >
            {trailing}
          </span>
        )}
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <ScrollAreaViewport className="size-full">
          <div className="px-4 py-4">
            {items.length === 0 ? (
              <div className="px-2 py-6 text-center text-sm font-normal text-muted-foreground-2">
                Empty folder
              </div>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(--spacing(32),1fr))] gap-1">
                {shown.map((entry) => {
                  const decoration = decorations?.get(entry.path);
                  const meta = [
                    formatBytes(
                      entry.kind === "folder"
                        ? entry.totalBytes
                        : entry.sizeBytes,
                    ),
                    ...(decoration === undefined ? [] : [decoration]),
                  ].join(" · ");
                  return (
                    <button
                      key={entry.path}
                      data-track-owner="shared/files/directory-view.tsx#DirectoryView:button.1"
                      type="button"
                      title={entry.label}
                      className="flex cursor-pointer flex-col items-center gap-1.5 rounded px-2 py-3 outline-none select-none hover:bg-section focus-visible:outline-ring-inset"
                      onClick={() =>
                        entry.kind === "folder"
                          ? onOpenDirectory(entry.path)
                          : onOpenFile(entry.path)
                      }
                    >
                      {entry.kind === "folder" ? (
                        <Icon
                          name="folder-1"
                          className={cx("size-8", folderIconClass)}
                        />
                      ) : (
                        <FileIcon name={entry.label} className="size-8" />
                      )}
                      <span className="max-w-full truncate text-center text-xs text-foreground">
                        {entry.label}
                      </span>
                      <span className="max-w-full truncate text-2xs font-normal text-muted-foreground-3">
                        {entry.kind === "folder"
                          ? `${fileCountLabel(entry.fileCount)} · ${meta}`
                          : meta}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            {items.length > shown.length && (
              <div className="flex justify-center pt-2">
                <Button
                  data-track-owner="shared/files/directory-view.tsx#DirectoryView:Button[Show more]"
                  variant="ghost"
                  size="xs"
                  onClick={() => setPaging({ path, pages: pages + 1 })}
                >
                  Show{" "}
                  {Math.min(directoryPageSize, items.length - shown.length)}{" "}
                  more
                </Button>
              </div>
            )}
          </div>
        </ScrollAreaViewport>
      </ScrollArea>
    </div>
  );
}
