import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { useNavigate } from "@tanstack/react-router";
import { Option } from "effect";
import { AsyncResult } from "effect/reactivity";
import { useMemo, useState } from "react";
import {
  Glyph,
  type SidebarFolder,
  SidebarThreads,
} from "@/components/sidebar-threads";
import { THREAD_DRAG_TYPE, withMoved } from "@/components/sidebar-threads/dnd";
import { ThreadPreview } from "@/components/thread-preview";
import {
  idleMemberNames,
  memberNames,
  membersAtom,
} from "@/data/atoms/members";
import { currentUserAtom } from "@/data/atoms/session";
import {
  addToFolderAtom,
  folderBoardAtom,
  removeFromFolderAtom,
  reorderFolderItemsAtom,
  threadOrganizationKeys,
} from "@/data/atoms/threadOrganization";
import { ShortcutTooltip } from "@/features/shell/keyboard";
import { Button } from "@/primitives/button";
import { toast } from "@/primitives/toaster";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import { CaptainPreviewCard } from "../sidebar-captain-preview";
import { useSidebarThreadDrag } from "../sidebar-dnd";
import { SidebarThreadRow } from "../sidebar-thread-row";
import {
  type SidebarThreadsController,
  useSidebarThreads,
} from "../sidebar-threads-data";
import { useSidebarOrgId } from "../sidebar-threads-data/live-source";
import {
  activeFacetCount,
  CaptainOptionsMenu,
  ThreadFilterFacets,
  ThreadOptionsMenu,
} from "../thread-options-menu";
import { CaptainRowMenu } from "../thread-row-actions/captain-row-menu";
import {
  type FolderMenuActions,
  FolderMenuItems,
  FolderOptionsMenu,
} from "../thread-row-actions/folder-menu";
import { NewThreadInFolderButton } from "../thread-row-actions/new-thread-in-folder";
import {
  ThreadActionsProvider,
  useThreadActions,
} from "../thread-row-actions/thread-actions-context";
import { ThreadRowMenu } from "../thread-row-actions/thread-row-menu";

export type SidebarThreadsPanelProps = {
  controller?: SidebarThreadsController;
  onNewThread?: () => void;
  onNewCaptain?: () => void;
  onNewFolder?: () => void;
  onViewAll?: () => void;
  onMarkAllRead?: () => void;
};

function HeaderButton({
  label,
  onClick,
  command,
}: {
  label: string;
  onClick?: () => void;
  /** The command the button runs, so its tooltip prints the chord that runs it. */
  command?: string;
}) {
  if (onClick === undefined) return null;
  const button = (
    <Button variant="ghost" size="icon-sm" aria-label={label} onClick={onClick}>
      <Glyph name="plus-large" className="size-(--icon-base)" />
    </Button>
  );
  if (command === undefined)
    return (
      <Tooltip>
        <TooltipTrigger render={button} />
        <TooltipContent side="bottom">{label}</TooltipContent>
      </Tooltip>
    );
  return <ShortcutTooltip command={command} label={label} render={button} />;
}

export function SidebarThreadsPanel({
  controller,
  onNewThread,
  onNewCaptain,
  onNewFolder,
  onViewAll,
  onMarkAllRead,
}: SidebarThreadsPanelProps) {
  const fallback = useSidebarThreads();
  return (
    <ThreadActionsProvider>
      <SidebarThreadsPanelBody
        controller={controller ?? fallback}
        onNewThread={onNewThread}
        onNewCaptain={onNewCaptain}
        onNewFolder={onNewFolder}
        onViewAll={onViewAll}
        onMarkAllRead={onMarkAllRead}
      />
    </ThreadActionsProvider>
  );
}

function SidebarThreadsPanelBody({
  controller,
  onNewThread,
  onNewCaptain,
  onNewFolder,
  onViewAll,
  onMarkAllRead,
}: SidebarThreadsPanelProps & { controller: SidebarThreadsController }) {
  const sidebar = controller;
  const threadActions = useThreadActions();
  const navigate = useNavigate();
  const { view } = sidebar;
  const orgId = useSidebarOrgId();
  const board = useAtomValue(folderBoardAtom((orgId ?? "") as never));
  const removeFromFolder = useAtomSet(removeFromFolderAtom, {
    mode: "promise",
  });
  const addToFolder = useAtomSet(addToFolderAtom, { mode: "promise" });
  const reorderFolderItems = useAtomSet(reorderFolderItemsAtom, {
    mode: "promise",
  });
  const membersOf = useMemo(() => {
    const map = new Map<string, ReadonlyArray<string>>();
    const sections = Option.getOrUndefined(AsyncResult.value(board)) ?? [];
    for (const section of sections) {
      map.set(
        section.folder.id,
        section.items.map((thread) => thread.id),
      );
    }
    return map;
  }, [board]);
  const folderOf = (threadId: string) => {
    for (const [folderId, ids] of membersOf) {
      if (ids.includes(threadId)) return folderId;
    }
    return undefined;
  };
  const writeOrder = (folderId: string, jamIds: ReadonlyArray<string>) => {
    if (orgId === undefined) return Promise.resolve();
    return reorderFolderItems({
      params: { orgId, folderId: folderId as never },
      payload: { jamIds: [...jamIds] as never },
      reactivityKeys: threadOrganizationKeys(orgId),
    });
  };
  const drag = useSidebarThreadDrag({
    move: (threadId, folderId, index) => {
      if (orgId === undefined) return;
      const order = withMoved(membersOf.get(folderId) ?? [], threadId, index);
      addToFolder({
        params: { orgId, folderId: folderId as never },
        payload: { jamIds: [threadId] as never },
        reactivityKeys: threadOrganizationKeys(orgId),
      })
        .then(() => writeOrder(folderId, order).then(() => undefined))
        .catch(() => toast.error("Could not move the thread"));
    },
    reorder: (threadId, folderId, index) => {
      const order = withMoved(membersOf.get(folderId) ?? [], threadId, index);
      writeOrder(folderId, order).catch(() =>
        toast.error("Could not reorder the threads"),
      );
    },
    unfile: (threadId) => {
      const folderId = folderOf(threadId);
      if (orgId === undefined || folderId === undefined) return;
      removeFromFolder({
        params: { orgId, folderId: folderId as never },
        payload: { jamIds: [threadId] as never },
        reactivityKeys: threadOrganizationKeys(orgId),
      }).catch(() => toast.error("Could not move the thread"));
    },
    isSectionOpen: (sectionId) =>
      view.sections.find((section) => section.id === sectionId)?.open ?? true,
    openSection: (sectionId) => sidebar.setSectionOpen(sectionId, true),
  });
  const origins = [
    ...new Set(
      view.sections.flatMap((section) =>
        section.threads.map((thread) => thread.origin),
      ),
    ),
  ].toSorted();
  const newFolder = onNewFolder ?? (() => threadActions.startNewFolder());
  const folderMenu = (folder: SidebarFolder): FolderMenuActions => ({
    onRename: () => threadActions.renameFolder(folder),
    onShare: () => threadActions.shareFolder(folder),
    onToggleHidden: () => threadActions.toggleFolderHidden(folder),
    onLeave: () => threadActions.leaveFolder(folder),
    onDelete: () => threadActions.removeFolder(folder),
  });
  const markAllRead = onMarkAllRead ?? threadActions.markAllRead;
  const viewAll = onViewAll ?? (() => void navigate({ to: "/threads" }));
  const filters = view.filters;
  const [filterOpen, setFilterOpen] = useState(false);
  const closeFilter = () => {
    sidebar.setFilterText("");
    setFilterOpen(false);
  };
  const viewerId = Option.getOrUndefined(
    AsyncResult.value(useAtomValue(currentUserAtom)),
  )?.id;
  const names = memberNames(
    Option.getOrUndefined(
      AsyncResult.value(
        useAtomValue(
          orgId === undefined
            ? idleMemberNames
            : (membersAtom(orgId) as typeof idleMemberNames),
        ),
      ),
    ),
  );
  const authors = [
    ...new Set(
      view.sections.flatMap((section) =>
        section.threads.flatMap((thread) => thread.card?.userId ?? []),
      ),
    ),
  ];
  const members = authors.map((id) => ({
    id,
    label: id === viewerId ? "Me" : (names.get(id) ?? id),
  }));
  const captainActions = (
    <>
      <HeaderButton label="New Captain" onClick={onNewCaptain} />
      <CaptainOptionsMenu
        order={view.captainSort}
        onOrderChange={sidebar.setCaptainSort}
        density={view.density}
        onDensityChange={sidebar.setDensity}
      />
    </>
  );
  const actions = (
    <>
      <HeaderButton
        label="New thread"
        onClick={onNewThread}
        command="thread.new"
      />
      <ThreadOptionsMenu
        sort={view.sort}
        onSortChange={sidebar.setSort}
        grouping={view.grouping}
        onGroupingChange={sidebar.setGrouping}
        density={view.density}
        onDensityChange={sidebar.setDensity}
        collapse={view.collapse}
        onCollapseChange={sidebar.setCollapse}
        onNewFolder={newFolder}
        onMarkAllRead={markAllRead}
        onSearch={() => setFilterOpen(true)}
        filterCount={activeFacetCount(filters)}
        filters={
          <ThreadFilterFacets
            filters={filters}
            onChange={sidebar.setFilters}
            origins={origins}
            projects={Object.values(view.projects)}
            members={members}
          />
        }
        onViewAll={viewAll}
        hiddenFolders={view.hiddenFolders}
        onShowFolder={(folder) =>
          threadActions.toggleFolderHidden({ ...folder, hidden: true })
        }
      />
    </>
  );
  return (
    <SidebarThreads
      view={view}
      drag={drag}
      actions={actions}
      filter={
        filterOpen
          ? {
              text: view.filterText,
              onChange: sidebar.setFilterText,
              onClose: closeFilter,
            }
          : undefined
      }
      captainActions={captainActions}
      renderRowMenu={(thread, rowKey) => (
        <ThreadRowMenu thread={thread} renameKey={rowKey} />
      )}
      renderCaptainMenu={(captain) => <CaptainRowMenu captain={captain} />}
      renderSectionActions={(section) =>
        section.kind !== "folder" ||
        section.folder === undefined ? undefined : (
          <>
            <NewThreadInFolderButton folder={section.folder} />
            <FolderOptionsMenu
              folder={section.folder}
              actions={folderMenu(section.folder)}
            />
          </>
        )
      }
      renderSectionMenu={(section) =>
        section.kind !== "folder" ||
        section.folder === undefined ? undefined : (
          <FolderMenuItems
            folder={section.folder}
            actions={folderMenu(section.folder)}
          />
        )
      }
      onSectionOpenChange={sidebar.setSectionOpen}
      onShowMore={sidebar.showMore}
      onNewThread={onNewThread}
      onNewCaptain={onNewCaptain}
      renderCaptain={(captain) =>
        captain.card === undefined ? undefined : (
          <CaptainPreviewCard captain={{ ...captain, card: captain.card }} />
        )
      }
      renderThread={(thread, { density, active, section }) => {
        const project =
          thread.projectId === null
            ? undefined
            : view.projects[thread.projectId];
        const previewProject =
          thread.project ??
          (project === undefined ? undefined : { name: project.name });
        return (
          <SidebarThreadRow
            thread={thread}
            project={project}
            density={density}
            active={active}
            drag={{
              dragging: drag.threadId === thread.id,
              onDragStart: (event) => {
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData(THREAD_DRAG_TYPE, thread.id);
                drag.start(thread.id, section.id, event);
              },
              onDragEnd: drag.end,
            }}
            actions={{
              onSettle: thread.settled
                ? undefined
                : () => threadActions.settle(thread),
              onUnsettle: thread.settled
                ? () => threadActions.unsettle(thread)
                : undefined,
              onArchive: () => threadActions.archive(thread),
              menu: (
                <ThreadRowMenu
                  thread={thread}
                  onClose={() => undefined}
                  renameKey={section.id}
                />
              ),
              renaming:
                threadActions.renamingId === thread.id &&
                (threadActions.renamingKey === null ||
                  threadActions.renamingKey === section.id),
              onRenameStart: () =>
                threadActions.startRename(thread.id, section.id),
              onRename: (title) => threadActions.commitRename(thread.id, title),
              onRenameCancel: threadActions.cancelRename,
            }}
            preview={
              thread.card === undefined ? undefined : (
                <ThreadPreview
                  thread={thread.card}
                  code={thread.code}
                  description={thread.description}
                  project={previewProject}
                  model={thread.model}
                  members={thread.members}
                  asks={thread.asks}
                  crew={thread.crew}
                  issues={thread.issues}
                  tasks={thread.tasks}
                  multirepo={thread.multirepo}
                />
              )
            }
          />
        );
      }}
    />
  );
}
