import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { useNavigate } from "@tanstack/react-router";
import { AsyncResult } from "effect/reactivity";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppTopBar } from "@/components/app-top-bar";
import {
  FilterChipBar,
  newSavedViewId,
  SavedViewTab,
  SaveViewDialog,
  ViewTab,
  ViewToolbar,
} from "@/components/view-toolbar";
import { captainsAtom } from "@/data/atoms/captains";
import { projectsAtom } from "@/data/atoms/projects";
import { organizationsAtom } from "@/data/atoms/session";
import {
  NewPullDialog,
  type NewPullInput,
} from "@/features/pulls/new-pull-dialog";
import {
  PlusGlyph,
  SearchGlyph,
} from "@/features/pulls/pulls-list/pull-row/pull-icons";
import { PullsList } from "@/features/pulls/pulls-list/pulls-list";
import { Button } from "@/primitives/button";
import { RightPanel, RightPanelGroup } from "@/primitives/right-panel";
import { ScrollArea, ScrollAreaViewport } from "@/primitives/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import {
  createPullAtom,
  pullsPagesAtom,
  pullsReactivityKey,
} from "./data/atoms";
import { decodePullPage } from "./data/pull";
import {
  activeViewKey,
  buildSections,
  emptyFilters,
  emptyText,
  hasFilters,
  type PullFilters,
  sameFilters,
  toggle,
  toListRequest,
  viewTabs,
} from "./model";
import { usePullsPagePrefs } from "./prefs";
import {
  type PullFilterOptions,
  PullsDisplayMenu,
  PullsFilterMenu,
  pullFilterChips,
  toolbarIcons,
} from "./pulls-filters";

const pageLimit = 200;

const orgIdOf = (value: unknown) =>
  Array.isArray(value) && typeof value[0]?.id === "string"
    ? (value[0].id as string)
    : undefined;

const projectOptions = (value: unknown) =>
  Array.isArray(value)
    ? value.flatMap((project) =>
        typeof project?.id === "string" && typeof project?.name === "string"
          ? [{ id: project.id as string, label: project.name as string }]
          : [],
      )
    : [];

const captainOptions = (value: unknown) =>
  Array.isArray(value)
    ? value.flatMap((captain) =>
        typeof captain?.id === "string" &&
        typeof captain?.face?.name === "string"
          ? [{ id: captain.id as string, label: captain.face.name as string }]
          : [],
      )
    : [];

/** The /pulls page: header, view tabs, filters and the sectioned list. */
export function PullsPage() {
  const organizations = useAtomValue(organizationsAtom);
  const orgId = AsyncResult.isSuccess(organizations)
    ? orgIdOf(organizations.value)
    : undefined;
  if (orgId === undefined) {
    return (
      <PullsFrame>
        <EmptyState
          text={
            AsyncResult.isFailure(organizations)
              ? "No organization selected"
              : undefined
          }
        />
      </PullsFrame>
    );
  }
  return <PullsPageFor orgId={orgId} />;
}

function PullsFrame({
  search,
  trailing,
  children,
}: {
  search?: React.ReactNode;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <RightPanelGroup className="h-full">
      <div className="relative flex min-w-0 flex-1 flex-col">
        <AppTopBar className="sticky top-0 z-(--z-top-bar) flex min-h-11 shrink-0 items-center border-b-hairline border-border-1 bg-panel px-2">
          {search ?? (
            <h1 className="ml-2.5 min-w-0 truncate text-sm font-medium text-foreground">
              Pull requests
            </h1>
          )}
          {trailing === undefined ? null : (
            <div className="ml-auto flex shrink-0 items-center gap-1.5 pl-2">
              {trailing}
            </div>
          )}
        </AppTopBar>
        {children}
      </div>
      <RightPanel open={false} />
    </RightPanelGroup>
  );
}

/** The header's search field: opens in place of the title, closes on blur when empty. */
function HeaderSearch({
  value,
  onChange,
  onClose,
}: {
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
}) {
  return (
    <input
      type="search"
      aria-label="Search pull requests"
      placeholder="Search pull requests"
      ref={(input) => input?.focus()}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onBlur={() => {
        if (value.trim() === "") onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
      }}
      className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground-3"
    />
  );
}

function EmptyState({ text }: { text: string | undefined }) {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16 text-sm text-muted-foreground-2">
      {text}
    </div>
  );
}

function PullsPageFor({ orgId }: { orgId: string }) {
  const navigate = useNavigate();
  const [prefs, setPrefs] = usePullsPagePrefs();
  const [now] = useState(() => Date.now());
  const [newOpen, setNewOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const filters = prefs.filters;
  const setFilters = (next: PullFilters) =>
    setPrefs((current) => ({ ...current, filters: next }));
  const term = prefs.search.trim();
  const searching = term !== "";

  const result = useAtomValue(
    pullsPagesAtom(orgId, toListRequest(filters, term, now, pageLimit)),
  );
  const unfiltered = useAtomValue(
    pullsPagesAtom(orgId, toListRequest(emptyFilters, "", now, pageLimit)),
  );
  const projects = useAtomValue(projectsAtom(orgId as never));
  const captains = useAtomValue(captainsAtom(orgId as never));
  const createPull = useAtomSet(createPullAtom, { mode: "promise" });

  const pulls = AsyncResult.isSuccess(result) ? result.value : [];
  const everyPull = AsyncResult.isSuccess(unfiltered) ? unfiltered.value : [];
  const options: PullFilterOptions = useMemo(
    () => ({
      projects: AsyncResult.isSuccess(projects)
        ? projectOptions(projects.value)
        : [],
      repos: [...new Set(everyPull.map((pull) => pull.repo))].sort(),
      authors: [...new Set(everyPull.map((pull) => pull.author))]
        .sort()
        .map((login) => ({ id: login, label: login })),
      captains: AsyncResult.isSuccess(captains)
        ? captainOptions(captains.value)
        : [],
      labels: [],
    }),
    [projects, captains, everyPull],
  );
  const sections = useMemo(
    () => buildSections(pulls, prefs, searching, now),
    [pulls, prefs, searching, now],
  );
  const activeKey = activeViewKey(prefs);
  const activeView =
    viewTabs.find((tab) => tab.key === activeKey)?.filters ??
    prefs.savedViews.find((view) => view.id === activeKey)?.filters;
  const dirty = activeView === undefined || !sameFilters(activeView, filters);
  const chips = pullFilterChips(filters, options, setFilters, activeView);

  const onCreate = (input: NewPullInput) =>
    createPull({
      params: { orgId },
      payload: {
        repo: input.repo.fullName,
        baseRef: input.baseBranch,
        headRef: input.headBranch,
        title: input.title,
        body: input.body === "" ? undefined : input.body,
        draft: input.draft,
      },
      reactivityKeys: [pullsReactivityKey(orgId)],
    }).then(
      (created) => {
        const pull = decodePullPage([created]).items[0];
        if (pull === undefined) return;
        const [owner = "", repo = pull.repo] = pull.repo.split("/");
        return navigate({
          to: "/pull/$owner/$repo/$prNumber",
          params: { owner, repo, prNumber: String(pull.number) },
        });
      },
      (error: unknown) => {
        toast.error("Could not create pull request");
        throw error;
      },
    );

  return (
    <PullsFrame
      search={
        prefs.searchOpen ? (
          <HeaderSearch
            value={prefs.search}
            onChange={(search) =>
              setPrefs((current) => ({ ...current, search }))
            }
            onClose={() =>
              setPrefs((current) => ({ ...current, searchOpen: false }))
            }
          />
        ) : undefined
      }
      trailing={
        <>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Search"
                  onClick={() =>
                    setPrefs((current) => ({ ...current, searchOpen: true }))
                  }
                />
              }
            >
              <SearchGlyph className="size-(--icon-sm)" />
            </TooltipTrigger>
            <TooltipContent side="bottom">Search</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="New pull request"
                  onClick={() => setNewOpen(true)}
                />
              }
            >
              <PlusGlyph className="size-(--icon-sm)" />
            </TooltipTrigger>
            <TooltipContent side="bottom">New pull request</TooltipContent>
          </Tooltip>
        </>
      }
    >
      <ViewToolbar
        tabs={
          <>
            {viewTabs.map((tab) => (
              <ViewTab
                key={tab.key}
                label={tab.label}
                active={activeKey === tab.key}
                onClick={() => setFilters(tab.filters)}
              />
            ))}
            {prefs.savedViews.map((view) => (
              <SavedViewTab
                key={view.id}
                view={view}
                active={activeKey === view.id}
                currentFilters={filters}
                onSelect={() => setFilters(view.filters)}
                onUpdate={(update) =>
                  setPrefs((current) => ({
                    ...current,
                    savedViews: current.savedViews.map((candidate) =>
                      candidate.id === view.id
                        ? { ...candidate, ...update }
                        : candidate,
                    ),
                  }))
                }
                onDelete={() =>
                  setPrefs((current) => ({
                    ...current,
                    savedViews: current.savedViews.filter(
                      (candidate) => candidate.id !== view.id,
                    ),
                  }))
                }
                icons={toolbarIcons}
              />
            ))}
          </>
        }
        actions={
          <>
            <PullsFilterMenu
              filters={filters}
              options={options}
              clearable={hasFilters(filters)}
              onChange={setFilters}
              onClear={() => setFilters(emptyFilters)}
            />
            <PullsDisplayMenu
              grouping={prefs.grouping}
              showEmptySections={prefs.showEmptySections}
              onGrouping={(grouping) =>
                setPrefs((current) => ({ ...current, grouping }))
              }
              onToggleEmptySections={() =>
                setPrefs((current) => ({
                  ...current,
                  showEmptySections: !current.showEmptySections,
                }))
              }
            />
          </>
        }
      />
      {chips.length === 0 ? null : (
        <FilterChipBar
          chips={chips}
          dirty={dirty}
          onClear={() => setFilters(activeView ?? emptyFilters)}
          onSave={() => setSaving(true)}
          icons={toolbarIcons}
        />
      )}
      AD
      <ScrollArea className="relative min-h-0 flex-1">
        <ScrollAreaViewport className="size-full overflow-auto overscroll-contain">
          <div className="flex min-h-full flex-col pb-16">
            {AsyncResult.isFailure(result) ? (
              <EmptyState text="Action failed" />
            ) : (
              <PullsList
                sections={AsyncResult.isInitial(result) ? [] : sections}
                now={now}
                collapsed={prefs.collapsedSections}
                onToggleSection={(id) =>
                  setPrefs((current) => ({
                    ...current,
                    collapsedSections: toggle(current.collapsedSections, id),
                  }))
                }
                loading={AsyncResult.isInitial(result)}
                emptyText={emptyText(
                  searching,
                  pulls.length,
                  hasFilters(filters),
                  activeKey === "open",
                )}
              />
            )}
          </div>
        </ScrollAreaViewport>
      </ScrollArea>
      <SaveViewDialog
        open={saving}
        onOpenChange={setSaving}
        onSave={(name) =>
          setPrefs((current) => ({
            ...current,
            savedViews: [
              ...current.savedViews,
              { id: newSavedViewId(), name, icon: null, filters },
            ],
          }))
        }
      />
      <NewPullDialog
        orgId={orgId}
        open={newOpen}
        onOpenChange={setNewOpen}
        onCreate={onCreate}
      />
    </PullsFrame>
  );
}
