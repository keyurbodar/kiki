import { useAtomValue } from "@effect/atom-react";
import { useEffect, useState } from "react";
import { useNow } from "@/components/drive-directory/relative-time";
import {
  AutomationsList,
  mergeOptimistic,
  optimisticAutomationsAtom,
  useActiveOrgId,
  useAutomationsPage,
  useOrgMembers,
  useViewer,
} from "@/features/automations/automations-list";
import {
  type AutomationFilters,
  activeViewKey,
  automationSections,
  defaultPageState,
  emptyText,
  listQuery,
  normalizeFilters,
  viewPresets,
} from "@/features/automations/automations-page";
import { CreateAutomationDialog } from "@/features/automations/create-dialog";
import { TemplatesSection } from "@/features/automations/templates-section";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import {
  MobileSheet,
  MobileSheetRow,
  MobileSheetSeparator,
} from "../../sheets";
import { MobileListHeader } from "../list-header";
import {
  clearChip,
  creatorChoices,
  filterChips,
  orderingChoices,
  pickCreator,
  pickSource,
  pickStatus,
  sourceChoices,
  statusChoices,
} from "./automation-filters";

type Drawer = "filter" | "display" | null;

/** Page 19's automations list: mobile header, drawer toolbars, sections, templates. */
export function MobileAutomations() {
  const orgId = useActiveOrgId();
  const viewer = useViewer();
  const members = useOrgMembers(orgId);
  const now = useNow();
  const [filters, setFilters] = useState<AutomationFilters>(
    defaultPageState.filters,
  );
  const [ordering, setOrdering] = useState(defaultPageState.ordering);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [drawer, setDrawer] = useState<Drawer>(null);
  const [checked, setChecked] = useState<ReadonlySet<string>>(new Set());

  const serverQuery = JSON.stringify(listQuery(filters, now));
  const page = useAutomationsPage(orgId, serverQuery, members);
  const optimistic = useAtomValue(optimisticAutomationsAtom);
  const rows = mergeOptimistic(optimistic, page.rows);
  const sections = automationSections(
    rows,
    { filters, savedViews: [], ordering },
    search,
    now,
    viewer.id,
  );
  const activeView = activeViewKey({ filters, savedViews: [], ordering });
  const chips = filterChips(filters, viewer.name);

  useEffect(() => {
    setChecked((current) => {
      const visible = new Set(
        sections.flatMap((section) => section.members.map((row) => row.id)),
      );
      const next = [...current].filter((id) => visible.has(id));
      return next.length === current.size ? current : new Set(next);
    });
  }, [sections]);

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <MobileListHeader
        title={
          searchOpen ? (
            <div className="ml-2.5 flex min-w-0 flex-1 items-center gap-1.5">
              <Icon
                name="magnifying-glass"
                className="shrink-0 text-icon-muted"
              />
              <input
                aria-label="Search automations"
                placeholder="Search automations"
                className="min-w-0 flex-1 bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground-3"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== "Escape") return;
                  setSearch("");
                  setSearchOpen(false);
                }}
              />
            </div>
          ) : (
            "Automations"
          )
        }
        actions={
          <>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={searchOpen ? "Close search" : "Search"}
              aria-pressed={searchOpen}
              onClick={() => {
                if (searchOpen) setSearch("");
                setSearchOpen(!searchOpen);
              }}
            >
              <Icon name={searchOpen ? "x" : "magnifying-glass"} />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="New automation"
              onClick={() => setCreating(true)}
            >
              <Icon name="plus-large" />
            </Button>
          </>
        }
      />
      <div className="flex min-h-11 shrink-0 items-center gap-2 px-2">
        <div className="scrollbar-hide flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto py-1.5">
          {viewPresets.map((preset) => (
            <Button
              key={preset.key}
              variant="outline"
              size="auto-xs"
              aria-pressed={activeView === preset.key}
              data-active={activeView === preset.key ? "" : undefined}
              className={
                activeView === preset.key
                  ? "bg-secondary text-foreground"
                  : "bg-button text-muted-foreground-1"
              }
              onClick={() => setFilters(normalizeFilters(preset.filters))}
            >
              {preset.label}
            </Button>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Filter automations"
            aria-haspopup="dialog"
            onClick={() => setDrawer("filter")}
          >
            <Icon name="filter-1" size="sm" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Display options"
            aria-haspopup="dialog"
            onClick={() => setDrawer("display")}
          >
            <Icon name="settings-slider-ver" size="sm" />
          </Button>
        </div>
      </div>
      {chips.length === 0 ? null : (
        <div className="flex shrink-0 flex-wrap items-center gap-1.5 px-2 pb-1.5">
          {chips.map((chip) => (
            <span
              key={chip.key}
              data-slot="filter-chip"
              className="flex h-6 max-w-full shrink-0 items-center overflow-clip rounded border-(length:--border-width-hairline) border-border-2 bg-card text-xs font-normal whitespace-nowrap shadow-plate"
            >
              <span className="flex shrink-0 items-center gap-1 px-1.5 text-foreground">
                <Icon name="filter-1" size="xs" className="text-icon-muted" />
                {chip.property}
              </span>
              <span className="flex h-full shrink-0 items-center gap-1 border-l-(length:--border-width-hairline) border-border-2 px-1.5 text-muted-foreground-2">
                is
              </span>
              <span className="flex h-full min-w-0 shrink items-center overflow-hidden px-1.5 font-medium text-foreground">
                {chip.value}
              </span>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={`Remove ${chip.property} filter`}
                onClick={() =>
                  setFilters(normalizeFilters(clearChip(filters, chip.key)))
                }
              >
                <Icon name="x" size="xs" />
              </Button>
            </span>
          ))}
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="flex flex-col px-2 pt-1 pb-16">
          <AutomationsList
            sections={sections}
            now={now}
            selectedId={null}
            onSelect={() => {}}
            checked={checked}
            onCheckedChange={setChecked}
            onDelete={() => {}}
            loading={page.waiting}
            emptyText={emptyText(search, rows.length, serverQuery)}
            orgId={orgId}
          />
          <TemplatesSection />
        </div>
      </div>
      <CreateAutomationDialog open={creating} onOpenChange={setCreating} />
      <MobileSheet
        label="Filter automations"
        open={drawer === "filter"}
        onOpenChange={(open) => setDrawer(open ? "filter" : null)}
      >
        {creatorChoices(filters, viewer.name).map((choice) => (
          <ChoiceRow
            key={choice.key}
            label={choice.label}
            checked={choice.checked}
            onPick={() =>
              setFilters(normalizeFilters(pickCreator(filters, choice.key)))
            }
          />
        ))}
        <MobileSheetSeparator />
        {statusChoices(filters).map((choice) => (
          <ChoiceRow
            key={choice.key}
            label={choice.label}
            checked={choice.checked}
            onPick={() =>
              setFilters(normalizeFilters(pickStatus(filters, choice.key)))
            }
          />
        ))}
        <MobileSheetSeparator />
        {sourceChoices(filters).map((choice) => (
          <ChoiceRow
            key={choice.key}
            label={choice.label}
            checked={choice.checked}
            onPick={() =>
              setFilters(normalizeFilters(pickSource(filters, choice.key)))
            }
          />
        ))}
      </MobileSheet>
      <MobileSheet
        label="Display"
        open={drawer === "display"}
        onOpenChange={(open) => setDrawer(open ? "display" : null)}
      >
        {orderingChoices(ordering).map((choice) => (
          <MobileSheetRow
            key={choice.key}
            label={choice.label}
            aria-checked={choice.checked}
            onClick={() => {
              setOrdering(choice.key as typeof ordering);
              setDrawer(null);
            }}
          />
        ))}
      </MobileSheet>
    </div>
  );
}

/** Filter rows stack without closing the drawer, so several axes change at once. */
function ChoiceRow({
  label,
  checked,
  onPick,
}: {
  label: string;
  checked: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      data-slot="responsive-menu-item"
      aria-checked={checked}
      role="menuitemcheckbox"
      onClick={onPick}
      className="relative flex h-(--h-menu-row) w-full min-w-0 cursor-pointer items-center gap-2 rounded px-2 text-left text-sm font-normal text-foreground outline-none select-none hover:bg-(--popover-hover) focus-visible:bg-(--popover-hover)"
    >
      <span className="mask-fade-r min-w-0 flex-1 overflow-hidden whitespace-nowrap">
        {label}
      </span>
      {checked ? (
        <Icon name="checkmark-1" size="sm" className="ml-auto" />
      ) : null}
    </button>
  );
}
