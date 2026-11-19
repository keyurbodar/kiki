import type { ReactNode } from "react";
import {
  type PaneTab,
  type TabMenuOptions,
  TabStrip,
  tabKey,
  tabLabel,
} from "@/features/thread-panes/tab-strip";
import type { SplitDirection } from "@/features/thread-panes/tab-strip/rail-menu-items";
import {
  TileGroup,
  type TileNode,
  TileSurface,
} from "@/features/thread-panes/tile-surface";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { RightPanel } from "@/primitives/right-panel";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";

/** The dock's bar: 44 px, pinned, one hairline under it, as the capture has it. */
export const dockHeaderClassName =
  "flex min-h-11 shrink-0 items-center gap-1 border-b-hairline border-border-1 px-2";

/** One of the dock's split panes: the tabs it holds and the one it shows. */
export type DockGroup = {
  id: string;
  tabs: readonly PaneTab[];
  activeId: string | null;
};

export type ThreadDockProps = {
  threadId: string;
  /** The dock's groups, in the order the tree lays them out. */
  groups: readonly DockGroup[];
  /** The split tree over those groups; leaves name group ids. */
  tiles: TileNode;
  /** The group the tab strip's focus order starts from. */
  home?: string;
  title?: string;
  menu?: TabMenuOptions;
  expanded?: boolean;
  onSelectTab: (id: string) => void;
  onCloseTab?: (id: string) => void;
  onOpenTab?: (tab: PaneTab) => void;
  onOpenBrowser?: () => void;
  onToggleExpand?: () => void;
  /** Splits a tab out of its group. Absent below `md`, where Capy has no groups. */
  onSplitTab?: (id: string, direction: SplitDirection) => void;
  /** Drops a tab into another group. */
  onMoveTab?: (id: string, group: string) => void;
  /** Drags a group's divider. */
  onRatio?: (path: string, ratio: number) => void;
  /** The element a tab shows. */
  renderPane: (tab: PaneTab) => ReactNode;
};

/**
 * The thread's right dock: the panel Capy renders beside the chat, holding one
 * or more groups of pane tabs. Renders into the `RightPanelGroup` the thread
 * view provides, so the panel width, the resize handle and the scroll region all
 * come from the shell primitives; the groups inside are tiles, so a split pane
 * keeps its own strip, its own active tab and the divider between them.
 */
export function ThreadDock({
  threadId,
  groups,
  tiles,
  home,
  title,
  menu,
  expanded = false,
  onSelectTab,
  onCloseTab,
  onOpenTab,
  onOpenBrowser,
  onToggleExpand,
  onSplitTab,
  onMoveTab,
  onRatio,
  renderPane,
}: ThreadDockProps) {
  const focused =
    groups.find((group) =>
      group.tabs.some((tab) => tabKey(tab) === group.activeId),
    ) ?? groups[0];
  const focusedTab = focused?.tabs.find(
    (tab) => tabKey(tab) === focused.activeId,
  );
  const showing = (id: string) =>
    groups.some((group) => group.id === id && group.tabs.length > 0);
  const open = groups.some((group) => group.tabs.length > 0);

  const controls = (group: DockGroup) => (
    <>
      {onToggleExpand !== undefined && (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={expanded ? "Collapse pane" : "Expand pane"}
                aria-pressed={expanded}
                onClick={onToggleExpand}
              >
                <Icon name="expand-45" size="sm" />
              </Button>
            }
          />
          <TooltipContent side="bottom">
            {expanded ? "Collapse pane" : "Expand pane"}
          </TooltipContent>
        </Tooltip>
      )}
      {onCloseTab !== undefined && group.activeId !== null && (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Close pane"
                onClick={() => onCloseTab(group.activeId as string)}
              >
                <Icon name="sidebar-simple-right-wide" size="sm" />
              </Button>
            }
          />
          <TooltipContent side="bottom">Close pane</TooltipContent>
        </Tooltip>
      )}
    </>
  );

  return (
    <RightPanel
      open={open}
      fullscreen={expanded}
      className="bg-panel"
      aria-label={focusedTab === undefined ? "Pane" : tabLabel(focusedTab)}
    >
      <TileSurface
        node={tiles}
        home={home ?? groups[0]?.id}
        shown={showing}
        onRatio={onRatio}
        renderGroup={(id) => {
          const group = groups.find((candidate) => candidate.id === id);
          if (group === undefined) return null;
          const active =
            group.tabs.find((tab) => tabKey(tab) === group.activeId) ??
            group.tabs[0];
          return (
            <TileGroup
              id={id}
              stripSlot="thread-dock-header"
              strip={
                <TabStrip
                  threadId={threadId}
                  group={id}
                  tabs={group.tabs}
                  activeId={group.activeId}
                  menu={title === undefined ? menu : { title, ...menu }}
                  onSelectTab={onSelectTab}
                  onCloseTab={onCloseTab}
                  onOpenTab={onOpenTab}
                  onOpenBrowser={onOpenBrowser}
                  onSplitTab={onSplitTab}
                  onDropTab={onMoveTab}
                />
              }
              trailing={controls(group)}
            >
              {active === undefined ? null : renderPane(active)}
            </TileGroup>
          );
        }}
      />
    </RightPanel>
  );
}
