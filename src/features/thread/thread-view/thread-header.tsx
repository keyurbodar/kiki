import { cx } from "class-variance-authority";
import type { ReactNode } from "react";
import { AppTopBar } from "@/components/app-top-bar";
import { useCaptain, useCaptainOrgId } from "@/features/captains/overview";
import { WorkProgressEdge } from "@/features/thread/live-status";
import {
  type PaneTab,
  type TabMenuOptions,
  TabStrip,
  tabKey,
  tabLink,
} from "@/features/thread-panes/tab-strip";
import { Button } from "@/primitives/button";
import { CaptainAvatar } from "@/primitives/captain-avatar";
import { Icon } from "@/primitives/icon";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/primitives/menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";

export type ThreadMachine = {
  kind: string;
  name?: string | null;
  size?: string | null;
};

const cloudLabel = (size: string | null | undefined) =>
  size === undefined || size === null || size === ""
    ? "Cloud · Size unavailable"
    : `Cloud · ${size.charAt(0).toUpperCase()}${size.slice(1)}`;

/** Capy's machine label: the paired device by name, a cloud by its size. */
const machineMarkLabel = (machine: ThreadMachine) =>
  machine.kind === "device"
    ? `Paired device · ${machine.name ?? ""}`
    : cloudLabel(machine.size);

const asThreadMachine = (value: unknown): ThreadMachine | undefined => {
  if (typeof value !== "object" || value === null) return undefined;
  const record = value as Record<string, unknown>;
  if (typeof record.kind !== "string") return undefined;
  return {
    kind: record.kind,
    name: typeof record.name === "string" ? record.name : null,
    size: typeof record.size === "string" ? record.size : null,
  };
};

/**
 * The icon-sized mark Capy puts at the head of a plain thread's chat tab: the
 * machine the thread runs on, with its own label, or an empty span of the same
 * width while the thread has no machine yet.
 */
function MachineMark({ machine }: { machine: ThreadMachine | undefined }) {
  if (machine === undefined)
    return (
      <span
        aria-hidden
        data-machine-placeholder=""
        data-size="sm"
        className="kiki-icon"
      />
    );
  return (
    <span
      data-machine-indicator=""
      role="img"
      aria-label={machineMarkLabel(machine)}
      data-size="sm"
      className="kiki-icon"
    >
      <Icon
        name={machine.kind === "device" ? "macbook" : "cloud"}
        size={null}
        className="size-full"
      />
    </span>
  );
}

/**
 * The tile at the head of the chat tab. Capy paints the Captain's own avatar
 * there — measured identical to its sidebar row, image and background both —
 * and the thread's machine mark on everything else.
 */
function ChatTabIdentity({
  threadId,
  machine,
}: {
  threadId: string;
  machine: ThreadMachine | undefined;
}) {
  const orgId = useCaptainOrgId();
  const captain = useCaptain(orgId, threadId);
  return captain?.avatar === undefined ? (
    <MachineMark machine={machine} />
  ) : (
    <CaptainAvatar
      avatar={captain.avatar}
      name={captain.name ?? "Captain"}
      size="xs"
    />
  );
}

/** The capture's bar: 44 px, pinned, one hairline under it. */
export const threadHeaderClassName = cx(
  "sticky top-0 z-(--z-top-bar) flex min-h-11 shrink-0 items-center bg-panel px-2",
  "border-b-hairline border-border-1",
);

/** The bar's controls are 28×28 (Capy's `Open a tab`, `Thread options`, `Expand pane`). */

export type ThreadHeaderProps = {
  threadId: string;
  title: string;
  /** The thread is running, so the header's progress edge sweeps. */
  working?: boolean;
  /** The machine the thread runs on, for the chat tab's mark. */
  machine?: unknown;
  /** The pane tabs the strip lists, in the route's registry order. */
  tabs: readonly PaneTab[];
  /** The selected tab: the active pane's id, or the chat tab's. */
  activeId: string;
  /** The thread's spend, as the cost badge renders it. */
  cost?: ReactNode;
  expanded?: boolean;
  /** A dock pane is open, so expanding has something to fill the panel with. */
  canExpand?: boolean;
  /** Opens the dock on its overview pane; the control reads `Open pane`. */
  onOpenPane?: () => void;
  menu?: TabMenuOptions;
  onSelectChat: () => void;
  onSelectTab: (id: string) => void;
  /** Opens a browser tab from the strip's + menu. */
  onOpenBrowser?: () => void;
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
  working = false,
  machine,
  tabs,
  activeId,
  cost,
  expanded = false,
  canExpand = true,
  onOpenPane,
  menu,
  onSelectChat,
  onSelectTab,
  onOpenBrowser,
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
          {canExpand ? (
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
          ) : (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Open pane"
                    onClick={onOpenPane}
                  >
                    <Icon name="sidebar-simple-right-wide" size="sm" />
                  </Button>
                }
              />
              <TooltipContent side="bottom">Open pane</TooltipContent>
            </Tooltip>
          )}
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
              <ChatTabIdentity
                threadId={threadId}
                machine={asThreadMachine(machine)}
              />
              <span data-pane-tab-label={title} className="min-w-0 truncate">
                {title}
              </span>
            </span>
          ),
          onSelect: onSelectChat,
        }}
        onSelectTab={onSelectTab}
        onCloseTab={onCloseTab}
        onOpenTab={(tab) => onSelectTab(tabKey(tab))}
        onOpenBrowser={onOpenBrowser}
      />
      <WorkProgressEdge active={working} />
    </AppTopBar>
  );
}
