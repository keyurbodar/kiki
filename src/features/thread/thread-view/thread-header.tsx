import { cx } from "class-variance-authority";
import type { ReactNode } from "react";
import { AppTopBar } from "@/components/app-top-bar";
import {
  type PaneTab,
  type TabMenuOptions,
  TabStrip,
  tabKey,
  tabLink,
} from "@/features/thread-panes/tab-strip";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/primitives/menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";

/** The capture's bar: 44 px, pinned, one hairline under it. */
export const threadHeaderClassName = cx(
  "sticky top-0 z-(--z-top-bar) flex min-h-11 shrink-0 items-center bg-panel px-2",
  "border-b-hairline border-border-1",
);

export type ThreadHeaderProps = {
  threadId: string;
  title: string;
  /** The pane tabs the strip lists, in the route's registry order. */
  tabs: readonly PaneTab[];
  /** The selected tab: the active pane's id, or the chat tab's. */
  activeId: string;
  /** The thread's spend, as the cost badge renders it. */
  cost?: ReactNode;
  expanded?: boolean;
  menu?: TabMenuOptions;
  onSelectChat: () => void;
  onSelectTab: (id: string) => void;
  onCloseTab?: (id: string) => void;
  /** Receives the path of the selected tab's link. */
  onCopyLink?: (path: string) => void;
  onToggleExpand?: () => void;
};

/**
 * The thread's chat header: the thread title as the pinned chat tab, the open
 * pane tabs, the cost badge and the thread actions.
 */
export function ThreadHeader({
  threadId,
  title,
  tabs,
  activeId,
  cost,
  expanded = false,
  menu,
  onSelectChat,
  onSelectTab,
  onCloseTab,
  onCopyLink,
  onToggleExpand,
}: ThreadHeaderProps) {
  const activeTab = tabs.find((tab) => tabKey(tab) === activeId);
  return (
    <AppTopBar
      className={threadHeaderClassName}
      trailing={
        <>
          {cost}
          <Menu>
            <Tooltip>
              <TooltipTrigger
                render={
                  <MenuTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Thread options"
                      >
                        <Icon name="dot-grid-1x3-horizontal" size="sm" />
                      </Button>
                    }
                  />
                }
              />
              <TooltipContent side="bottom">Thread options</TooltipContent>
            </Tooltip>
            <MenuContent align="end" className="w-52">
              <MenuItem
                onClick={() => onCopyLink?.(tabLink(threadId, activeTab))}
              >
                <span className="flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted">
                  <Icon name="chain-link-1" size="sm" />
                </span>
                Copy link
              </MenuItem>
            </MenuContent>
          </Menu>
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
        </>
      }
    >
      <TabStrip
        threadId={threadId}
        tabs={tabs}
        activeId={activeId}
        menu={{ title, ...menu }}
        chatTab={{
          title,
          content: (
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="min-w-0 truncate">{title}</span>
            </span>
          ),
          onSelect: onSelectChat,
        }}
        onSelectTab={onSelectTab}
        onCloseTab={onCloseTab}
        onOpenTab={(tab) => onSelectTab(tabKey(tab))}
      />
    </AppTopBar>
  );
}
