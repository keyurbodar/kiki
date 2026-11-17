import { type KeyboardEvent, useEffect, useRef } from "react";
import type { FilesFilter } from "@/components/file-browser/browser-state";
import { CheckGlyph, FilterGlyph, SearchGlyph } from "@/components/file-home";
import { Button } from "@/primitives/button";
import { Input } from "@/primitives/input";
import { Kbd } from "@/primitives/kbd";
import { MenuContent, MenuTrigger } from "@/primitives/menu";
import {
  ResponsiveMenu,
  ResponsiveMenuItem,
} from "@/primitives/responsive-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";

export const filesSearchRowId = (index: number) =>
  `capy-files-search-row-${index}`;

const filterOptions: ReadonlyArray<readonly [FilesFilter, string]> = [
  ["all", "All files"],
  ["thread", "This thread"],
];

const isMac = () =>
  typeof navigator !== "undefined" &&
  /Mac|iPhone|iPad/.test(navigator.platform);

export const searchShortcutLabel = () => (isMac() ? "⌘P" : "Ctrl P");

export type FilesBandProps = {
  query: string;
  onQueryChange: (query: string) => void;
  count: number;
  highlighted: number;
  onHighlight: (index: number) => void;
  onOpenHighlighted: () => void;
  focus?: "search" | "drive";
  onFocus: (focus: undefined) => void;
  filter: FilesFilter;
  onFilter: (filter: FilesFilter) => void;
  shortcut?: string | null;
};

export function FilesBand({
  query,
  onQueryChange,
  count,
  highlighted,
  onHighlight,
  onOpenHighlighted,
  focus,
  onFocus,
  filter,
  onFilter,
  shortcut = searchShortcutLabel(),
}: FilesBandProps) {
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (focus !== "search") return;
    input.current?.focus();
    onFocus(undefined);
  }, [focus, onFocus]);

  useEffect(() => {
    document
      .getElementById(filesSearchRowId(highlighted))
      ?.scrollIntoView({ block: "nearest" });
  }, [highlighted]);

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape" && query !== "") {
      event.stopPropagation();
      onQueryChange("");
      return;
    }
    if (count === 0) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      onHighlight(
        (highlighted + (event.key === "ArrowDown" ? 1 : -1) + count) % count,
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      onOpenHighlighted();
    }
  };

  return (
    <div className="flex h-9 shrink-0 items-center gap-1 border-b-(length:--border-width-hairline) border-border-1 pr-2 pl-2.25">
      <span className="relative flex min-w-0 flex-1 items-center gap-1.5 pl-2">
        <SearchGlyph className="size-(--icon-sm) shrink-0 text-muted-foreground-3" />
        <Input
          data-track-owner="features/thread/pane/files-view.tsx#FilesBand:Input[Search files]"
          ref={input}
          variant="blank"
          size="sm"
          placeholder="Search files"
          aria-label="Search files"
          role="combobox"
          aria-expanded={query !== ""}
          aria-controls="capy-files-search"
          aria-activedescendant={
            query === "" || count === 0
              ? undefined
              : filesSearchRowId(highlighted)
          }
          aria-autocomplete="list"
          autoComplete="off"
          spellCheck={false}
          className="h-7 min-w-0 flex-1 bg-transparent text-xs font-medium text-foreground outline-none placeholder:text-muted-foreground-3"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          onKeyDown={onKeyDown}
        />
        {shortcut !== null && query === "" && (
          <Kbd
            variant="chip"
            className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded bg-secondary px-1 font-sans text-2xs text-muted-foreground-2 pointer-coarse:hidden"
          >
            {shortcut}
          </Kbd>
        )}
      </span>
      <ResponsiveMenu>
        <Tooltip>
          <TooltipTrigger
            data-track-owner="features/thread/pane/files-view.tsx#FilesBand:TooltipTrigger.1"
            render={
              <MenuTrigger
                data-track-owner="features/thread/pane/files-view.tsx#FilesBand:ResponsiveMenuTrigger.1"
                render={
                  <Button
                    data-track-owner="features/thread/pane/files-view.tsx#FilesBand:Button[Filter files]"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Filter files"
                    className="inline-flex size-7 items-center justify-center rounded text-foreground hover:bg-secondary"
                  />
                }
              />
            }
          >
            <FilterGlyph className="size-(--icon-sm)" />
          </TooltipTrigger>
          <TooltipContent side="bottom">Filter</TooltipContent>
        </Tooltip>
        <MenuContent align="end" className="w-44">
          {filterOptions.map(([value, label]) => (
            <ResponsiveMenuItem
              key={value}
              data-track-owner="features/thread/pane/files-view.tsx#FilesBand:ResponsiveMenuItem.1"
              onClick={() => onFilter(value)}
            >
              {label}
              {filter === value && (
                <CheckGlyph className="ml-auto size-(--icon-sm) shrink-0 text-foreground" />
              )}
            </ResponsiveMenuItem>
          ))}
        </MenuContent>
      </ResponsiveMenu>
    </div>
  );
}
