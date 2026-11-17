import { useAtomRefresh, useAtomSet, useAtomValue } from "@effect/atom-react";
import { useNavigate } from "@tanstack/react-router";
import { DateTime } from "effect";
import { AsyncResult } from "effect/reactivity";
import { type FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { AppTopBar } from "@/components/app-top-bar";
import {
  type FilterOptions,
  FilterSearch,
  type FilterSelection,
  useFilterSearch,
} from "@/components/filter-search";
import {
  DateRangeSubmenu,
  DisplayChoiceSub,
  DisplayMenu,
  DisplayToggle,
  dateRangeLabel,
  FilterChipBar,
  type IconPickerSlot,
  MenuSubmenu,
  menuCheckClassName,
  menuIconSlotClassName,
  newSavedViewId,
  SavedViewTab,
  SaveViewDialog,
  ViewTab,
  ViewToolbar,
  ViewToolbarIconButton,
  viewToolbarIconButtonClassName,
} from "@/components/view-toolbar";
import type { JamId, OrgId, ThreadFolderId } from "@/data/api/schemas/ids";
import type { ThreadCard } from "@/data/api/schemas/thread";
import { captainsAtom } from "@/data/atoms/captains";
import { reactivityKeys } from "@/data/atoms/conventions";
import {
  archiveThreadsAtom,
  renameThreadAtom,
  unarchiveThreadsAtom,
} from "@/data/atoms/jams";
import { projectsAtom } from "@/data/atoms/projects";
import { currentUserAtom, organizationsAtom } from "@/data/atoms/session";
import {
  addToFolderAtom,
  createFolderAtom,
  folderBoardAtom,
  threadOrganizationKeys,
} from "@/data/atoms/threadOrganization";
import { allThreadsAtom } from "@/data/atoms/threads";
import { BulkBar } from "@/primitives/bulk-bar";
import { Button } from "@/primitives/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/primitives/dialog";
import { Icon } from "@/primitives/icon";
import { ICON_IDS, type IconId } from "@/primitives/icon/icon-ids";
import { Input } from "@/primitives/input";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "@/primitives/menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import { ThreadsList } from "../threads-list";
import {
  activeViewKey,
  buildSections,
  defaultThreadFilters,
  emptyText,
  filterThreads,
  groupingLabels,
  orderingLabels,
  type ProjectSummary,
  type ThreadFilters,
  type ThreadListItem,
  type ThreadSection,
  type ThreadsPageState,
  threadFilterChips,
  threadViews,
} from "./model";
import { useStoredPageState } from "./stored-state";

const removeIcon = <Icon name="x" className="size-3" />;
const toolbarIcons = { remove: removeIcon };
const listIcons = {
  chevron: <Icon name="chevron-right" className="size-(--icon-xs)" />,
};

const toDate = (value: DateTime.Utc) => DateTime.toDate(value);

export const toListItem = (card: ThreadCard): ThreadListItem => {
  const automation = card.automation as
    | { id?: unknown; name?: unknown }
    | undefined;
  return {
    id: card.id,
    title: card.title,
    status: card.status,
    archived: card.archived,
    archivedIdleDays: card.archivedIdleDays,
    threadNumber: card.threadNumber,
    userId: card.userId,
    participated: card.participated,
    origin: card.origin,
    projectId: card.projectId,
    pinned: card.pinned,
    needsYou: card.needsYou,
    hasUnreads: card.hasUnreads,
    personal: card.personal,
    lastModelId: card.lastModelId,
    pulls: card.pulls.map((pull) => ({
      state: pull.state,
      number: pull.number,
      repo: pull.repo,
    })),
    createdAt: toDate(card.createdAt),
    sortActivityAt: toDate(card.sortActivityAt),
    lastActivityAt:
      card.lastActivityAt === null ? null : toDate(card.lastActivityAt),
    settledAt: card.settledAt == null ? null : toDate(card.settledAt),
    automationName:
      typeof automation?.name === "string" ? automation.name : null,
    automationId: typeof automation?.id === "string" ? automation.id : null,
    captain: null,
  };
};

type CaptainRow = {
  id: string;
  name: string;
  projectId: string | null;
  ownerId: string;
  createdAt: string;
  imageUrl: string | null;
  memberIds?: ReadonlyArray<string>;
};

/** Captains come back undecoded; read the fields the list draws. */
export const captainItems = (
  value: unknown,
  viewerId: string | undefined,
): ThreadListItem[] => {
  if (!Array.isArray(value)) return [];
  return (value as CaptainRow[]).map((captain) => ({
    id: captain.id,
    title: captain.name,
    status: "idle",
    archived: false,
    archivedIdleDays: null,
    threadNumber: null,
    userId: captain.ownerId,
    participated:
      viewerId !== undefined &&
      (captain.ownerId === viewerId ||
        (captain.memberIds ?? []).includes(viewerId)),
    origin: "web",
    projectId: captain.projectId,
    pinned: false,
    needsYou: false,
    hasUnreads: false,
    personal: false,
    lastModelId: null,
    pulls: [],
    createdAt: new Date(captain.createdAt),
    sortActivityAt: new Date(captain.createdAt),
    lastActivityAt: new Date(captain.createdAt),
    settledAt: null,
    automationName: null,
    automationId: null,
    captain: { name: captain.name, avatarUrl: captain.imageUrl },
  }));
};

const modelLabels: Record<string, string> = {
  "anthropic/claude-opus": "Claude Opus",
  "anthropic/claude-sonnet": "Claude Sonnet",
};

const modelName = (id: string) => modelLabels[id];

export type ThreadsPageViewProps = {
  threads: ReadonlyArray<ThreadListItem>;
  captains: ReadonlyArray<ThreadListItem>;
  projects: ReadonlyArray<ProjectSummary>;
  viewerId: string | undefined;
  loading: boolean;
  failed: boolean;
  onRetry?: () => void;
  onCreateFolder?: (name: string) => void;
  folders?: ReadonlyArray<{
    id: string;
    name: string;
    members: ReadonlyArray<ThreadListItem>;
  }>;
  folderSections?: ReadonlyArray<ThreadSection>;
  onMoveThreads?: (ids: ReadonlyArray<string>, folderId: string) => void;
  onArchive?: (ids: ReadonlyArray<string>, archived: boolean) => void;
  onRename?: (id: string, title: string) => void;
  state: ThreadsPageState;
  onStateChange: (
    update: (state: ThreadsPageState) => ThreadsPageState,
  ) => void;
  now: number;
};

export function ThreadsPageView({
  threads,
  captains,
  projects,
  viewerId,
  loading,
  failed,
  onRetry,
  onCreateFolder,
  folders = [],
  onMoveThreads,
  onArchive,
  onRename,
  state,
  onStateChange,
  now,
}: ThreadsPageViewProps) {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [checked, setChecked] = useState<ReadonlySet<string>>(new Set());
  const [searchText, setSearchText] = useState("");
  const [moving, setMoving] = useState(false);
  const filters = state.filters;
  const setFilters = (next: ThreadFilters) =>
    onStateChange((current) => ({ ...current, filters: next }));
  const activeKey = activeViewKey(state);
  const dirty = activeKey === undefined;
  const projectMap = new Map(projects.map((project) => [project.id, project]));
  const filedMembers = folders.flatMap((folder) => folder.members);
  const authorOptions = [
    ...(viewerId === undefined
      ? []
      : [{ id: viewerId, label: "Me", terms: ["me", "you"] }]),
    ...threads.map((thread) => ({
      id: thread.userId,
      label: thread.userId,
      terms: [thread.userId],
    })),
  ];
  const searchOptions: FilterOptions = {
    author: authorOptions,
    captain: captains.map((captain) => ({
      id: captain.id,
      label: captain.title ?? "",
      terms: [captain.title ?? ""],
    })),
    repo: [],
    status: ["working", "waiting", "idle", "failed"].map((status) => ({
      id: status,
      label: status,
      terms: [status],
    })),
    label: folders.map((folder) => ({
      id: folder.id,
      label: folder.name,
      terms: [folder.name],
    })),
    since: [],
  };
  const searchSelection: FilterSelection = {
    author: filters.authors,
    captain: [],
    repo: [],
    status: filters.statuses,
    label: [],
    since: [],
  };
  const { term, search } = useFilterSearch({
    options: searchOptions,
    accepts: () => true,
    selected: searchSelection,
    text: { value: searchText, onChange: setSearchText },
    viewerId,
    onCommit: (tokens) => {
      const authors = tokens.flatMap((token) =>
        token.key === "author" ? token.values : [],
      );
      const statuses = tokens.flatMap((token) =>
        token.key === "status" ? token.values : [],
      );
      setFilters({
        ...filters,
        authors: [...new Set([...filters.authors, ...authors])],
        statuses: [...new Set([...filters.statuses, ...statuses])],
      });
    },
    onRemove: (key) => {
      if (key === "author") setFilters({ ...filters, authors: [] });
      if (key === "status") setFilters({ ...filters, statuses: [] });
    },
  });
  const searching = term.trim().length > 0;
  const visible = filterThreads(
    searching
      ? [...captains, ...threads, ...filedMembers]
      : [...captains, ...threads],
    filters,
    viewerId,
    now,
  );
  const shown = searching
    ? visible.filter((thread) =>
        (thread.title ?? "").toLowerCase().includes(term.trim().toLowerCase()),
      )
    : visible;
  const built = buildSections({
    threads: shown,
    filters,
    grouping: state.grouping,
    ordering: state.ordering,
    searching,
    now,
    projectName: (id) =>
      id === null ? "No project" : (projectMap.get(id)?.name ?? "No project"),
    authorName: (id) => (id === viewerId ? "You" : "Unknown"),
  });
  const sections = [
    ...(searching
      ? []
      : folders.map((folder) => ({
          id: folder.id,
          label: folder.name,
          members: filterThreads(folder.members, filters, viewerId, now),
          showCount: true,
        }))),
    ...built,
  ];
  const chips = threadFilterChips(filters, setFilters, {
    member: (id) => (id === viewerId ? "Me" : id),
    project: (id) => projectMap.get(id)?.name ?? id,
    automation: (id) => id,
    dateRange: (range) => dateRangeLabel(range, now),
  });

  return (
    <div
      data-slot="threads-page"
      className="relative flex min-h-0 min-w-0 flex-1 flex-col"
    >
      <AppTopBar className="sticky top-0 z-(--z-top-bar) flex min-h-11 shrink-0 items-center border-b-hairline border-border-1 bg-panel px-2">
        <h1 className="ml-2.5 min-w-0 truncate text-sm font-medium text-foreground max-md:hidden">
          Threads
        </h1>
        <div className="relative mx-2 flex min-w-0 flex-1 items-center">
          <Icon
            name="deep-search"
            size="sm"
            aria-hidden
            className="pointer-events-none absolute left-1.5 text-muted-foreground-2"
          />
          <FilterSearch
            search={search}
            aria-label="Search threads"
            placeholder="Search threads"
            className="h-7 min-w-0 w-full flex-1 rounded border-hairline border-border-1 bg-input pr-2 pl-7 text-sm text-foreground outline-none placeholder:text-muted-foreground-2 focus-visible:outline-ring-inset"
          />
        </div>
        <div className="ml-auto flex items-center gap-1.5 pl-2">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="New thread"
                  onClick={() => navigate({ to: "/new" })}
                >
                  <Icon name="plus-medium" size="sm" />
                </Button>
              }
            />
            <TooltipContent side="bottom">New thread</TooltipContent>
          </Tooltip>
        </div>
      </AppTopBar>
      <ViewToolbar
        tabs={
          <>
            {threadViews.map((view) => (
              <ViewTab
                key={view.key}
                label={view.label}
                active={activeKey === view.key}
                onClick={() => setFilters(view.filters)}
              />
            ))}
            {state.savedViews.map((view) => (
              <SavedViewTab
                key={view.id}
                view={view}
                active={activeKey === view.id}
                currentFilters={filters}
                onSelect={() => setFilters(view.filters)}
                onUpdate={(update) =>
                  onStateChange((current) => ({
                    ...current,
                    savedViews: current.savedViews.map((saved) =>
                      saved.id === view.id ? { ...saved, ...update } : saved,
                    ),
                  }))
                }
                onDelete={() =>
                  onStateChange((current) => ({
                    ...current,
                    savedViews: current.savedViews.filter(
                      (saved) => saved.id !== view.id,
                    ),
                  }))
                }
                renderIcon={renderViewIcon}
                renderIconPicker={(picker) => <ViewIconPicker {...picker} />}
                icons={toolbarIcons}
              />
            ))}
          </>
        }
        actions={
          <>
            <ViewToolbarIconButton
              label="New folder"
              onClick={() => setCreatingFolder(true)}
            >
              <Icon name="folder-1" size="sm" />
            </ViewToolbarIconButton>
            <ThreadsFilterMenu
              filters={filters}
              onChange={setFilters}
              viewerId={viewerId}
              projects={projects}
              clearable={dirty}
              now={now}
            />
            <DisplayMenu icon={<Icon name="settings-slider-hor" size="sm" />}>
              <DisplayChoiceSub
                label="Grouping"
                labels={groupingLabels}
                value={state.grouping}
                onPick={(grouping) =>
                  onStateChange((current) => ({ ...current, grouping }))
                }
              />
              <DisplayChoiceSub
                label="Ordering"
                labels={orderingLabels}
                value={state.ordering}
                onPick={(ordering) =>
                  onStateChange((current) => ({ ...current, ordering }))
                }
              />
              <MenuSeparator />
              <DisplayToggle
                label="Show duplicates in sections"
                checked={state.showFiledThreads}
                onToggle={() =>
                  onStateChange((current) => ({
                    ...current,
                    showFiledThreads: !current.showFiledThreads,
                  }))
                }
              />
            </DisplayMenu>
          </>
        }
      />
      <FilterChipBar
        chips={chips}
        dirty={dirty}
        onClear={() => setFilters(defaultThreadFilters)}
        onSave={() => setSaving(true)}
        icons={toolbarIcons}
      />
      <SaveViewDialog
        open={saving}
        onOpenChange={setSaving}
        onSave={(name) =>
          onStateChange((current) => ({
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
      <NewFolderDialog
        open={creatingFolder}
        onOpenChange={setCreatingFolder}
        onCreate={(name) => onCreateFolder?.(name)}
      />
      <ThreadsList
        sections={sections}
        projects={projectMap}
        modelName={modelName}
        groupedByProject={state.grouping === "project"}
        now={now}
        loading={loading}
        emptyText={emptyText({ failed, searching, filters })}
        checked={checked}
        onCheckedChange={setChecked}
        onDropOnSection={(sectionId, threadId) => {
          const folder = folders.find((item) => item.id === sectionId);
          if (folder !== undefined) onMoveThreads?.([threadId], folder.id);
        }}
        onArchive={(id) => onArchive?.([id], true)}
        onRename={onRename}
        icons={listIcons}
        footer={
          failed && onRetry !== undefined ? (
            <div className="flex justify-center pb-3">
              <Button variant="ghost" size="sm" onClick={onRetry}>
                Retry loading threads
              </Button>
            </div>
          ) : null
        }
      />
      {checked.size === 0 ? null : (
        <BulkBar className="sticky bottom-0 flex items-center gap-2 border-t-hairline border-border-1 bg-panel px-2 py-1.5">
          <span className="text-xs text-muted-foreground-1 tabular-nums">
            {checked.size} selected
          </span>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Move to folder"
            onClick={() => setMoving(true)}
          >
            Move to folder
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Archive"
            onClick={() => {
              onArchive?.([...checked], true);
              setChecked(new Set());
            }}
          >
            Archive
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Clear selection"
            onClick={() => setChecked(new Set())}
          >
            Clear
          </Button>
        </BulkBar>
      )}
      <Dialog open={moving} onOpenChange={setMoving}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move to folder</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-1 px-4 py-2">
            {folders.map((folder) => (
              <Button
                key={folder.id}
                variant="ghost"
                size="sm"
                onClick={() => {
                  onMoveThreads?.([...checked], folder.id);
                  setChecked(new Set());
                  setMoving(false);
                }}
              >
                {folder.name}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type ThreadsFilterMenuProps = {
  filters: ThreadFilters;
  onChange: (filters: ThreadFilters) => void;
  viewerId: string | undefined;
  projects: ReadonlyArray<ProjectSummary>;
  clearable: boolean;
  now: number;
};

const toggle = (values: ReadonlyArray<string>, value: string) =>
  values.includes(value)
    ? values.filter((existing) => existing !== value)
    : [...values, value];

const check = (on: boolean) =>
  on ? <span className={["ml-auto", menuCheckClassName].join(" ")} /> : null;

function ThreadsFilterMenu({
  filters,
  onChange,
  viewerId,
  projects,
  clearable,
}: ThreadsFilterMenuProps) {
  const participants =
    filters.participants ?? (viewerId === undefined ? [] : [viewerId]);
  const everyone =
    filters.participants !== null && filters.participants.length === 0;
  return (
    <Menu>
      <Tooltip>
        <TooltipTrigger
          render={
            <MenuTrigger
              render={
                <button
                  type="button"
                  aria-label="Filter threads"
                  className={viewToolbarIconButtonClassName}
                />
              }
            />
          }
        />
        <TooltipContent side="bottom">Filter</TooltipContent>
      </Tooltip>
      <MenuContent align="end" className="w-56">
        <MenuSubmenu
          label="Participants"
          value={
            everyone
              ? "Everyone"
              : participants.length === 1 && participants[0] === viewerId
                ? "Me"
                : String(participants.length)
          }
          contentClassName="w-56"
        >
          <MenuItem
            closeOnClick={false}
            onClick={() => onChange({ ...filters, participants: [] })}
          >
            <span className={menuIconSlotClassName} />
            Everyone
            {check(everyone)}
          </MenuItem>
          {viewerId === undefined ? null : (
            <MenuItem
              closeOnClick={false}
              onClick={() => onChange({ ...filters, participants: null })}
            >
              <span className={menuIconSlotClassName} />
              Me
              {check(filters.participants === null)}
            </MenuItem>
          )}
        </MenuSubmenu>
        <MenuSubmenu
          label="Project"
          value={
            filters.projects.length === 0
              ? undefined
              : String(filters.projects.length)
          }
          contentClassName="w-56"
        >
          {projects.map((project) => (
            <MenuItem
              key={project.id}
              closeOnClick={false}
              onClick={() =>
                onChange({
                  ...filters,
                  projects: toggle(filters.projects, project.id),
                })
              }
            >
              <span className={menuIconSlotClassName} />
              {project.name}
              {check(filters.projects.includes(project.id))}
            </MenuItem>
          ))}
        </MenuSubmenu>
        <DateRangeSubmenu
          label="Created"
          value={filters.created}
          onChange={(created) => onChange({ ...filters, created })}
        />
        <DateRangeSubmenu
          label="Since"
          hint="since"
          value={filters.updated}
          onChange={(updated) => onChange({ ...filters, updated })}
        />
        <MenuSeparator />
        <MenuItem
          closeOnClick={false}
          onClick={() =>
            onChange({
              ...filters,
              archived: filters.archived === "only" ? "exclude" : "only",
            })
          }
        >
          <span className={menuIconSlotClassName} />
          Archived only
          {check(filters.archived === "only")}
        </MenuItem>
        {clearable ? (
          <MenuItem onClick={() => onChange(defaultThreadFilters)}>
            <span className={menuIconSlotClassName} />
            Clear filters
          </MenuItem>
        ) : null}
      </MenuContent>
    </Menu>
  );
}

/** /threads: Capy's threads page over the jams and captains mocks. */
export function ThreadsPage() {
  const organizations = useAtomValue(organizationsAtom);
  const retryOrganizations = useAtomRefresh(organizationsAtom);
  return (
    <ThreadsPageData
      orgId={
        AsyncResult.isSuccess(organizations)
          ? organizations.value[0]?.id
          : undefined
      }
      orgFailed={
        AsyncResult.isFailure(organizations) ||
        (AsyncResult.isSuccess(organizations) &&
          organizations.value.length === 0)
      }
      onRetry={retryOrganizations}
    />
  );
}

function ThreadsPageData({
  orgId,
  orgFailed,
  onRetry,
}: {
  orgId: OrgId | undefined;
  orgFailed: boolean;
  onRetry: () => void;
}) {
  const [state, setState] = useStoredPageState();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);
  if (orgId === undefined)
    return (
      <ThreadsPageView
        threads={[]}
        captains={[]}
        projects={[]}
        viewerId={undefined}
        loading={!orgFailed}
        failed={orgFailed}
        onRetry={onRetry}
        state={state}
        onStateChange={setState}
        now={now}
      />
    );
  return (
    <ThreadsPageLoaded
      orgId={orgId}
      state={state}
      setState={setState}
      now={now}
    />
  );
}

function ThreadsPageLoaded({
  orgId,
  state,
  setState,
  now,
}: {
  orgId: OrgId;
  state: ThreadsPageState;
  setState: (update: (state: ThreadsPageState) => ThreadsPageState) => void;
  now: number;
}) {
  const archivedView = state.filters.archived === "only";
  const listAtom = allThreadsAtom(orgId, {
    archived: archivedView,
    excludeFiled: !state.showFiledThreads,
  });
  const list = useAtomValue(listAtom);
  const retry = useAtomRefresh(listAtom);
  const captains = useAtomValue(captainsAtom(orgId));
  const projects = useAtomValue(projectsAtom(orgId));
  const foldersResult = useAtomValue(folderBoardAtom(orgId));
  const user = useAtomValue(currentUserAtom);
  const createFolder = useAtomSet(createFolderAtom, { mode: "promise" });
  const moveToFolder = useAtomSet(addToFolderAtom, { mode: "promise" });
  const archive = useAtomSet(archiveThreadsAtom, { mode: "promise" });
  const unarchive = useAtomSet(unarchiveThreadsAtom, { mode: "promise" });
  const renameThread = useAtomSet(renameThreadAtom, { mode: "promise" });
  const viewerId = AsyncResult.isSuccess(user) ? user.value.id : undefined;
  const filed = AsyncResult.isSuccess(foldersResult)
    ? foldersResult.value.map((section) => ({
        id: section.folder.id as unknown as string,
        name: section.folder.name ?? "Untitled folder",
        members: section.items.map(toListItem),
      }))
    : [];
  const filedIds = new Set(
    filed.flatMap((folder) => folder.members.map((thread) => thread.id)),
  );
  const unfiled =
    AsyncResult.isSuccess(list) &&
    state.showFiledThreads &&
    state.filters.archived !== "only"
      ? list.value.map(toListItem).filter((thread) => !filedIds.has(thread.id))
      : AsyncResult.isSuccess(list)
        ? list.value.map(toListItem)
        : [];
  const folderSections =
    state.filters.archived !== "only" && state.showFiledThreads
      ? filed.map((folder) => ({
          id: folder.id,
          label: folder.name,
          members: folder.members,
          showCount: true,
        }))
      : [];
  return (
    <ThreadsPageView
      threads={unfiled}
      captains={
        archivedView || !AsyncResult.isSuccess(captains)
          ? []
          : captainItems(captains.value, viewerId)
      }
      projects={
        AsyncResult.isSuccess(projects)
          ? projects.value.map((project) => ({
              id: project.id,
              name: project.name,
              code: project.code,
            }))
          : []
      }
      viewerId={viewerId}
      loading={AsyncResult.isInitial(list) || list.waiting}
      failed={AsyncResult.isFailure(list)}
      onRetry={retry}
      folders={filed}
      folderSections={folderSections}
      onMoveThreads={(ids, folderId) =>
        moveToFolder({
          params: { orgId, folderId: folderId as unknown as ThreadFolderId },
          payload: { jamIds: ids.map((id) => id as unknown as JamId) },
          reactivityKeys: threadOrganizationKeys(orgId),
        }).then(
          () => toast.success("Moved to folder"),
          () => toast.error("Couldn't move threads"),
        )
      }
      onArchive={(ids, archived) =>
        (archived ? archive : unarchive)({
          params: { orgId },
          payload: { jamIds: ids.map((id) => id as unknown as JamId) },
          reactivityKeys: [
            reactivityKeys.threads(orgId),
            reactivityKeys.threadOrganization(orgId),
          ],
        }).then(
          () => toast.success(archived ? "Archived" : "Unarchived"),
          () => toast.error("Couldn't update threads"),
        )
      }
      onRename={(id, title) =>
        renameThread({
          params: { orgId, jamId: id as unknown as JamId },
          payload: { title },
          reactivityKeys: [reactivityKeys.threads(orgId)],
        }).then(
          () => toast.success("Thread renamed"),
          () => toast.error("Couldn't rename thread"),
        )
      }
      onCreateFolder={(name) =>
        createFolder({
          params: { orgId },
          payload: { name, visibility: "private", section: "threads" },
          reactivityKeys: threadOrganizationKeys(orgId),
        }).then(
          () => toast.success("Folder created"),
          () => toast.error("Couldn't create folder"),
        )
      }
      state={state}
      onStateChange={setState}
      now={now}
    />
  );
}

const renderViewIcon = (icon: string) =>
  (ICON_IDS as ReadonlyArray<string>).includes(icon) ? (
    <Icon name={icon as IconId} size="sm" />
  ) : null;

function ViewIconPicker({
  value,
  open,
  onOpenChange,
  onSelect,
}: IconPickerSlot) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change icon</DialogTitle>
        </DialogHeader>
        <div className="grid max-h-80 grid-cols-8 gap-1 overflow-y-auto px-4 py-2">
          {ICON_IDS.map((id) => (
            <button
              key={id}
              type="button"
              aria-label={id}
              aria-pressed={id === value}
              className={viewToolbarIconButtonClassName}
              onClick={() => {
                onSelect(id);
                onOpenChange(false);
              }}
            >
              <Icon name={id} size="sm" />
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function NewFolderDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string) => void;
}) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = new FormData(event.currentTarget).get("name");
    if (typeof name !== "string" || name.trim().length === 0) return;
    onCreate(name.trim());
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>New folder</DialogTitle>
          </DialogHeader>
          <div className="px-4 py-2">
            <Input
              name="name"
              placeholder="Folder name"
              aria-label="Folder name"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              type="button"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button intent="accent" type="submit">
              Create folder
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
