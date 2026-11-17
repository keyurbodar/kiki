import { useAtom } from "@effect/atom-react";
import { type ReactNode, useState } from "react";
import { Button } from "@/primitives/button";
import { Input } from "@/primitives/input";
import { ScrollArea, ScrollAreaViewport } from "@/primitives/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import { captainIssueFiltersAtom, captainIssueSearchAtom } from "./atoms";
import {
  type CaptainIssueFilters,
  type CaptainIssueView,
  captainIssuesEmptyText,
  captainIssuesFiltersKey,
  captainIssueViewLabels,
  captainIssueViews,
  filtersForView,
  viewForFilters,
} from "./filters";
import { CrossMediumGlyph, SearchGlyph } from "./glyphs";
import { useDebouncedValue } from "./use-debounced-value";

const track = (owner: string) =>
  `shared/issues/captain-issues.tsx#CaptainIssuesView:${owner}`;

const searchDebounce = 300;

/** The props Capy's `IssuesToolbar` takes from the crew issues pane. */
export type CaptainIssuesToolbarProps = {
  scope: string;
  views: ReadonlyArray<CaptainIssueView>;
  labels: Record<CaptainIssueView, string>;
  view: CaptainIssueView | undefined;
  filters: CaptainIssueFilters;
  onFilters: (filters: CaptainIssueFilters) => void;
  actions: ReactNode;
};

/** The props Capy's `IssuesList` takes from the crew issues pane. */
export type CaptainIssuesListProps = {
  scope: string;
  density: "pane";
  filtersKey: string;
  stateIds: ReadonlyArray<string>;
  stateNot: boolean;
  hideClosedSubIssues: boolean;
  now: number;
  emptyText: string;
  onOpenIssue?: (code: string) => void;
};

export type CaptainIssuesViewProps = {
  jamId: string;
  onOpenIssue?: (code: string) => void;
  /** The issues toolbar; defaults to the view tabs and the actions. */
  toolbar?: (props: CaptainIssuesToolbarProps) => ReactNode;
  /** The issues list; defaults to the list's empty line. */
  list?: (props: CaptainIssuesListProps) => ReactNode;
};

const viewTabClass =
  "inline-flex h-(--h-control-sm) shrink-0 cursor-pointer items-center justify-center gap-1 rounded border-hairline border-border-2 px-2.5 text-xs font-medium whitespace-nowrap shadow-plate outline-none select-none transition-colors duration-100 hover:text-foreground focus-visible:outline-ring-inset [&_svg]:size-(--icon-sm) [&_svg]:shrink-0 disabled:pointer-events-none disabled:opacity-55";
const viewTabSelectedClass =
  "bg-secondary text-foreground shadow-none hover:bg-secondary";
const viewTabIdleClass =
  "bg-button text-muted-foreground-1 hover:bg-button-hover";

export function CaptainIssuesToolbarFallback({
  views,
  labels,
  view,
  onFilters,
  actions,
}: CaptainIssuesToolbarProps) {
  return (
    <div className="flex min-h-11 shrink-0 items-center gap-2 px-2">
      <div className="scrollbar-hide mask-fade-r-scroll flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto py-1.5">
        {views.map((option) => (
          <button
            key={option}
            data-track-owner="shared/issues/issues-toolbar.tsx#IssuesToolbar:ViewTab.1"
            type="button"
            aria-pressed={option === view}
            className={`${viewTabClass} ${option === view ? viewTabSelectedClass : viewTabIdleClass}`}
            onClick={() => onFilters(filtersForView(option))}
          >
            {labels[option]}
          </button>
        ))}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">{actions}</div>
    </div>
  );
}

export function CaptainIssuesListFallback({
  emptyText,
}: CaptainIssuesListProps) {
  return (
    <div className="px-2 py-3 text-center text-sm font-normal text-muted-foreground-2">
      {emptyText}
    </div>
  );
}

/** The crew issues pane: the issues of a Captain's crew, searchable. */
export function CaptainIssuesView({
  jamId,
  onOpenIssue,
  toolbar = CaptainIssuesToolbarFallback,
  list = CaptainIssuesListFallback,
}: CaptainIssuesViewProps) {
  const [now] = useState(() => Date.now());
  const [filters, setFilters] = useAtom(captainIssueFiltersAtom(jamId));
  const [search, setSearch] = useAtom(captainIssueSearchAtom(jamId));
  const [focusSearch, setFocusSearch] = useState(false);
  const query = useDebouncedValue(search.text.trim(), searchDebounce);
  const view = viewForFilters(captainIssueViews, filters);
  const searchLabel = search.open ? "Close search" : "Search";

  const searchToggle = (
    <Tooltip>
      <TooltipTrigger
        data-track-owner={track("TooltipTrigger.1")}
        render={
          <Button
            data-track-owner={track("Button.1")}
            variant="ghost"
            size="icon-sm"
            aria-label={searchLabel}
            onClick={() => {
              setFocusSearch(!search.open);
              setSearch({ text: "", open: !search.open });
            }}
          >
            {search.open ? <CrossMediumGlyph /> : <SearchGlyph />}
          </Button>
        }
      />
      <TooltipContent side="bottom">{searchLabel}</TooltipContent>
    </Tooltip>
  );

  return (
    <>
      {search.open && (
        <div className="flex min-h-11 shrink-0 items-center gap-1.5 px-2">
          <div className="ml-2.5 flex min-w-0 flex-1 items-center gap-1.5">
            <SearchGlyph className="size-(--icon-base) shrink-0 text-icon-muted" />
            <Input
              autoFocus={focusSearch}
              variant="blank"
              size="base"
              value={search.text}
              placeholder="Search issues"
              aria-label="Search issues"
              className="min-w-0 flex-1 px-0 text-sm font-medium"
              onChange={(event) => {
                const text = event.target.value;
                setSearch((current) => ({ ...current, text }));
              }}
              onKeyDown={(event) => {
                if (event.key !== "Escape") return;
                setFocusSearch(false);
                setSearch({ text: "", open: false });
              }}
            />
          </div>
          {searchToggle}
        </div>
      )}
      {toolbar({
        scope: jamId,
        views: captainIssueViews,
        labels: captainIssueViewLabels,
        view,
        filters,
        onFilters: setFilters,
        actions: search.open ? null : searchToggle,
      })}
      <ScrollArea key={view ?? "custom"} className="relative min-h-0 flex-1">
        <ScrollAreaViewport className="size-full overscroll-contain">
          <div className="flex min-h-full flex-col pb-16">
            {list({
              scope: jamId,
              density: "pane",
              filtersKey: captainIssuesFiltersKey(filters, query),
              stateIds: filters.stateIds,
              stateNot: filters.stateNot,
              hideClosedSubIssues: filters.hideClosedSubIssues,
              now,
              emptyText: captainIssuesEmptyText(query, view),
              onOpenIssue,
            })}
          </div>
        </ScrollAreaViewport>
      </ScrollArea>
    </>
  );
}
