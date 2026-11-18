import type { ComponentProps, ReactNode } from "react";
import { WorkProgressEdge } from "@/features/thread/live-status";
import { Button } from "@/primitives/button";
import { RightPanelGroup } from "@/primitives/right-panel";
import { MobileIcon } from "./mobile-icon";

export type MobileThreadTab = { id: string; label: string; icon: string };

export type MobileThreadViewProps = {
  title: string;
  /** The thread is running, so the header's progress edge sweeps. */
  working?: boolean;
  /** Thread avatar (Captain or project image), shown before the title. */
  avatar?: ReactNode;
  /** Opens the navigation sheet. */
  sidebarTrigger: ReactNode;
  /** Thread options menu, with its trigger. */
  options?: ReactNode;
  /** Pane tabs open next to Chat. */
  tabs: ReadonlyArray<MobileThreadTab>;
  activeTab: string;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  /** "Open a tab" drawer, with its trigger. */
  tabMenu?: ReactNode;
  /** The chat timeline, or the active pane. */
  children: ReactNode;
  /** Composer and its footer rail; shown on the Chat tab. */
  composer?: ReactNode;
};

export const CHAT_TAB = "chat";

/** The phone thread view: title bar, tab strip, chat and composer. */
export function MobileThreadView({
  title,
  working = false,
  avatar,
  sidebarTrigger,
  options,
  tabs,
  activeTab,
  onSelectTab,
  onCloseTab,
  tabMenu,
  children,
  composer,
}: MobileThreadViewProps) {
  return (
    <RightPanelGroup storageKey={null} className="flex-1">
      <div className="flex h-dvh min-h-0 min-w-0 flex-1 flex-col overflow-clip bg-panel pt-(--safe-top)">
        <header className="sticky top-0 z-(--z-top-bar) flex min-h-10 shrink-0 items-center bg-panel px-2">
          <WorkProgressEdge active={working} />
          <span className="-mr-1 flex w-(--h-control-sm) shrink-0 items-center overflow-hidden">
            {sidebarTrigger}
          </span>
          <h1 className="absolute inset-x-12 flex min-w-0 justify-center truncate text-sm font-medium text-foreground">
            <span className="flex min-w-0 items-center gap-2 overflow-hidden whitespace-nowrap">
              {avatar}
              <span className="mask-fade-r min-w-0 overflow-hidden whitespace-nowrap">
                {title}
              </span>
            </span>
          </h1>
          <div className="ml-auto flex items-center gap-1.5 pl-2">
            {options}
          </div>
        </header>
        <div className="flex shrink-0 items-center border-b-(length:--border-width-hairline) border-border-1 px-2 pb-2">
          <div
            role="tablist"
            aria-label="Thread tabs"
            className="scrollbar-hide isolate flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto overflow-y-hidden"
          >
            <Button
              role="tab"
              variant="ghost"
              size="auto-sm"
              aria-selected={activeTab === CHAT_TAB}
              data-selected={activeTab === CHAT_TAB ? "" : undefined}
              onClick={() => onSelectTab(CHAT_TAB)}
            >
              <MobileIcon name="bubble" />
              <span>Chat</span>
            </Button>
            {tabs.map((tab) => {
              const selected = tab.id === activeTab;
              return (
                <span key={tab.id} className="group/tab relative flex shrink-0">
                  <Button
                    role="tab"
                    variant="ghost"
                    size="auto-sm"
                    aria-selected={selected}
                    data-selected={selected ? "" : undefined}
                    onClick={() => onSelectTab(tab.id)}
                  >
                    <span className="flex size-(--icon-sm) items-center justify-center empty:hidden">
                      <MobileIcon name={tab.icon} />
                    </span>
                    <span>{tab.label}</span>
                    <span className="w-4" />
                  </Button>
                  <Button
                    variant="bare"
                    size="icon-xs"
                    aria-label={`Close ${tab.label}`}
                    className="absolute top-1/2 right-1 size-5 -translate-y-1/2 rounded-(--radius-inner)"
                    onClick={() => onCloseTab(tab.id)}
                  >
                    <MobileIcon name="x" />
                  </Button>
                </span>
              );
            })}
          </div>
          <div className="flex shrink-0 items-center">{tabMenu}</div>
        </div>
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
          {children}
        </div>
        {composer !== undefined && activeTab === CHAT_TAB && (
          <div className="min-h-0 px-4 pb-[calc(0.25rem+var(--safe-bottom))]">
            <div className="mx-auto flex h-full min-h-0 w-full max-w-4xl flex-col justify-end">
              {composer}
            </div>
          </div>
        )}
      </div>
    </RightPanelGroup>
  );
}

/** The "+" at the end of the tab strip that opens the tab drawer. */
export function MobileOpenTabTrigger(
  props: Omit<ComponentProps<typeof Button>, "children">,
) {
  return (
    <Button variant="ghost" size="icon-sm" aria-label="Open a tab" {...props}>
      <MobileIcon name="plus" />
    </Button>
  );
}
