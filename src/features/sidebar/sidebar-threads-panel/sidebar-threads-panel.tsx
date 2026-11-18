import { useNavigate } from "@tanstack/react-router";
import { Glyph, SidebarThreads } from "@/components/sidebar-threads";
import { ThreadPreview } from "@/components/thread-preview";
import type { ThreadOrigin } from "@/data/api/schemas/thread";
import { Button } from "@/primitives/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import { CaptainPreviewCard } from "../sidebar-captain-preview";
import { SidebarThreadRow } from "../sidebar-thread-row";
import {
  type SidebarThreadsController,
  useSidebarThreads,
} from "../sidebar-threads-data";
import { CaptainOptionsMenu, ThreadOptionsMenu } from "../thread-options-menu";
import { ThreadFiltersMenu } from "../thread-options-menu/thread-filters";
import { CaptainRowMenu } from "../thread-row-actions/captain-row-menu";
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
  onSearch?: () => void;
  onViewAll?: () => void;
  onMarkAllRead?: () => void;
};

function HeaderButton({
  label,
  onClick,
}: {
  label: string;
  onClick?: () => void;
}) {
  if (onClick === undefined) return null;
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={label}
            onClick={onClick}
          >
            <Glyph name="plus-large" className="size-(--icon-base)" />
          </Button>
        }
      />
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

export function SidebarThreadsPanel({
  controller,
  onNewThread,
  onNewCaptain,
  onNewFolder,
  onSearch,
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
        onSearch={onSearch}
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
  onSearch,
  onViewAll,
  onMarkAllRead,
}: SidebarThreadsPanelProps & { controller: SidebarThreadsController }) {
  const sidebar = controller;
  const threadActions = useThreadActions();
  const navigate = useNavigate();
  const { view } = sidebar;
  const origins = [
    ...new Set(
      view.sections.flatMap((section) =>
        section.threads.map((thread) => thread.origin),
      ),
    ),
  ].toSorted();
  const newFolder = onNewFolder ?? (() => threadActions.startNewFolder());
  const markAllRead = onMarkAllRead ?? threadActions.markAllRead;
  const viewAll = onViewAll ?? (() => void navigate({ to: "/threads" }));
  const onFilterOrigins = (next: ReadonlyArray<ThreadOrigin>) =>
    sidebar.setFilterOrigins(next);
  const captainActions = (
    <>
      <HeaderButton label="New Captain" onClick={onNewCaptain} />
      <CaptainOptionsMenu
        order={view.captainSort}
        onOrderChange={sidebar.setCaptainSort}
        density={view.density}
        onDensityChange={sidebar.setDensity}
        onNewFolder={() => threadActions.startNewFolder("captains")}
        newFolderDisabledReason="The Captains list does not draw folder sections yet"
      />
    </>
  );
  const actions = (
    <>
      <HeaderButton label="New thread" onClick={onNewThread} />
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
        onSearch={onSearch}
        filterCount={view.filterOrigins.length}
        filters={
          origins.length === 0 ? undefined : (
            <ThreadFiltersMenu
              origins={origins}
              selected={view.filterOrigins}
              onChange={onFilterOrigins}
            />
          )
        }
        onViewAll={viewAll}
      />
    </>
  );
  return (
    <SidebarThreads
      view={view}
      actions={actions}
      captainActions={captainActions}
      renderRowMenu={(thread, rowKey) => (
        <ThreadRowMenu thread={thread} renameKey={rowKey} />
      )}
      renderCaptainMenu={(captain) => <CaptainRowMenu captain={captain} />}
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
