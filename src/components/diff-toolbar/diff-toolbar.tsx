import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { cx } from "class-variance-authority";
import { type ReactNode, useState } from "react";
import {
  DiffWrapMenuItem,
  menuCheckClassName,
  menuIconSlotClassName,
} from "@/components/diff-wrap-menu-item";
import {
  type DiffCategory,
  diffCategory,
  type HiddenDiffCategories,
  hiddenDiffCategoriesAtom,
} from "@/lib/diff-categories";
import {
  type DiffColors,
  type DiffStyle,
  diffColorLabels,
  diffStyleLabels,
  useDiffPreferences,
} from "@/lib/diff-preferences";
import { Button } from "@/primitives/button";
import { Icon, type IconId } from "@/primitives/icon";
import {
  Menu,
  MenuContent,
  MenuSub,
  MenuSubTrigger,
  MenuTrigger,
} from "@/primitives/menu";
import { ResponsiveMenuItem } from "@/primitives/responsive-menu";
import { toast } from "@/primitives/toaster";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";

export type DiffToolbarFile = {
  path: string;
  category?: DiffCategory;
  kind?: "added" | "modified" | "deleted";
  binary?: boolean;
  additions?: number;
  deletions?: number;
  sizeBytes?: number;
};

const diffStyles: ReadonlyArray<DiffStyle> = ["unified", "split"];
const diffColorOptions: ReadonlyArray<DiffColors> = [
  "red-green",
  "blue-orange",
];

const layoutFailed = () => toast.error("Could not save diff layout");
const colorsFailed = () => toast.error("Could not save diff colors");

function DisplaySubmenu({
  icon,
  label,
  value,
  contentClassName,
  children,
}: {
  icon: IconId;
  label: string;
  value: string;
  contentClassName: string;
  children: ReactNode;
}) {
  return (
    <MenuSub>
      <MenuSubTrigger>
        <span className={menuIconSlotClassName}>
          <Icon name={icon} size="sm" />
        </span>
        {label}
        <span className="ml-auto flex shrink-0 items-center gap-1.5 text-sm font-normal text-muted-foreground-1">
          {value}
          <Icon name="chevron-right" size="sm" />
        </span>
      </MenuSubTrigger>
      <MenuContent className={contentClassName}>{children}</MenuContent>
    </MenuSub>
  );
}

export function DiffDisplayMenu() {
  const { preferences, updateAppearance } = useDiffPreferences();
  const check = (selected: boolean) =>
    selected ? (
      <Icon name="checkmark-1" className={cx("ml-auto", menuCheckClassName)} />
    ) : null;
  return (
    <Menu>
      <Tooltip>
        <TooltipTrigger
          render={
            <MenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Display options"
                />
              }
            />
          }
        >
          <Icon name="settings-slider-hor" />
        </TooltipTrigger>
        <TooltipContent side="bottom">Display</TooltipContent>
      </Tooltip>
      <MenuContent align="end" className="w-56">
        <DisplaySubmenu
          icon="layout-left-right"
          label="Layout"
          value={diffStyleLabels[preferences.diffStyle]}
          contentClassName="w-40"
        >
          {diffStyles.map((style) => (
            <ResponsiveMenuItem
              key={style}
              onClick={() => {
                updateAppearance({ diffStyle: style }).catch(layoutFailed);
              }}
            >
              {diffStyleLabels[style]}
              {check(preferences.diffStyle === style)}
            </ResponsiveMenuItem>
          ))}
        </DisplaySubmenu>
        <DisplaySubmenu
          icon="color-swatch"
          label="Colors"
          value={diffColorLabels[preferences.diffColors]}
          contentClassName="w-44"
        >
          {diffColorOptions.map((colors) => (
            <ResponsiveMenuItem
              key={colors}
              onClick={() => {
                updateAppearance({ diffColors: colors }).catch(colorsFailed);
              }}
            >
              {diffColorLabels[colors]}
              {check(preferences.diffColors === colors)}
            </ResponsiveMenuItem>
          ))}
        </DisplaySubmenu>
        <DiffWrapMenuItem />
      </MenuContent>
    </Menu>
  );
}

export type CollapseAllButtonProps = {
  allCollapsed: boolean;
  onToggle: () => void;
  size?: "icon-xs" | "icon-sm";
};

export function CollapseAllButton({
  allCollapsed,
  onToggle,
  size = "icon-xs",
}: CollapseAllButtonProps) {
  const label = allCollapsed ? "Expand all" : "Collapse all";
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size={size}
            aria-label={label}
            onClick={onToggle}
          >
            <Icon name={allCollapsed ? "keyboard-down" : "keyboard-up"} />
          </Button>
        }
      />
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

const categoryOf = (file: DiffToolbarFile) =>
  file.category ?? diffCategory(file.path);

/** The count next to "Files": the total, or "shown · n hidden". */
export function diffFilesCount(
  files: ReadonlyArray<DiffToolbarFile>,
  hidden: HiddenDiffCategories,
): number | string {
  const hiddenCount = files.filter((file) => {
    const category = categoryOf(file);
    return category !== undefined && hidden[category];
  }).length;
  return hiddenCount === 0
    ? files.length
    : `${files.length - hiddenCount} · ${hiddenCount} hidden`;
}

/** Paths to dim in the file list: hidden files and folders holding only them. */
export function dimmedDiffPaths(
  files: ReadonlyArray<DiffToolbarFile>,
  hidden: HiddenDiffCategories,
): Set<string> {
  const hiddenPaths = new Set(
    files
      .filter((file) => {
        const category = categoryOf(file);
        return category !== undefined && hidden[category];
      })
      .map((file) => file.path),
  );
  const folders = new Set(
    files.flatMap((file) =>
      file.path
        .split("/")
        .slice(0, -1)
        .map((_, index, parts) => parts.slice(0, index + 1).join("/")),
    ),
  );
  const hiddenFolders = [...folders].filter((folder) =>
    files
      .filter((file) => file.path.startsWith(`${folder}/`))
      .every((file) => hiddenPaths.has(file.path)),
  );
  return new Set([...hiddenPaths, ...hiddenFolders]);
}

const formatBytes = (bytes: number) => {
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${unit === 0 ? value : value.toFixed(1)} ${units[unit]}`;
};

export type DiffFileListProps = {
  files: ReadonlyArray<DiffToolbarFile>;
  surface?: "popover" | "pane";
  activePath?: string;
  onOpenFile: (path: string) => void;
};

export function DiffFileList({
  files,
  surface = "pane",
  activePath,
  onOpenFile,
}: DiffFileListProps) {
  const hidden = useAtomValue(hiddenDiffCategoriesAtom);
  const setHidden = useAtomSet(hiddenDiffCategoriesAtom);
  const dimmed = dimmedDiffPaths(files, hidden);
  const open = (path: string) => {
    const category =
      files.find((file) => file.path === path)?.category ?? diffCategory(path);
    if (category !== undefined && hidden[category]) {
      setHidden((current) => ({ ...current, [category]: false }));
    }
    if (path !== activePath) onOpenFile(path);
  };
  return (
    <div
      data-surface={surface}
      className="flex min-h-0 flex-1 flex-col overflow-y-auto py-1"
    >
      {files.map((file) => {
        const slash = file.path.lastIndexOf("/");
        return (
          <button
            key={file.path}
            type="button"
            data-item-path={file.path}
            data-active={file.path === activePath ? "" : undefined}
            className={cx(
              "flex h-7 w-full min-w-0 items-center gap-2 rounded-(--radius-card) px-2 text-left text-sm outline-none hover:bg-accent focus-visible:bg-accent",
              dimmed.has(file.path) && "text-muted-foreground-3",
            )}
            onClick={() => open(file.path)}
          >
            <span className="shrink-0 whitespace-nowrap text-foreground">
              {file.path.slice(slash + 1)}
            </span>
            <span className="min-w-0 flex-1 truncate text-muted-foreground-2">
              {file.path.slice(0, slash + 1)}
            </span>
            {file.kind !== undefined && file.kind !== "modified" ? (
              <span className="shrink-0 text-xs text-muted-foreground-2">
                {file.kind}
              </span>
            ) : null}
            {file.binary === true && file.sizeBytes !== undefined ? (
              <span className="shrink-0 text-xs text-muted-foreground-2 tabular-nums">
                {formatBytes(file.sizeBytes)}
              </span>
            ) : file.additions !== undefined || file.deletions !== undefined ? (
              <span className="shrink-0 text-xs tabular-nums">
                <span className="text-diff-add">+{file.additions ?? 0}</span>{" "}
                <span className="text-diff-del">-{file.deletions ?? 0}</span>
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export type DiffFilesMenuProps = {
  files: ReadonlyArray<DiffToolbarFile>;
  onOpenFile: (path: string) => void;
  className?: string;
};

export function DiffFilesMenu({
  files,
  onOpenFile,
  className,
}: DiffFilesMenuProps) {
  const hidden = useAtomValue(hiddenDiffCategoriesAtom);
  const [open, setOpen] = useState(false);
  return (
    <div className={className}>
      <Menu open={open} onOpenChange={setOpen}>
        <MenuTrigger render={<Button variant="ghost" size="xs" />}>
          Files
          <span className="text-muted-foreground-3 tabular-nums">
            {diffFilesCount(files, hidden)}
          </span>
          <Icon name="chevron-grabber-vertical" size="sm" />
        </MenuTrigger>
        <MenuContent align="start" className="w-76">
          <div className="flex max-h-96 flex-col">
            <DiffFileList
              files={files}
              surface="popover"
              onOpenFile={(path) => {
                setOpen(false);
                onOpenFile(path);
              }}
            />
          </div>
        </MenuContent>
      </Menu>
    </div>
  );
}
