import { type ReactNode, useState } from "react";
import {
  ResponsiveMenuItem,
  ResponsiveMenuLevel,
} from "@/primitives/responsive-menu";
import { ChevronLeftSmallGlyph } from "./glyphs";
import { entriesEmptyText, visibleEntries } from "./match";

const track = (owner: string) => `features/thread/pane/tab-strip.tsx#${owner}`;

export const entryIconClass =
  "flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted in-data-[intent=danger]:text-destructive";
export const entryLabelClass =
  "mask-fade-r min-w-0 flex-1 overflow-hidden whitespace-nowrap";
export const entryTrailingClass =
  "ml-auto flex shrink-0 items-center gap-1.5 text-sm font-normal text-muted-foreground-1";
export const menuSeparatorClass =
  "-mx-1 my-1 h-px bg-border-1 [[data-menu-list]>&:first-child]:hidden [[data-menu-list]>&:last-child]:hidden [[data-slot=menu-separator]+&]:hidden";
const levelClass =
  "flex flex-col transition-[opacity,translate] duration-fast ease-out-quint data-[nav=push]:starting:translate-x-2 data-[nav=push]:starting:opacity-0 data-[nav=pop]:starting:-translate-x-2 data-[nav=pop]:starting:opacity-0";
const searchInputClass =
  "h-(--h-menu-row) w-full min-w-0 bg-transparent px-2 text-sm font-normal text-foreground outline-none placeholder:text-muted-foreground-3";
const emptyClass =
  "px-2 py-3 text-center text-sm font-normal text-muted-foreground-2";

const keepMenuKeys = (event: React.KeyboardEvent<HTMLInputElement>) => {
  if (
    event.key !== "Escape" &&
    event.key !== "ArrowDown" &&
    event.key !== "ArrowUp"
  ) {
    event.stopPropagation();
  }
};

export type EntriesPageBodyProps = {
  label: string;
  searchLabel: string;
  pageSize?: number;
  children: (query: string) => ReactNode[];
};

/**
 * The body of a searchable entries page in the tab strip's open-a-tab menu:
 * a search row, the entries matching the query, "Show more" when a page size
 * cuts the list, and the empty line.
 */
export function EntriesPageBody({
  label,
  searchLabel,
  pageSize,
  children,
}: EntriesPageBodyProps) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const entries = children(query);
  const { visible, hasMore } = visibleEntries(entries, page, pageSize);
  return (
    <>
      <div data-slot="menu-search-row" className="flex shrink-0 items-center">
        <input
          className={searchInputClass}
          aria-label={searchLabel}
          placeholder={searchLabel}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(1);
          }}
          onKeyDown={keepMenuKeys}
        />
      </div>
      <div
        data-slot="menu-separator"
        className={`${menuSeparatorClass} shrink-0`}
      />
      {visible}
      {hasMore && (
        <ResponsiveMenuItem
          data-track-owner={track(
            "EntriesPageBody:ResponsiveMenuItem[Show more]",
          )}
          closeOnClick={false}
          onClick={() => setPage(page + 1)}
        >
          Show more
        </ResponsiveMenuItem>
      )}
      {entries.length === 0 && (
        <div className={emptyClass}>{entriesEmptyText(label, query)}</div>
      )}
    </>
  );
}

export type EntriesPageLevelProps = {
  label: string;
  onBack: () => void;
  children: ReactNode;
};

/**
 * A pushed level of the open-a-tab menu: the back row naming the page, a
 * separator, then the page body.
 */
export function EntriesPageLevel({
  label,
  onBack,
  children,
}: EntriesPageLevelProps) {
  return (
    <ResponsiveMenuLevel data-nav="push" className={levelClass}>
      <ResponsiveMenuLevel data-menu-list="true" className={levelClass}>
        <ResponsiveMenuItem
          data-track-owner="ui/responsive-menu.tsx#ResponsiveMenuPage:ResponsiveMenuItem[onClick=pop]"
          closeOnClick={false}
          onClick={onBack}
        >
          <span className={entryIconClass}>
            <ChevronLeftSmallGlyph />
          </span>
          <span className={`${entryLabelClass} font-medium`}>{label}</span>
        </ResponsiveMenuItem>
        <div data-slot="menu-separator" className={menuSeparatorClass} />
        {children}
      </ResponsiveMenuLevel>
    </ResponsiveMenuLevel>
  );
}

export type EntriesPageProps = EntriesPageBodyProps & {
  onBack: () => void;
};

export function EntriesPage({ onBack, ...body }: EntriesPageProps) {
  return (
    <EntriesPageLevel label={body.label} onBack={onBack}>
      <EntriesPageBody {...body} />
    </EntriesPageLevel>
  );
}
