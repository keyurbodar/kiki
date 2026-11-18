import { Link, type LinkProps } from "@tanstack/react-router";
import type { MouseEventHandler, ReactNode } from "react";
import { Input } from "@/primitives/input";
import { ScrollArea, ScrollAreaViewport } from "@/primitives/scroll-area";
import { SettingsNavPopups } from "./settings-nav-popups";

const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

const touchTarget =
  "pointer-coarse:after:absolute pointer-coarse:after:top-1/2 pointer-coarse:after:left-1/2 pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 pointer-coarse:after:-translate-x-1/2 pointer-coarse:after:-translate-y-1/2";

export const settingsSidebarNavLinkClass = cx(
  "flex h-7 shrink-0 cursor-pointer items-center gap-2 rounded px-2 text-sm font-medium outline-none select-none",
  "text-muted-foreground-1 transition-colors duration-100 hover:bg-secondary hover:text-foreground",
  "focus-visible:outline-ring-inset",
  "[&_svg]:size-(--icon-sm) [&_svg]:shrink-0",
);

export type SettingsSidebarLink = {
  to: NonNullable<LinkProps["to"]>;
  label: string;
  icon?: ReactNode;
};

export type SettingsSidebarGroup = {
  id: string;
  label: string | null;
  ariaLabel: string;
  links: readonly SettingsSidebarLink[];
};

export type SettingsSidebarResult = {
  to: NonNullable<LinkProps["to"]>;
  title: string;
  icon?: ReactNode;
  rows: readonly SettingsSidebarResultRow[];
};

export type SettingsSidebarResultRow = {
  id: string;
  title: string;
  to?: NonNullable<LinkProps["to"]>;
};

export type SettingsSidebarProps = {
  groups: readonly SettingsSidebarGroup[];
  query: string;
  onQueryChange: (query: string) => void;
  /** Search results; shown instead of the groups while the query is not blank. */
  results: readonly SettingsSidebarResult[];
  /** True while the search index is still loading (suppresses the empty state). */
  searching?: boolean;
  onSelectPage: (result: SettingsSidebarResult) => void;
  onSelectRow: (
    result: SettingsSidebarResult,
    row: SettingsSidebarResultRow,
  ) => void;
  onBack?: MouseEventHandler<HTMLAnchorElement>;
  backIcon?: ReactNode;
  searchIcon?: ReactNode;
  /** The shell's sidebar toggle (Capy's SidebarTrigger). */
  trigger?: ReactNode;
  /** The shell's user menu. */
  footer?: ReactNode;
};

export function SettingsSidebar({
  groups,
  query,
  onQueryChange,
  results,
  searching = false,
  onSelectPage,
  onSelectRow,
  onBack,
  backIcon,
  searchIcon,
  trigger,
  footer,
}: SettingsSidebarProps) {
  const searchActive = query.trim() !== "";
  return (
    <div
      data-slot="settings-sidebar"
      className="flex h-full min-h-0 w-full flex-col pt-2 [[data-tab-strip]_&]:pt-0"
    >
      <header className="flex h-11 shrink-0 items-center gap-1 px-2">
        <Link
          to="/new"
          onClick={onBack}
          className="flex h-7 min-w-0 flex-1 items-center gap-2 rounded px-2 text-sm font-medium text-muted-foreground-1 transition-colors duration-100 outline-none select-none hover:bg-secondary hover:text-foreground focus-visible:outline-ring-inset [&_svg]:size-(--icon-sm) [&_svg]:shrink-0"
        >
          {backIcon}
          Settings
        </Link>
        {trigger && (
          <span className="mr-1.5 flex shrink-0 items-center">{trigger}</span>
        )}
      </header>
      <div className="shrink-0 px-2 pb-1">
        <span data-slot="input-group" className="relative inline-flex w-full">
          {searchIcon && (
            <span
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 text-icon-muted [&_svg]:size-(--icon-sm)"
            >
              {searchIcon}
            </span>
          )}
          <Input
            size="sm"
            className={searchIcon ? "pl-7" : undefined}
            placeholder="Search settings"
            aria-label="Search settings"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </span>
      </div>
      <ScrollArea className="min-h-0 flex-1 md:[--scroll-fade-surface:var(--chrome)]">
        <ScrollAreaViewport className="size-full">
          <SettingsNavPopups className="flex flex-col gap-4 px-2 py-1">
            {searchActive ? (
              <nav
                aria-label="Settings search results"
                className="flex flex-col gap-3"
              >
                {results.map((result) => (
                  <div key={result.to} className="flex flex-col gap-px">
                    <button
                      type="button"
                      className={cx(
                        "relative flex h-7 w-full items-center gap-2 rounded px-2 text-left text-sm font-medium text-foreground transition-colors duration-100 outline-none select-none hover:bg-secondary focus-visible:outline-ring-inset [&_svg]:size-(--icon-sm) [&_svg]:shrink-0 [&_svg]:text-muted-foreground-1",
                        touchTarget,
                      )}
                      onClick={() => onSelectPage(result)}
                    >
                      {result.icon}
                      <span className="min-w-0 truncate">{result.title}</span>
                    </button>
                    {result.rows.map((row) => (
                      <button
                        key={row.id}
                        type="button"
                        className={cx(
                          "relative flex h-7 w-full items-center rounded py-1 pr-2 pl-[calc(1rem+var(--icon-sm))] text-left text-sm font-normal text-muted-foreground-1 transition-colors duration-100 outline-none select-none hover:bg-secondary hover:text-foreground focus-visible:outline-ring-inset",
                          touchTarget,
                        )}
                        onClick={() => onSelectRow(result, row)}
                      >
                        <span className="min-w-0 truncate">{row.title}</span>
                      </button>
                    ))}
                  </div>
                ))}
                {results.length === 0 && !searching && (
                  <p className="px-2 py-3 text-sm font-normal text-muted-foreground-2">
                    No settings found
                  </p>
                )}
              </nav>
            ) : (
              groups.map((group) => (
                <nav
                  key={group.id}
                  aria-label={group.ariaLabel}
                  className="flex flex-col gap-px"
                >
                  {group.label && (
                    <div className="flex h-7 items-center px-2 text-xs font-medium text-muted-foreground-2 select-none">
                      {group.label}
                    </div>
                  )}
                  {group.links.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      data-slot="context-menu-trigger"
                      data-nav-row={link.to}
                      data-nav-label={link.label}
                      activeProps={{ className: "active" }}
                      className={cx(
                        settingsSidebarNavLinkClass,
                        "group/nav [&.active]:bg-secondary [&.active]:text-foreground",
                      )}
                    >
                      {link.icon}
                      <span className="min-w-0 truncate">{link.label}</span>
                    </Link>
                  ))}
                </nav>
              ))
            )}
          </SettingsNavPopups>
        </ScrollAreaViewport>
      </ScrollArea>
      <footer className="shrink-0 border-t-[0.03125rem] border-border-1 p-2">
        {footer}
      </footer>
    </div>
  );
}
