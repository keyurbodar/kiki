import { Link, useRouterState } from "@tanstack/react-router";
import {
  type ComponentProps,
  type DragEvent,
  type PointerEvent,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { SidebarAnnouncements } from "@/components/sidebar-announcements";
import { SidebarDealReminder } from "@/components/sidebar-deal-reminder";
import {
  type SidebarMode,
  SidebarModeToggle,
} from "@/components/sidebar-mode-toggle";
import {
  moveSidebarNavItem,
  SIDEBAR_NAV_CONFIG,
  type SidebarNavEntry,
  type SidebarNavItem,
  SidebarPagesMenuItems,
  sidebarNavPages,
  splitSidebarBar,
  type UseSidebarNavOptions,
  useSidebarNav,
} from "@/components/sidebar-nav-editor";
import { SidebarReferralMenu } from "@/components/sidebar-referral-menu";
import { SidebarSetupCard } from "@/components/sidebar-setup-card";
import { UserMenu } from "@/components/user-menu";
import { SidebarThreadsPanel } from "@/features/sidebar/sidebar-threads-panel";
import { openCommandPalette } from "@/lib/command-palette-events";
import { Button } from "@/primitives/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from "@/primitives/context-menu";
import { Icon } from "@/primitives/icon";
import {
  MenuContent,
  MenuSeparator,
  MenuSub,
  MenuSubTrigger,
  MenuTrigger,
} from "@/primitives/menu";
import {
  ResponsiveMenu,
  ResponsiveMenuItem,
} from "@/primitives/responsive-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import { CapyMark } from "./capy-mark";
import {
  bareIconSmButton,
  barLinkButton,
  cx,
  ghostIconSmButton,
  menuIconSlot,
} from "./classes";
import {
  DotGrid1x3HorizontalIcon,
  EditSmallIcon,
  MagnifyingGlassIcon,
  SettingsSliderThreeIcon,
} from "./icons";

export const SIDEBAR_BAR_ITEM_WIDTH = 28;

export type AppSidebarProps = ComponentProps<"div"> & {
  showModeToggle?: boolean;
  mode?: SidebarMode;
  defaultMode?: SidebarMode;
  onModeChange?: (mode: SidebarMode) => void;
  nav?: UseSidebarNavOptions;
  memory?: boolean;
  sidebarOpen?: boolean;
  onSidebarToggle?: () => void;
};

const isActivePath = (pathname: string, to: string, exact?: boolean) =>
  pathname === to || (!exact && pathname.startsWith(`${to}/`));

const mouseOnlyDrag = (event: PointerEvent<HTMLElement>) => {
  event.currentTarget.draggable = event.pointerType === "mouse";
};

function SidebarBarLink({
  item,
  "data-track-owner": trackOwner,
}: {
  item: SidebarNavItem;
  "data-track-owner"?: string;
}) {
  const { to, exact, label, icon: PageIcon } = SIDEBAR_NAV_CONFIG[item];
  const active = useRouterState({
    select: (state) => isActivePath(state.location.pathname, to, exact),
  });
  return (
    <Button
      data-track-owner={trackOwner}
      render={
        <Link
          data-track-owner="shared/app-sidebar.tsx#SidebarBarLink:SidebarContextLink.1"
          to={to}
          draggable
          onPointerDown={mouseOnlyDrag}
        />
      }
      variant="ghost"
      size="sm"
      aria-label={label}
      data-selected={active ? "" : undefined}
      className={barLinkButton}
    >
      <PageIcon />
    </Button>
  );
}

export function AppSidebar({
  showModeToggle = true,
  mode,
  defaultMode,
  onModeChange,
  nav: navOptions,
  memory,
  sidebarOpen = true,
  onSidebarToggle,
  className,
  ...props
}: AppSidebarProps) {
  const nav = useSidebarNav(navOptions);
  const pages = sidebarNavPages(nav.entries, { memory });
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const barRef = useRef<HTMLElement>(null);
  const [capacity, setCapacity] = useState<number | null>(null);
  const [dragging, setDragging] = useState<SidebarNavItem | null>(null);
  const [dropTarget, setDropTarget] = useState<{
    item: SidebarNavItem;
    after: boolean;
  } | null>(null);

  useLayoutEffect(() => {
    const bar = barRef.current;
    if (bar === null || typeof ResizeObserver === "undefined") return;
    const measure = () =>
      setCapacity(Math.floor(bar.clientWidth / SIDEBAR_BAR_ITEM_WIDTH));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(bar);
    return () => observer.disconnect();
  }, []);

  const { shown, overflow, more } = splitSidebarBar(pages, capacity);
  const overflowActive = overflow.some((page) => {
    const { to, exact } = SIDEBAR_NAV_CONFIG[page.item];
    return isActivePath(pathname, to, exact);
  });

  const barPage = (page: SidebarNavEntry) => {
    const { label } = SIDEBAR_NAV_CONFIG[page.item];
    const marked = dropTarget?.item === page.item;
    return (
      // biome-ignore lint/a11y/noStaticElementInteractions: drop target wrapper around the bar link, as in Capy
      <span
        key={page.item}
        data-bar-page={page.item}
        className={cx(
          "relative flex",
          marked &&
            "before:absolute before:inset-y-1 before:w-0.5 before:rounded-full before:bg-primary",
          marked && (dropTarget.after ? "before:-right-px" : "before:-left-px"),
        )}
        onDragStart={() => setDragging(page.item)}
        onDragEnd={() => {
          setDragging(null);
          setDropTarget(null);
        }}
        onDragOver={(event: DragEvent<HTMLSpanElement>) => {
          if (dragging === null || dragging === page.item || !nav.editable)
            return;
          event.preventDefault();
          const box = event.currentTarget.getBoundingClientRect();
          const after = event.clientX > box.left + box.width / 2;
          if (dropTarget?.item !== page.item || dropTarget.after !== after)
            setDropTarget({ item: page.item, after });
        }}
        onDrop={(event: DragEvent<HTMLSpanElement>) => {
          const moving = dragging;
          const target = dropTarget;
          setDragging(null);
          setDropTarget(null);
          if (moving === null || target === null) return;
          event.preventDefault();
          nav.save(moveSidebarNavItem(nav.entries, moving, target));
        }}
      >
        <Tooltip>
          <TooltipTrigger
            data-track-owner="shared/app-sidebar.tsx#AppSidebar:TooltipTrigger.1"
            render={
              <SidebarBarLink
                data-track-owner="shared/app-sidebar.tsx#AppSidebar:SidebarBarLink.1"
                item={page.item}
              />
            }
          />
          <TooltipContent side="top">{label}</TooltipContent>
        </Tooltip>
      </span>
    );
  };

  const footer = (
    <footer className="flex shrink-0 items-center gap-1 border-t-hairline border-border-1 p-2">
      <UserMenu />
      <nav
        ref={barRef}
        aria-label="Main"
        className="ml-auto flex h-7 min-w-0 flex-1 justify-end overflow-hidden"
        onDragLeave={(event: DragEvent<HTMLElement>) => {
          if (
            event.relatedTarget instanceof Node &&
            event.currentTarget.contains(event.relatedTarget)
          )
            return;
          setDropTarget(null);
        }}
      >
        {shown.map(barPage)}
        {more ? (
          <ResponsiveMenu>
            <Tooltip>
              <TooltipTrigger
                data-track-owner="shared/app-sidebar.tsx#AppSidebar:TooltipTrigger.2"
                render={
                  <MenuTrigger
                    data-track-owner="shared/app-sidebar.tsx#AppSidebar:ResponsiveMenuTrigger.1"
                    render={
                      <Button
                        data-track-owner="shared/app-sidebar.tsx#AppSidebar:Button[More]"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="More"
                        data-selected={overflowActive ? "" : undefined}
                        className={ghostIconSmButton}
                      />
                    }
                  >
                    <DotGrid1x3HorizontalIcon />
                  </MenuTrigger>
                }
              />
              <TooltipContent side="top">More</TooltipContent>
            </Tooltip>
            <MenuContent align="end" side="top" className="w-48">
              {overflow.map((page) => {
                const {
                  to,
                  label,
                  icon: PageIcon,
                } = SIDEBAR_NAV_CONFIG[page.item];
                return (
                  <ResponsiveMenuItem
                    key={page.item}
                    data-track-owner="shared/app-sidebar.tsx#AppSidebar:ResponsiveMenuItem.1"
                    render={
                      <Link
                        data-track-owner="shared/app-sidebar.tsx#AppSidebar:Link.1"
                        to={to}
                        draggable
                        onPointerDown={mouseOnlyDrag}
                      />
                    }
                  >
                    <span className={menuIconSlot}>
                      <PageIcon />
                    </span>
                    {label}
                  </ResponsiveMenuItem>
                );
              })}
              {overflow.length === 0 ? null : <MenuSeparator />}
              <MenuSub>
                <MenuSubTrigger>
                  <span className={menuIconSlot}>
                    <SettingsSliderThreeIcon />
                  </span>
                  Sidebar pages
                </MenuSubTrigger>
                <MenuContent className="w-48">
                  <SidebarPagesMenuItems nav={nav} memory={memory} />
                </MenuContent>
              </MenuSub>
            </MenuContent>
          </ResponsiveMenu>
        ) : null}
      </nav>
    </footer>
  );

  return (
    <div
      className={cx(
        "flex h-full min-h-0 w-full flex-col pt-2 [[data-tab-strip]_&]:pt-0",
        className,
      )}
      {...props}
    >
      <header className="flex h-11 shrink-0 items-center gap-1 px-2 pl-4">
        {showModeToggle ? (
          <div className="flex">
            <SidebarModeToggle
              data-track-owner="shared/app-sidebar.tsx#AppSidebar:SidebarModeToggle.1"
              mode={mode}
              defaultMode={defaultMode}
              onModeChange={onModeChange}
            />
          </div>
        ) : (
          <Tooltip>
            <TooltipTrigger
              data-track-owner="shared/app-sidebar.tsx#AppSidebar:TooltipTrigger.3"
              render={
                <Button
                  data-track-owner="shared/app-sidebar.tsx#AppSidebar:Button[Home]"
                  render={
                    <Link
                      data-track-owner="shared/app-sidebar.tsx#AppSidebar:Link.2"
                      to="/new"
                    />
                  }
                  variant="bare"
                  size="icon-sm"
                  aria-label="Home"
                  className={cx(bareIconSmButton, "-ml-1")}
                >
                  <CapyMark className="h-5" />
                </Button>
              }
            />
            <TooltipContent side="bottom">Home</TooltipContent>
          </Tooltip>
        )}
        <div className="ml-auto flex items-center">
          <Tooltip>
            <TooltipTrigger
              data-track-owner="shared/app-sidebar.tsx#AppSidebar:TooltipTrigger.4"
              render={
                <Button
                  data-track-owner="shared/app-sidebar.tsx#AppSidebar:Button[Search]"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Search"
                  className={ghostIconSmButton}
                  onClick={() => openCommandPalette()}
                >
                  <MagnifyingGlassIcon />
                </Button>
              }
            />
            <TooltipContent side="bottom">Search</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              data-track-owner="shared/app-sidebar.tsx#AppSidebar:TooltipTrigger.5"
              render={
                <Button
                  data-track-owner="shared/app-sidebar.tsx#AppSidebar:Button.1"
                  render={
                    <Link
                      data-track-owner="shared/app-sidebar.tsx#AppSidebar:Link.3"
                      to="/new"
                    />
                  }
                  variant="ghost"
                  size="icon-sm"
                  aria-label={SIDEBAR_NAV_CONFIG.newThread.label}
                  data-track-action="thread.new"
                  className={ghostIconSmButton}
                >
                  <EditSmallIcon />
                </Button>
              }
            />
            <TooltipContent side="bottom">
              {SIDEBAR_NAV_CONFIG.newThread.label}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              data-track-owner="ui/sidebar.tsx#SidebarTrigger:TooltipTrigger.1"
              render={
                <Button
                  data-track-owner="ui/sidebar.tsx#SidebarTrigger:Button[onClick=toggle]"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
                  aria-pressed={sidebarOpen}
                  className={ghostIconSmButton}
                  onClick={onSidebarToggle}
                >
                  <Icon name="sidebar-simple-left-wide" size="sm" />
                </Button>
              }
            />
            <TooltipContent side="bottom">
              {sidebarOpen ? "Close sidebar" : "Open sidebar"}
            </TooltipContent>
          </Tooltip>
        </div>
      </header>
      <SidebarThreadsPanel />
      <SidebarAnnouncements />
      <SidebarSetupCard />
      <SidebarDealReminder />
      <SidebarReferralMenu />
      <ContextMenu>
        <ContextMenuTrigger
          data-track-owner="shared/app-sidebar.tsx#AppSidebar:ContextMenuTrigger.1"
          render={footer}
          onContextMenu={(event) => {
            if (
              event.target instanceof Element &&
              event.target.closest("a") !== null
            )
              event.preventBaseUIHandler?.();
          }}
        />
        <ContextMenuContent className="w-52">
          <SidebarPagesMenuItems nav={nav} memory={memory} />
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
}
