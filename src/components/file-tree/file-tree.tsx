import { Menu as BaseMenu } from "@base-ui/react/menu";
import type {
  ContextMenuItem,
  FileTreeInitialExpansion,
  GitStatusEntry,
} from "@pierre/trees";
import {
  FileTree as PierreFileTree,
  useFileTree,
  useFileTreeSelector,
} from "@pierre/trees/react";
import {
  type ComponentProps,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/cn";
import {
  type FileStat,
  filterPaths,
  folderPathsOf,
  statDecoration,
} from "./tree-paths";
import { treeStyles } from "./tree-styles";
import "./file-tree.css";

const noPaths: readonly string[] = [];
const noSet: ReadonlySet<string> = new Set();
const noStatus: readonly GitStatusEntry[] = [];
const noStats: ReadonlyMap<string, FileStat> = new Map();
const noDecorations: ReadonlyMap<string, string> = new Map();

const folderIcons = {
  set: "complete" as const,
  spriteSheet: `<svg aria-hidden="true" width="0" height="0"><symbol id="capy-tree-folder" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="var(--capy-folder-closed-opacity, 1)"><path d="M3 7V16C3 17.6569 4.34315 19 6 19H18C19.6569 19 21 17.6569 21 16V10C21 8.34315 19.6569 7 18 7H13.0704C12.4017 7 11.7772 6.6658 11.4063 6.1094L10.5937 4.8906C10.2228 4.3342 9.59834 4 8.92963 4H6C4.34315 4 3 5.34315 3 7Z"/></g><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="var(--capy-folder-open-opacity, 0)"><path d="M6 4H8.39445C9.39751 4 10.3342 4.5013 10.8906 5.3359L11.4063 6.1094C11.7772 6.6658 12.4017 7 13.0704 7H18C19.1046 7 20 7.89543 20 9V11H20.6398C21.3144 11 21.7955 11.6543 21.5943 12.2983L19.9386 17.5965C19.6777 18.4315 18.9044 19 18.0296 19H4.44076C3.64505 19 3 18.3549 3 17.5592V7C3 5.34315 4.34315 4 6 4Z"/><path d="M4.44141 19C5.07157 19 5.62862 18.5905 5.81659 17.989L7.56207 12.4034C7.82299 11.5685 8.59625 11 9.47102 11H20.0006"/></g></symbol></svg>`,
  remap: {
    "file-tree-icon-chevron": {
      name: "capy-tree-folder",
      width: 14,
      height: 14,
      viewBox: "0 0 24 24",
    },
  },
};

export type FileTreeEntry = ContextMenuItem;

export type FileTreeProps = Omit<
  ComponentProps<"div">,
  "children" | "contextMenu"
> & {
  paths?: readonly string[];
  openPaths?: ReadonlySet<string>;
  previewPaths?: ReadonlySet<string>;
  currentPath?: string;
  truncated?: boolean;
  gitStatus?: readonly GitStatusEntry[];
  stats?: ReadonlyMap<string, FileStat>;
  decorations?: ReadonlyMap<string, string>;
  surface?: "background" | "popover";
  fit?: boolean;
  initialExpansion?: FileTreeInitialExpansion;
  collapsedPaths?: readonly string[];
  onCollapsedChange?: (collapsed: string[]) => void;
  itemHeight?: number;
  filter?: string;
  onOpen?: (path: string) => void;
  onOpenDirectory?: (path: string) => void;
  onExpandDirectory?: (path: string) => void;
  contextMenu?: (entry: FileTreeEntry, close: () => void) => ReactNode;
};

const quote = (path: string) => `[data-item-path=${JSON.stringify(path)}]`;

export function FileTree({
  paths = noPaths,
  openPaths = noSet,
  previewPaths = noSet,
  currentPath,
  truncated,
  gitStatus = noStatus,
  stats = noStats,
  decorations = noDecorations,
  surface = "background",
  fit = false,
  initialExpansion,
  collapsedPaths,
  onCollapsedChange,
  itemHeight = 24,
  filter,
  onOpen,
  onOpenDirectory,
  onExpandDirectory,
  contextMenu,
  className,
  style,
  ...props
}: FileTreeProps) {
  const [localFilter, setLocalFilter] = useState("");
  const query = (filter ?? localFilter)
    .trim()
    .replaceAll("\\", "/")
    .toLowerCase();
  const known = new Set(paths);
  const latest = useRef({ known, onOpen, onOpenDirectory, stats, decorations });
  latest.current = { known, onOpen, onOpenDirectory, stats, decorations };

  const collapsed = new Set(collapsedPaths ?? noPaths);
  const { model } = useFileTree({
    paths,
    flattenEmptyDirectories: true,
    initialExpansion:
      collapsedPaths === undefined ? initialExpansion : "closed",
    initialExpandedPaths:
      collapsedPaths === undefined
        ? undefined
        : [...folderPathsOf(paths)]
            .filter((folder) => !collapsed.has(folder))
            .map((folder) => `${folder}/`),
    dragAndDrop: false,
    renaming: false,
    itemHeight,
    icons: folderIcons,
    unsafeCSS: treeStyles,
    gitStatus,
    composition:
      contextMenu === undefined
        ? undefined
        : {
            contextMenu: {
              enabled: true,
              triggerMode: "both",
              buttonVisibility: "when-needed",
            },
          },
    renderRowDecoration: ({ item }) => {
      if (item.kind !== "file") return null;
      const stat = latest.current.stats.get(item.path);
      if (stat !== undefined) return statDecoration(stat);
      const text = latest.current.decorations.get(item.path);
      return text === undefined
        ? null
        : { text, parts: [{ text, color: "var(--trees-fg-muted)" }] };
    },
    onSelectionChange: (selected) => {
      const path = selected.at(-1);
      if (path === undefined) return;
      if (latest.current.known.has(path)) latest.current.onOpen?.(path);
      else
        latest.current.onOpenDirectory?.(
          path.endsWith("/") ? path.slice(0, -1) : path,
        );
      queueMicrotask(() => model.getItem(path)?.deselect());
    },
  });

  const visible = filterPaths(paths, query);
  const pathsKey = visible.join("\n");
  useEffect(() => {
    const shown = pathsKey === "" ? [] : pathsKey.split("\n");
    model.resetPaths(shown, {
      initialExpandedPaths:
        query === ""
          ? undefined
          : [...folderPathsOf(shown)].map((folder) => `${folder}/`),
    });
  }, [model, pathsKey, query]);

  useEffect(() => {
    model.setGitStatus([...gitStatus]);
  }, [model, gitStatus]);

  useEffect(() => {
    if (stats.size === 0 && decorations.size === 0) return;
    model.setComposition(model.getComposition());
  }, [model, stats, decorations]);

  useEffect(() => {
    if (onExpandDirectory === undefined && onCollapsedChange === undefined)
      return;
    let expanded = new Set<string>();
    const sync = () => {
      const count = model.getVisibleCount();
      const next = new Set<string>();
      const shownFolders = new Set<string>();
      for (const row of count === 0 ? [] : model.getVisibleRows(0, count - 1)) {
        if (row.kind !== "directory") continue;
        const folder = row.path.replace(/\/$/, "");
        shownFolders.add(folder);
        if (!row.isExpanded) continue;
        next.add(folder);
        if (!expanded.has(folder)) onExpandDirectory?.(folder);
      }
      expanded = next;
      onCollapsedChange?.(
        [...shownFolders].filter((folder) => !next.has(folder)).sort(),
      );
    };
    sync();
    return model.subscribe(sync);
  }, [model, onExpandDirectory, onCollapsedChange]);

  const marks = [
    ...[...openPaths].map(
      (path) =>
        `${quote(path)} [data-item-section="content"] { font-weight: var(--font-weight-medium); }`,
    ),
    ...[...previewPaths].map(
      (path) =>
        `${quote(path)} [data-item-section="content"] { font-style: italic; }`,
    ),
    ...(currentPath === undefined
      ? []
      : [
          `${quote(currentPath)} { background-color: var(--trees-selected-bg); }`,
        ]),
  ].join("\n");
  useEffect(() => {
    const root = model.getFileTreeContainer()?.shadowRoot;
    if (root == null) return;
    const sheet = document.createElement("style");
    sheet.dataset.capyOpenMarks = "";
    sheet.textContent = marks;
    root.append(sheet);
    return () => sheet.remove();
  }, [model, marks]);

  const count = useFileTreeSelector(model, (tree) => tree.getVisibleCount());
  const noMatches = query !== "" && visible.length === 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {filter === undefined && surface !== "popover" && (
        <div className="flex shrink-0 items-center px-3 pt-1.5 pb-1">
          <input
            aria-label="Filter files"
            placeholder="Filter files"
            className="h-7 w-full min-w-0 bg-transparent text-xs font-medium outline-none placeholder:text-muted-foreground-3"
            value={localFilter}
            onChange={(event) => setLocalFilter(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Escape" || localFilter === "") return;
              event.stopPropagation();
              setLocalFilter("");
            }}
          />
        </div>
      )}
      {truncated === true && (
        <div className="shrink-0 px-3 pt-1 text-2xs text-muted-foreground-2">
          Large workspace, showing the first part of the tree
        </div>
      )}
      {noMatches && (
        <div className="px-2 py-6 text-center text-sm text-muted-foreground-2">
          No results found
        </div>
      )}
      <div
        {...props}
        data-slot="file-tree"
        className={cn(
          "flex min-h-0",
          surface === "popover" || fit ? "flex-auto" : "flex-1",
          fit && "max-h-[100cqh]",
          noMatches && "hidden",
          className,
        )}
        style={
          surface === "popover" || fit
            ? { ...style, height: count * itemHeight }
            : style
        }
      >
        <PierreFileTree
          model={model}
          data-tree-surface={surface}
          data-tree-fit={fit ? "true" : undefined}
          data-tree-filtered={query === "" ? undefined : "true"}
          className={cn(
            "capy-tree min-h-0 flex-1",
            surface === "background" && !fit && "pt-1",
          )}
          renderContextMenu={
            contextMenu === undefined
              ? undefined
              : (item, context) => (
                  <BaseMenu.Root
                    open
                    onOpenChange={(open) => {
                      if (!open) context.close();
                    }}
                  >
                    <BaseMenu.Portal>
                      <BaseMenu.Positioner
                        anchor={{
                          getBoundingClientRect: () =>
                            DOMRect.fromRect(context.anchorRect),
                        }}
                      >
                        <BaseMenu.Popup
                          data-slot="menu-content"
                          finalFocus={false}
                          className="min-w-44"
                          data-file-tree-context-menu-root="true"
                        >
                          <div
                            data-file-tree-context-menu-root="true"
                            className="flex flex-col whitespace-nowrap"
                          >
                            {contextMenu(item, () => context.close())}
                          </div>
                        </BaseMenu.Popup>
                      </BaseMenu.Positioner>
                    </BaseMenu.Portal>
                  </BaseMenu.Root>
                )
          }
        />
      </div>
    </div>
  );
}
