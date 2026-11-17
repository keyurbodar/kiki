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
import { projectsAtom } from "@/data/atoms/projects";
import { organizationsAtom } from "@/data/atoms/session";
import {
  NewPullDialog,
  type NewPullInput,
} from "@/features/pulls/new-pull-dialog";
import { PlusGlyph } from "@/features/pulls/pulls-list/pull-row/pull-icons";
import { PullsList } from "@/features/pulls/pulls-list/pulls-list";
import { Button } from "@/primitives/button";
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
  trailing,
  children,
}: {
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-w-0 flex-1 flex-col">
      <AppTopBar className="flex h-12 shrink-0 items-center gap-2 px-3">
        <h1 className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
          Pull requests
        </h1>
        {trailing}
      </AppTopBar>
      {children}
    </div>
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

  const result = useAtomValue(
    pullsPagesAtom(orgId, toListRequest(filters, "", now, pageLimit)),
  );
  const unfiltered = useAtomValue(
    pullsPagesAtom(orgId, toListRequest(emptyFilters, "", now, pageLimit)),
  );
  const projects = useAtomValue(projectsAtom(orgId as never));
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
      captains: [],
      labels: [],
    }),
    [projects, everyPull],
  );
  const sections = useMemo(
    () => buildSections(pulls, prefs, false, now),
    [pulls, prefs, now],
  );
  const activeKey = activeViewKey(prefs);
  const activeView =
    viewTabs.find((tab) => tab.key === activeKey)?.filters ??
    prefs.savedViews.find((view) => view.id === activeKey)?.filters;
  const dirty = activeView === undefined || !sameFilters(activeView, filters);
  const chips = pullFilterChips(filters, options, setFilters);
  const multirepo = options.repos.length > 1;

  const onCreate = (input: NewPullInput) =>
    createPull({
      params: { orgId },
      payload: {
        repo: input.repo.fullName,
        base: input.baseBranch,
        head: input.headBranch,
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

  const totalVisible = sections.reduce(
    (count, section) => count + section.members.length,
    0,
  );

  return (
    <PullsFrame
      trailing={
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
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex min-h-full flex-col pb-16">
          {AsyncResult.isInitial(result) ? null : totalVisible === 0 &&
            !prefs.showEmptySections ? (
            <EmptyState
              text={
                AsyncResult.isFailure(result)
                  ? "Action failed"
                  : emptyText(false, pulls.length, hasFilters(filters))
              }
            />
          ) : (
            <PullsList sections={sections} now={now} multirepo={multirepo} />
          )}
        </div>
      </div>
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
