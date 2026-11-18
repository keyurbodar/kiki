import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { Option } from "effect";
import { AsyncResult } from "effect/reactivity";
import { useEffect, useMemo, useState } from "react";
import { AppTopBar } from "@/components/app-top-bar";
import {
  DisplayChoiceSub,
  DisplayMenu,
  FilterChipBar,
  newSavedViewId,
  SavedViewTab,
  SaveViewDialog,
  ViewTab,
  ViewToolbar,
} from "@/components/view-toolbar";
import type { OrgId } from "@/data/api/schemas/ids";
import { projectsAtom } from "@/data/atoms/projects";
import { useThreadsAtom } from "@/data/atoms/threads";
import { Button } from "@/primitives/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/primitives/dialog";
import { Icon } from "@/primitives/icon";
import { Input } from "@/primitives/input";
import { ScrollArea, ScrollAreaViewport } from "@/primitives/scroll-area";
import { toast } from "@/primitives/toaster";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import {
  type AutomationRow,
  AutomationsBulkBar,
  AutomationsList,
  automationReactivityKeys,
  Checkmark,
  CrossMedium,
  deleteAutomationAtom,
  MagnifyingGlass,
  mergeOptimistic,
  optimisticAutomationsAtom,
  PlusLarge,
  restoreAutomationAtom,
  SortArrowUpDown,
  type StandingThread,
  useActiveOrgId,
  useAutomationsPage,
  useOrgMembers,
  useViewer,
  withOptimisticDeleted,
} from "../automations-list";
import { CreateAutomationDialog } from "../create-dialog";
import { TemplatesSection } from "../templates-section";
import {
  AutomationsFilterMenu,
  automationFilterChips,
  type CreatorOption,
} from "./filter-menu";
import {
  type AutomationFilters,
  activeViewKey,
  automationSections,
  emptyText,
  listQuery,
  normalizeFilters,
  orderingLabels,
  viewPresets,
} from "./filters";
import { useAutomationsPageState } from "./use-page-state";

const track = (owner: string) =>
  `features/automations/automations-page.tsx#${owner}`;

const chipIcons = { remove: <CrossMedium />, check: <Checkmark /> };

function useProjectOptions(orgId: string | undefined) {
  const result = useAtomValue(projectsAtom((orgId ?? "") as OrgId));
  if (orgId === undefined) return [];
  const projects = Option.getOrUndefined(AsyncResult.value(result)) ?? [];
  return projects
    .filter((project) => !project.deleted)
    .map((project) => ({ id: project.id, name: project.name }));
}

/** The standing threads a row can name, by jam id: `KIKI-4` and its status. */
function useStandingThreads(
  orgId: string | undefined,
): ReadonlyMap<string, StandingThread> {
  const projectsResult = useAtomValue(projectsAtom((orgId ?? "") as OrgId));
  const threadsResult = useAtomValue(
    useThreadsAtom(orgId as OrgId | undefined),
  );
  return useMemo(() => {
    const projects =
      Option.getOrUndefined(AsyncResult.value(projectsResult)) ?? [];
    const page = Option.getOrUndefined(AsyncResult.value(threadsResult));
    const threads = new Map<string, StandingThread>();
    for (const thread of page?.items ?? []) {
      const project = projects.find(
        (candidate) => candidate.id === thread.projectId,
      );
      if (project !== undefined && thread.threadNumber !== null)
        threads.set(thread.id, {
          code: `${project.code}-${thread.threadNumber}`,
          status: thread.status,
        });
    }
    return threads;
  }, [projectsResult, threadsResult]);
}

function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function DeleteAutomationsDialog({
  rows,
  onOpenChange,
  onConfirm,
}: {
  rows: ReadonlyArray<AutomationRow> | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={rows !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {rows !== null && rows.length > 1
              ? "Delete automations"
              : "Delete automation"}
          </DialogTitle>
          <DialogDescription>
            Deletion stops future runs, past runs and their threads stay
            readable
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            intent="danger"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** /automations: view tabs, filters, the automation list and templates. */
export function AutomationsPage() {
  const orgId = useActiveOrgId();
  const viewer = useViewer();
  const members = useOrgMembers(orgId);
  const projectOptions = useProjectOptions(orgId);
  const standingThreads = useStandingThreads(orgId);
  const now = useNow();
  const [state, setState] = useAutomationsPageState();
  const optimistic = useAtomValue(optimisticAutomationsAtom);
  const setOptimistic = useAtomSet(optimisticAutomationsAtom);
  const deleteAutomation = useAtomSet(deleteAutomationAtom, {
    mode: "promise",
  });
  const restoreAutomation = useAtomSet(restoreAutomationAtom, {
    mode: "promise",
  });
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [savingView, setSavingView] = useState(false);
  const [checked, setChecked] = useState<ReadonlySet<string>>(new Set());
  const [pendingDelete, setPendingDelete] =
    useState<ReadonlyArray<AutomationRow> | null>(null);

  const serverQuery = JSON.stringify(listQuery(state.filters, now));
  const page = useAutomationsPage(orgId, serverQuery, members);
  const rows = mergeOptimistic(optimistic, page.rows);
  const sections = automationSections(rows, state, search, now, viewer.id);
  const activeView = activeViewKey(state);
  const dirty = activeView === undefined;

  const visibleIds = new Set(
    sections.flatMap((section) => section.members.map((row) => row.id)),
  );
  const prunedSize = [...checked].filter((id) => visibleIds.has(id)).length;
  useEffect(() => {
    if (prunedSize !== checked.size)
      setChecked(new Set([...checked].filter((id) => visibleIds.has(id))));
  });

  const setFilters = (filters: AutomationFilters) =>
    setState((current) => ({ ...current, filters: normalizeFilters(filters) }));
  const resetFilters = () => setFilters(viewPresets[0].filters);

  const creatorOptions: CreatorOption[] = [
    ...new Map(
      rows.map((row) => [
        row.creatorUserId,
        {
          id: row.creatorUserId,
          name: row.creator,
          imageUrl:
            members.find((member) => member.userId === row.creatorUserId)
              ?.imageUrl ?? null,
        },
      ]),
    ).values(),
  ].toSorted(
    (a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id),
  );

  const confirmDelete = () => {
    const targets = pendingDelete ?? [];
    if (targets.length === 0 || orgId === undefined) return;
    setOptimistic((current) =>
      targets.reduce(
        (acc, row) => withOptimisticDeleted(acc, row.id, true),
        current,
      ),
    );
    for (const row of targets)
      deleteAutomation({
        params: { orgId, automationId: row.id },
        reactivityKeys: automationReactivityKeys(orgId),
      }).catch(() => {
        setOptimistic((current) =>
          withOptimisticDeleted(current, row.id, false),
        );
        toast.error("Could not delete", { description: row.name });
      });
    setChecked(new Set());
    toast.success(
      targets.length === 1 ? "Automation deleted" : "Automations deleted",
      {
        description:
          targets.length === 1
            ? targets[0]?.name
            : `${targets.length} selected`,
        action: {
          label: "Undo",
          onClick: () => {
            setOptimistic((current) =>
              targets.reduce(
                (acc, row) => withOptimisticDeleted(acc, row.id, false),
                current,
              ),
            );
            for (const row of targets)
              restoreAutomation({
                params: { orgId, automationId: row.id },
                reactivityKeys: automationReactivityKeys(orgId),
              }).catch(() => {
                setOptimistic((current) =>
                  withOptimisticDeleted(current, row.id, true),
                );
                toast.error("Could not restore", { description: row.name });
              });
          },
        },
      },
    );
  };

  const searching = searchOpen;
  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <AppTopBar className="sticky top-0 flex min-h-11 shrink-0 items-center border-b-(length:--border-width-hairline) border-border-1 bg-panel px-2">
        {searching ? (
          <div className="ml-2.5 flex min-w-0 flex-1 items-center gap-1.5">
            <MagnifyingGlass className="size-(--icon-base) shrink-0 text-icon-muted" />
            <Input
              data-track-owner="shared/app-top-bar.tsx#AppTopBar:Input[onSelect=onSelect]"
              autoFocus
              variant="blank"
              size="base"
              value={search}
              placeholder="Search automations"
              aria-label="Search automations"
              className="min-w-0 flex-1 px-0 text-sm font-medium"
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Escape") return;
                setSearch("");
                setSearchOpen(false);
              }}
            />
          </div>
        ) : (
          <h1 className="ml-2.5 min-w-0 truncate text-sm font-medium text-foreground">
            Automations
          </h1>
        )}
        <div className="ml-auto flex items-center gap-1.5 pl-2">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  data-track-owner="shared/app-top-bar.tsx#AppTopBar:Button.1"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={searching ? "Close search" : "Search"}
                  onClick={() => {
                    if (searching) setSearch("");
                    setSearchOpen(!searching);
                  }}
                />
              }
            >
              {searching ? <CrossMedium /> : <MagnifyingGlass />}
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {searching ? "Close search" : "Search"}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              data-track-owner={track("AutomationsPage:TooltipTrigger.1")}
              render={
                <Button
                  data-track-owner={track(
                    "AutomationsPage:Button[New automation]",
                  )}
                  variant="ghost"
                  size="icon-sm"
                  aria-label="New automation"
                  onClick={() => setCreating(true)}
                />
              }
            >
              <PlusLarge />
            </TooltipTrigger>
            <TooltipContent side="bottom">New automation</TooltipContent>
          </Tooltip>
        </div>
      </AppTopBar>
      <ViewToolbar
        tabs={
          <>
            {viewPresets.map((preset) => (
              <ViewTab
                key={preset.key}
                data-track-owner={track("AutomationsPage:ViewTab.1")}
                label={preset.label}
                active={activeView === preset.key}
                onClick={() => setFilters(preset.filters)}
              />
            ))}
            {state.savedViews.map((view) => (
              <SavedViewTab
                key={view.id}
                view={view}
                active={activeView === view.id}
                currentFilters={state.filters}
                onSelect={() => setFilters(view.filters)}
                onUpdate={(update) =>
                  setState((current) => ({
                    ...current,
                    savedViews: current.savedViews.map((item) =>
                      item.id === view.id ? { ...item, ...update } : item,
                    ),
                  }))
                }
                onDelete={() =>
                  setState((current) => ({
                    ...current,
                    savedViews: current.savedViews.filter(
                      (item) => item.id !== view.id,
                    ),
                  }))
                }
              />
            ))}
          </>
        }
        actions={
          <>
            <AutomationsFilterMenu
              filters={state.filters}
              onChange={setFilters}
              projectOptions={projectOptions}
              creatorOptions={creatorOptions}
              viewer={viewer}
              onClear={resetFilters}
              clearable={dirty}
            />
            <DisplayMenu icon={<Icon name="settings-slider-ver" />}>
              <DisplayChoiceSub
                icon={<SortArrowUpDown />}
                label="Ordering"
                labels={orderingLabels}
                value={state.ordering}
                onPick={(ordering) =>
                  setState((current) => ({ ...current, ordering }))
                }
                icons={chipIcons}
              />
            </DisplayMenu>
          </>
        }
      />
      <FilterChipBar
        chips={automationFilterChips(
          state.filters,
          setFilters,
          projectOptions,
          creatorOptions,
          viewer,
        )}
        dirty={dirty}
        onClear={resetFilters}
        onSave={() => setSavingView(true)}
        icons={chipIcons}
      />
      <SaveViewDialog
        open={savingView}
        onOpenChange={setSavingView}
        onSave={(name) =>
          setState((current) => ({
            ...current,
            savedViews: [
              ...current.savedViews,
              {
                id: newSavedViewId(),
                name,
                icon: null,
                filters: current.filters,
              },
            ],
          }))
        }
      />
      <CreateAutomationDialog open={creating} onOpenChange={setCreating} />
      <DeleteAutomationsDialog
        rows={pendingDelete}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        onConfirm={confirmDelete}
      />
      <ScrollArea scrollbar={false} className="min-h-0 flex-1">
        <ScrollAreaViewport className="h-full overscroll-contain">
          <div className="@container/list flex flex-col px-2 pt-1 pb-16">
            <AutomationsList
              sections={sections}
              now={now}
              selectedId={null}
              onSelect={() => {}}
              checked={checked}
              onCheckedChange={setChecked}
              onDelete={setPendingDelete}
              loading={!page.loaded && !page.failed}
              emptyText={emptyText(search, rows.length, serverQuery)}
              orgId={orgId}
              standingThreads={standingThreads}
            />
            {page.retry === undefined ? null : (
              <div className="flex justify-center">
                <Button
                  data-track-owner={track(
                    "AutomationsPage:Button[Retry loading]",
                  )}
                  size="sm"
                  variant="ghost"
                  aria-busy={page.waiting}
                  onClick={page.retry}
                >
                  Retry loading
                </Button>
              </div>
            )}
            <TemplatesSection />
          </div>
        </ScrollAreaViewport>
      </ScrollArea>
      {checked.size > 0 ? (
        <AutomationsBulkBar
          checked={checked}
          automations={sections.flatMap((section) => section.members)}
          orgId={orgId}
          onDelete={setPendingDelete}
          onClear={() => setChecked(new Set())}
        />
      ) : null}
    </div>
  );
}
