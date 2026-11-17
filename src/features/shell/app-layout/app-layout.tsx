import { useNavigate, useRouterState } from "@tanstack/react-router";
import { cx } from "class-variance-authority";
import { type ReactNode, Suspense, useEffect, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { CommandPaletteHost } from "@/features/command-palette";
import { SettingsSidebarPanel } from "@/features/settings/shell";
import {
  useLiveSidebarSource,
  useSidebarThreads,
} from "@/features/sidebar/sidebar-threads-data";
import { SidebarThreadsPanel } from "@/features/sidebar/sidebar-threads-panel";
import { openCommandPalette } from "@/lib/command-palette-events";
import { Button } from "@/primitives/button";
import { Card } from "@/primitives/card";
import { Icon } from "@/primitives/icon";
import { Sheet, SheetContent } from "@/primitives/sheet";
import {
  Sidebar,
  SidebarProvider,
  useSidebarActions,
  useSidebarOpenMobile,
  useSidebarShortcut,
  useSidebarState,
} from "../sidebar-container";

export type AppLayoutProps = { children: ReactNode; banner?: ReactNode };

export const SETTINGS_PATH = "/settings";

const selectPathname = (state: { location: { pathname: string } }) =>
  state.location.pathname;

export function AppLayout({ children, banner }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="group/shell flex min-w-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1">
          <AppShellBody banner={banner}>{children}</AppShellBody>
        </div>
        <CommandPaletteHost />
      </div>
    </SidebarProvider>
  );
}

function SidebarToggle({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Toggle sidebar"
      onClick={onClick}
    >
      <Icon name="sidebar-simple-left-wide" size="sm" />
    </Button>
  );
}

/**
 * The phone's sidebar trigger: opens the shell's navigation sheet. Hidden from
 * md up, where the sidebar is always in the layout. Pages put it in their top
 * bar; the settings route puts it in its crumb bar.
 */
export function MobileNavTrigger({ className }: { className?: string }) {
  const { setOpenMobile } = useSidebarActions();
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Open navigation"
      className={cx("md:hidden", className)}
      onClick={() => setOpenMobile(true)}
    >
      <Icon name="sidebar-simple-left-wide" size="sm" />
    </Button>
  );
}

/**
 * The thread sidebar reads the org's threads, folders and Captains, so it waits
 * on that query. It sits behind its own Suspense boundary: a slow or failing
 * API must not hold back the page body or the settings pane, and the sample
 * panel it falls back to keeps the shell's measurements in the same place.
 */
function LiveAppNav({ onSidebarToggle }: { onSidebarToggle: () => void }) {
  const navigate = useNavigate();
  const [now] = useState(() => new Date());
  const source = useLiveSidebarSource(now);
  const threads = useSidebarThreads(source === null ? {} : { source });
  return (
    <AppSidebar
      mode={threads.view.mode}
      onModeChange={threads.setMode}
      onSidebarToggle={onSidebarToggle}
      threadsSlot={
        <SidebarThreadsPanel
          controller={threads}
          onNewThread={() => navigate({ to: "/new" })}
          onSearch={() => openCommandPalette("thread")}
        />
      }
    />
  );
}

/**
 * The live sidebar replaces the sample one a tick after mount rather than during
 * the first render: the shell's first paint must not wait on the org's threads,
 * whatever the API does.
 */
function AppNav({ onSidebarToggle }: { onSidebarToggle: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <AppNavFallback onSidebarToggle={onSidebarToggle} />;
  return <LiveAppNav onSidebarToggle={onSidebarToggle} />;
}

function AppNavFallback({ onSidebarToggle }: { onSidebarToggle: () => void }) {
  const navigate = useNavigate();
  return (
    <AppSidebar
      onSidebarToggle={onSidebarToggle}
      threadsSlot={
        <SidebarThreadsPanel
          onNewThread={() => navigate({ to: "/new" })}
          onSearch={() => openCommandPalette("thread")}
        />
      }
    />
  );
}

function AppShellBody({ children, banner }: AppLayoutProps) {
  const { open, isNarrow } = useSidebarState();
  const openMobile = useSidebarOpenMobile();
  const { setOpenMobile, toggle } = useSidebarActions();
  const pathname = useRouterState({ select: selectPathname });

  useSidebarShortcut(toggle);
  useEffect(() => {
    if (pathname) setOpenMobile(false);
  }, [pathname, setOpenMobile]);

  const settings = pathname.startsWith(SETTINGS_PATH);
  const closeMobile = () => setOpenMobile(false);
  const settingsNav = (onToggle: () => void) => (
    <SettingsSidebarPanel
      onNavigate={closeMobile}
      trigger={<SidebarToggle onClick={onToggle} />}
    />
  );
  const appNav = (onToggle: () => void) => (
    <Suspense fallback={<AppNavFallback onSidebarToggle={onToggle} />}>
      <AppNav onSidebarToggle={onToggle} />
    </Suspense>
  );
  const desktopNav = settings ? settingsNav(toggle) : appNav(toggle);
  const mobileNav = settings ? settingsNav(closeMobile) : appNav(closeMobile);

  return (
    <>
      {!isNarrow && <Sidebar>{desktopNav}</Sidebar>}
      <Card
        variant="panel"
        data-slot="sidebar-panel"
        className={cx(
          "flex flex-col overflow-clip bg-panel md:rounded-(--radius-panel) md:border-[length:calc(var(--spacing)*0.125)] md:border-(--card-hairline) md:shadow-card",
          "ease-out-quint isolate min-w-0 flex-1 transition-[margin-left] duration-base md:my-2 md:mr-2 md:[[data-tab-strip]_&]:mt-0 motion-reduce:transition-none",
          !open && "md:ml-2 md:duration-fast",
        )}
      >
        {banner}
        <main className="relative flex min-h-0 flex-1 flex-col overflow-y-auto">
          {children}
        </main>
      </Card>
      {isNarrow && (
        <Sheet open={openMobile} onOpenChange={setOpenMobile}>
          <SheetContent aria-label="Navigation">{mobileNav}</SheetContent>
        </Sheet>
      )}
    </>
  );
}
