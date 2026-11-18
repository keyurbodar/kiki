import type { ContextMenuItem, FileTreeSortComparator } from "@pierre/trees";
import {
  Fragment,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
} from "react";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { Input, InputGroup } from "@/primitives/input";
import { ResponsiveMenuItem } from "@/primitives/responsive-menu";
import { ScrollArea, ScrollAreaViewport } from "@/primitives/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import {
  type BrowserFile,
  buildFileIndex,
  folderAt,
  nearestFolder,
  normalizeFilter,
  siblingPath,
} from "./file-index";
import { FolderListing } from "./folder-listing";
import {
  type LivePreview,
  type OpenFile,
  type PassivePreview,
  RecentFiles,
} from "./preview-tile";
import { useTreeCollapsed } from "./tree-state";
import { useWideLayout } from "./wide-layout";

export type FileTreeControl = {
  selectPath: (path: string) => void;
  clearSelection: () => void;
  setExpanded: (expanded: boolean, path?: string) => void;
};

export type FileBrowserContextMenu = (
  item: ContextMenuItem,
  close: () => void,
) => ReactNode;

export type FileBrowserTreeProps = {
  paths: ReadonlyArray<string>;
  decorations: ReadonlyMap<string, string>;
  revisions?: ReadonlyMap<string, number>;
  initialExpansion: "open";
  collapsedPaths: readonly string[];
  onCollapsedChange: (paths: readonly string[]) => void;
  sort?: "default" | FileTreeSortComparator;
  itemHeight?: number;
  filter: string;
  controlRef: RefObject<FileTreeControl | null>;
  retainSelection: boolean;
  onOpen: OpenFile;
  onOpenInTab?: (path: string) => void;
  onOpenDirectory: (path: string) => void;
  contextMenu?: FileBrowserContextMenu;
};

export type FileBrowserProps<F extends BrowserFile> = {
  files: ReadonlyArray<F>;
  locationKey: string;
  userId?: string;
  revisions?: ReadonlyMap<string, number>;
  recent: ReadonlyArray<F>;
  decorations: ReadonlyMap<string, string>;
  sort?: "default" | FileTreeSortComparator;
  itemHeight?: number;
  filter: string;
  onFilterChange?: (filter: string) => void;
  header?: ReactNode;
  asideActions?: ReactNode;
  browse: string;
  onOpenDirectory: (path: string) => void;
  onClose?: () => void;
  contextMenu?: FileBrowserContextMenu;
  passive: PassivePreview<F>;
  preview: LivePreview<F>;
  onOpen: (path: string) => void;
  onOpenInTab?: (path: string) => void;
  selectedPath?: string;
  reader?: (path: string) => ReactNode;
  renderTree: (props: FileBrowserTreeProps) => ReactNode;
};

const editableSelector =
  "input, textarea, select, [contenteditable=true], [role=menu], [role=dialog]";

const menuIconClass =
  "flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted in-data-[intent=danger]:text-destructive";

const expandActions = [
  {
    label: "Expand all",
    expanded: true,
    icon: <Icon name="chevron-grabber-vertical" />,
  },
  {
    label: "Collapse all",
    expanded: false,
    icon: <Icon name="chevron-grabber-vertical-toward" />,
  },
];

export function FileBrowser<F extends BrowserFile>({
  files,
  locationKey,
  userId,
  revisions,
  recent,
  decorations,
  sort,
  itemHeight,
  filter,
  onFilterChange,
  header,
  asideActions,
  browse,
  onOpenDirectory,
  onClose,
  contextMenu,
  passive,
  preview,
  onOpen,
  onOpenInTab,
  selectedPath,
  reader,
  renderTree,
}: FileBrowserProps<F>) {
  const rootRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLInputElement>(null);
  const treeRef = useRef<FileTreeControl>(null);
  const readerRef = useRef<HTMLDivElement>(null);
  const filterable = onFilterChange !== undefined;

  useEffect(() => {
    if (!filterable) return;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      const target = event.composedPath()[0];
      if (
        filterRef.current === null ||
        rootRef.current?.getClientRects().length === 0 ||
        event.key !== "/" ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        (target instanceof HTMLElement &&
          target.closest(editableSelector) !== null)
      )
        return;
      event.preventDefault();
      filterRef.current.focus();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [filterable]);

  const wide = useWideLayout(rootRef);
  const index = buildFileIndex(files);
  const query = normalizeFilter(filter);
  const visibleIndex =
    query === ""
      ? index
      : buildFileIndex(
          files.filter((file) => file.path.toLowerCase().includes(query)),
        );
  const opensInTab = onOpenInTab !== undefined && !wide;
  const selected =
    reader === undefined || opensInTab ? undefined : selectedPath;
  const open: OpenFile = (path, inTab) =>
    onOpenInTab !== undefined && (inTab === true || opensInTab)
      ? onOpenInTab(path)
      : onOpen(path);
  const browsing =
    selected === undefined &&
    browse !== "" &&
    folderAt(index, browse) !== undefined
      ? browse
      : undefined;
  const browseMissing = browse !== "" && folderAt(index, browse) === undefined;

  useEffect(() => {
    if (browseMissing) onOpenDirectory(nearestFolder(files, browse));
  }, [browseMissing, browse, files, onOpenDirectory]);

  useEffect(() => {
    if (!wide) return;
    if (selected === undefined) {
      if (browsing === undefined) treeRef.current?.clearSelection();
      else treeRef.current?.selectPath(`${browsing}/`);
      return;
    }
    treeRef.current?.selectPath(selected);
    const active = document.activeElement;
    if (
      !(
        active instanceof HTMLElement &&
        active.closest("input, textarea, [contenteditable=true]") !== null
      ) &&
      !readerRef.current?.contains(active)
    )
      readerRef.current?.focus();
  }, [wide, selected, browsing]);

  const step = (offset: number) => {
    if (selected === undefined) return;
    const next = siblingPath(
      files.map((file) => file.path),
      selected,
      offset,
    );
    if (next !== undefined) onOpen(next);
  };

  const paths = files.map((file) => file.path);
  const tree = useTreeCollapsed(locationKey, userId);
  const recentFiles = query === "" ? recent.slice(0, 6) : [];

  const treeMenu: FileBrowserContextMenu | undefined =
    contextMenu === undefined
      ? undefined
      : (item, close) => (
          <>
            {item.kind === "directory" && (
              <>
                <ResponsiveMenuItem
                  data-track-owner="shared/files/file-browser.tsx#FileBrowser:ResponsiveMenuItem[Expand all inside]"
                  onClick={() => {
                    close();
                    treeRef.current?.setExpanded(
                      true,
                      item.path.replace(/\/+$/, ""),
                    );
                  }}
                >
                  <span className={menuIconClass}>
                    <Icon name="chevron-grabber-vertical" />
                  </span>
                  Expand all inside
                </ResponsiveMenuItem>
                <ResponsiveMenuItem
                  data-track-owner="shared/files/file-browser.tsx#FileBrowser:ResponsiveMenuItem[Collapse all inside]"
                  onClick={() => {
                    close();
                    treeRef.current?.setExpanded(
                      false,
                      item.path.replace(/\/+$/, ""),
                    );
                  }}
                >
                  <span className={menuIconClass}>
                    <Icon name="chevron-grabber-vertical-toward" />
                  </span>
                  Collapse all inside
                </ResponsiveMenuItem>
              </>
            )}
            {contextMenu(item, close)}
          </>
        );

  const treeView = (
    <Fragment key={locationKey}>
      {renderTree({
        paths,
        decorations,
        revisions,
        initialExpansion: "open",
        collapsedPaths: tree.collapsed,
        onCollapsedChange: tree.onCollapsedChange,
        sort,
        itemHeight,
        filter: query,
        controlRef: treeRef,
        retainSelection: wide,
        onOpen: open,
        onOpenInTab,
        onOpenDirectory,
        contextMenu: treeMenu,
      })}
    </Fragment>
  );

  const toolbar = (
    <div className="shrink-0 px-3 pt-1 pb-1">
      <div className="flex h-8 items-center gap-0.5">
        <span className="min-w-0 flex-1 text-xs font-medium text-muted-foreground-2">
          All files
        </span>
        {expandActions.map((action) => (
          <Tooltip key={action.label}>
            <TooltipTrigger
              data-track-owner="shared/files/file-browser.tsx#FileBrowser:TooltipTrigger.1"
              render={
                <Button
                  data-track-owner="shared/files/file-browser.tsx#FileBrowser:Button.1"
                  variant="ghost"
                  size="icon-xs"
                  aria-label={action.label}
                  disabled={paths.length === 0}
                  onClick={() => treeRef.current?.setExpanded(action.expanded)}
                >
                  {action.icon}
                </Button>
              }
            />
            <TooltipContent>{action.label}</TooltipContent>
          </Tooltip>
        ))}
        {asideActions}
      </div>
      {onFilterChange !== undefined && (
        <div className="flex items-center gap-1 pb-1">
          <InputGroup className="w-full">
            <Icon name="search-menu" size="sm" />
            <Input
              ref={filterRef}
              size="sm"
              aria-label="Filter names and paths"
              placeholder="Filter names and paths"
              value={filter}
              onChange={(event) => onFilterChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Escape" || filter === "") return;
                event.preventDefault();
                event.stopPropagation();
                onFilterChange("");
              }}
            />
          </InputGroup>
          {filter !== "" && (
            <Button
              data-track-owner="shared/files/file-browser.tsx#FileBrowser:Button[Clear file filter]"
              variant="ghost"
              size="icon-xs"
              aria-label="Clear file filter"
              onClick={() => {
                onFilterChange("");
                filterRef.current?.focus();
              }}
            >
              <Icon name="x" />
            </Button>
          )}
        </div>
      )}
      {query !== "" && (
        <div
          role="status"
          className="py-1 text-xs text-muted-foreground-2 tabular-nums"
        >
          {visibleIndex.fileCount}{" "}
          {visibleIndex.fileCount === 1 ? "matching file" : "matching files"}
        </div>
      )}
    </div>
  );

  const onRootKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Escape" || filter === "" || onFilterChange === undefined)
      return;
    event.preventDefault();
    event.stopPropagation();
    onFilterChange("");
  };

  const onReaderKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape" && selected !== undefined) {
      event.preventDefault();
      onClose?.();
      return;
    }
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    const target = event.target;
    if (
      target instanceof HTMLElement &&
      target.closest(
        "input, textarea, select, [contenteditable=true], [role=menu]",
      ) !== null
    )
      return;
    event.preventDefault();
    step(event.key === "ArrowUp" ? -1 : 1);
  };

  const readerPane =
    selected !== undefined && reader !== undefined ? (
      reader(selected)
    ) : browsing !== undefined ? (
      <FolderListing
        path={browsing}
        index={visibleIndex}
        filtering={query !== ""}
        files={files}
        decorations={decorations}
        passive={passive}
        preview={preview}
        onOpen={open}
        onBrowse={onOpenDirectory}
      />
    ) : recentFiles.length > 0 ? (
      <ScrollArea className="min-h-0 flex-1">
        <ScrollAreaViewport className="size-full">
          <RecentFiles
            className="py-3"
            files={recentFiles}
            size="index"
            passive={passive}
            preview={preview}
            onOpen={open}
          />
        </ScrollAreaViewport>
      </ScrollArea>
    ) : (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground-2">
        Select a file
      </div>
    );

  const body = wide ? (
    <div className="flex min-h-0 flex-1">
      <aside className="flex w-72 shrink-0 flex-col border-r-(length:--border-width-hairline) border-border-1">
        {toolbar}
        {treeView}
      </aside>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: arrow keys step through sibling files while the reader has focus */}
      <div
        ref={readerRef}
        tabIndex={-1}
        className="flex min-h-0 min-w-0 flex-1 flex-col outline-none"
        onKeyDown={onReaderKeyDown}
      >
        {readerPane}
      </div>
    </div>
  ) : selected !== undefined && reader !== undefined ? (
    reader(selected)
  ) : (
    <>
      {recentFiles.length > 0 && (
        <RecentFiles
          className="shrink-0 pt-3"
          files={recentFiles}
          passive={passive}
          preview={preview}
          onOpen={open}
        />
      )}
      {toolbar}
      <div className="flex min-h-0 flex-1 flex-col">{treeView}</div>
    </>
  );

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: Escape clears the filter from anywhere inside the browser
    <div
      ref={rootRef}
      className="flex min-h-0 min-w-0 flex-1 flex-col"
      onKeyDown={onRootKeyDown}
    >
      {wide || selected === undefined ? header : null}
      {body}
    </div>
  );
}
