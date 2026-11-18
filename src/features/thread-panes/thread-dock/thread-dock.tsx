import type { ReactNode } from "react";
import {
  type PaneTab,
  type TabMenuOptions,
  TabStrip,
  tabKey,
  tabLabel,
} from "@/features/thread-panes/tab-strip";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { RightPanel } from "@/primitives/right-panel";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";

/** The dock's bar: 44 px, pinned, one hairline under it, as the capture has it. */
export const dockHeaderClassName =
  "flex min-h-11 shrink-0 items-center gap-1 border-b-hairline border-border-1 px-2";

export type ThreadDockProps = {
  threadId: string;
  /** The open pane tabs, in the strip's order. The chat tab stays in the chat header. */
  tabs: readonly PaneTab[];
  activeId: string | null;
  title?: string;
  menu?: TabMenuOptions;
  expanded?: boolean;
  onSelectTab: (id: string) => void;
  onCloseTab?: (id: string) => void;
  onOpenTab?: (tab: PaneTab) => void;
  /** Receives the path of the selected tab's link. */
  onToggleExpand?: () => void;
  onClose?: () => void;
  /** The open pane. */
  children?: ReactNode;
};

/**
 * The thread's right dock: the panel Capy renders beside the chat, with the open
 * pane tabs in its own 44 px bar and the pane below them. Renders into the
 * `RightPanelGroup` the thread view provides, so the panel width, the resize
 * handle and the scroll region all come from the shell primitives.
 */
export function ThreadDock({
  threadId,
  tabs,
  activeId,
  title,
  menu,
  expanded = false,
  onSelectTab,
  onCloseTab,
  onOpenTab,
  onToggleExpand,
  onClose,
  children,
}: ThreadDockProps) {
  const activeTab = tabs.find((tab) => tabKey(tab) === activeId);
  return (
    <RightPanel
      open={children !== undefined}
      fullscreen={expanded}
      className="bg-panel"
      aria-label={activeTab === undefined ? "Pane" : tabLabel(activeTab)}
    >
      <div data-slot="thread-dock-header" className={dockHeaderClassName}>
        <TabStrip
          threadId={threadId}
          tabs={tabs}
          activeId={activeId}
          menu={title === undefined ? menu : { title, ...menu }}
          onSelectTab={onSelectTab}
          onCloseTab={onCloseTab}
          onOpenTab={onOpenTab}
        />
        {onToggleExpand && (
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
        {onClose && (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Close pane"
                  onClick={onClose}
                >
                  <Icon name="sidebar-simple-right-wide" size="sm" />
                </Button>
              }
            />
            <TooltipContent side="bottom">Close pane</TooltipContent>
          </Tooltip>
        )}
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {children}
      </div>
    </RightPanel>
  );
}
