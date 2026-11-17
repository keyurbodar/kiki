import { Glyph, SidebarThreads } from "@/components/sidebar-threads";
import { Button } from "@/primitives/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import { SidebarThreadRow } from "../sidebar-thread-row";
import {
  type SidebarThreadsController,
  useSidebarThreads,
} from "../sidebar-threads-data";
import { CaptainOptionsMenu, ThreadOptionsMenu } from "../thread-options-menu";

export type SidebarThreadsPanelProps = {
  controller?: SidebarThreadsController;
  onNewThread?: () => void;
  onNewCaptain?: () => void;
  onNewFolder?: () => void;
  onSearch?: () => void;
  onViewAll?: () => void;
  onMarkAllRead?: () => void;
};

function HeaderButton({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label={label} onClick={onClick}>
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
  const sidebar = controller ?? fallback;
  const { view } = sidebar;
  const actions =
    view.mode === "captains" ? (
      <>
        <HeaderButton label="New Captain" onClick={onNewCaptain} />
        <CaptainOptionsMenu
          grouping={view.grouping}
          onGroupingChange={sidebar.setGrouping}
          order={view.captainSort}
          onOrderChange={sidebar.setCaptainSort}
          density={view.density}
          onDensityChange={sidebar.setDensity}
          onNewFolder={onNewFolder}
        />
      </>
    ) : (
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
          onNewFolder={onNewFolder}
          onMarkAllRead={onMarkAllRead}
          onSearch={onSearch}
          onViewAll={onViewAll}
        />
      </>
    );
  return (
    <SidebarThreads
      view={view}
      actions={actions}
      onSectionOpenChange={sidebar.setSectionOpen}
      onShowMore={sidebar.showMore}
      onNewThread={onNewThread}
      onNewCaptain={onNewCaptain}
      renderThread={(thread, { density, active }) => (
        <SidebarThreadRow
          thread={thread}
          project={
            thread.projectId === null ? undefined : view.projects[thread.projectId]
          }
          density={density}
          active={active}
        />
      )}
    />
  );
}
