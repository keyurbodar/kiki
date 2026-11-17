import { cx } from "class-variance-authority";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { MenuContent, MenuTrigger } from "@/primitives/menu";
import {
  ResponsiveMenu,
  ResponsiveMenuItem,
} from "@/primitives/responsive-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";

export type CollapseAllButtonProps = {
  allCollapsed: boolean;
  onToggle: () => void;
};

export function CollapseAllButton({
  allCollapsed,
  onToggle,
}: CollapseAllButtonProps) {
  const label = allCollapsed ? "Expand all" : "Collapse all";
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={label}
            onClick={onToggle}
          >
            <Icon
              name={allCollapsed ? "square-plus" : "square-minus"}
              size="sm"
            />
          </Button>
        }
      />
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

export type DiffFilesMenuProps = {
  paths: ReadonlyArray<string>;
  onOpenFile: (path: string) => void;
  className?: string;
};

export function DiffFilesMenu({
  paths,
  onOpenFile,
  className,
}: DiffFilesMenuProps) {
  return (
    <div className={className}>
      <ResponsiveMenu>
        <MenuTrigger
          render={
            <Button
              variant="ghost"
              size="xs"
              className="inline-flex items-center gap-1"
            >
              Files
              <span className="text-muted-foreground-3 tabular-nums">
                {paths.length}
              </span>
              <Icon
                name="chevron-grabber-vertical"
                size="sm"
                className="text-icon-muted"
              />
            </Button>
          }
        />
        <MenuContent align="start" className="w-76">
          <div className="flex max-h-96 flex-col overflow-y-auto">
            {paths.map((path) => (
              <ResponsiveMenuItem key={path} onClick={() => onOpenFile(path)}>
                <span className="min-w-0 truncate text-sm" title={path}>
                  {path}
                </span>
              </ResponsiveMenuItem>
            ))}
          </div>
        </MenuContent>
      </ResponsiveMenu>
    </div>
  );
}

export type DiffToolbarProps = {
  paths: ReadonlyArray<string>;
  notes: ReadonlyArray<string>;
  railHosted?: boolean;
  onOpenFile: (path: string) => void;
  allCollapsed: boolean;
  onToggleAll: () => void;
};

export function DiffToolbar({
  paths,
  notes,
  railHosted = false,
  onOpenFile,
  allCollapsed,
  onToggleAll,
}: DiffToolbarProps) {
  return (
    <div data-slot="diff-toolbar">
      <div className="flex min-h-9 flex-row items-center gap-1 px-2">
        <DiffFilesMenu
          paths={paths}
          onOpenFile={onOpenFile}
          className={cx(railHosted && "@5xl/pull:hidden")}
        />
        <span className="min-w-0 flex-1" />
        {notes.length > 0 && (
          <span className="mask-fade-r min-w-0 overflow-hidden px-1 text-xs whitespace-nowrap text-muted-foreground-3">
            {notes.join(", ")}
          </span>
        )}
        <CollapseAllButton allCollapsed={allCollapsed} onToggle={onToggleAll} />
      </div>
    </div>
  );
}
