import { useNavigate, useRouter, useRouterState } from "@tanstack/react-router";
import { cx } from "class-variance-authority";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { AppSidebar, useSidebarLayout } from "@/components/app-sidebar";
import {
  CaptainDialog,
  type CaptainDialogRequest,
} from "@/features/captains/dialogs";
import { CommandPaletteHost } from "@/features/command-palette";
import { SettingsSidebarPanel } from "@/features/settings/shell";
import {
  createRovingCommands,
  registerCommands,
} from "@/features/shell/keyboard";
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
  useSidebarState,
} from "../sidebar-container";
import { createShellCommands } from "./shell-commands";

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

function AppShellBody({ children, banner }: AppLayoutProps) {
  const { open, isNarrow } = useSidebarState();
  const openMobile = useSidebarOpenMobile();
  const { setOpenMobile, toggle } = useSidebarActions();
  const pathname = useRouterState({ select: selectPathname });
  const navigate = useNavigate();
  const [captainDialog, setCaptainDialog] =
    useState<CaptainDialogRequest | null>(null);
  const [now] = useState(() => new Date());
  const [sidebarLayout] = useSidebarLayout();
  const liveSource = useLiveSidebarSource(now);
  const threads = useSidebarThreads({
    ...(liveSource === null ? {} : { source: liveSource }),
    layout: sidebarLayout,
  });

  const router = useRouter();
  const sidebarStateRef = useRef({ threads, pathname });
  sidebarStateRef.current = { threads, pathname };

  // The list keys run in the capture phase: a menu stops the keydown before it
  // bubbles, and it is the menu's own arrow the list key stands for.
  useEffect(
    () => registerCommands(createRovingCommands(), { capture: true }),
    [],
  );

  useEffect(
    () =>
      registerCommands(
        createShellCommands(() => {
          const { threads: live, pathname: here } = sidebarStateRef.current;
          const order = live.view.sections.flatMap((section) =>
            section.threads.map((thread) => thread.id),
          );
          const openThread = (index: number) => {
            const id = order[index];
            if (id !== undefined)
              void navigate({
                to: "/thread/$threadId",
                params: { threadId: id },
              });
          };
          return {
            toggleSidebar: toggle,
            toggleSidebarMode: () =>
              live.setMode(
                live.view.mode === "threads" ? "captains" : "threads",
              ),
            newThread: () => void navigate({ to: "/new" }),
            openSettings: () => void navigate({ to: SETTINGS_PATH }),
            back: () => router.history.back(),
            forward: () => router.history.forward(),
            stepThread: (delta) => {
              if (order.length === 0) return;
              const current = /^\/thread\/([^/]+)/.exec(here)?.[1];
              const index = current === undefined ? -1 : order.indexOf(current);
              if (index === -1) openThread(delta === 1 ? 0 : order.length - 1);
              else openThread((index + delta + order.length) % order.length);
            },
            jumpThread: openThread,
          };
        }),
      ),
    [toggle, navigate, router],
  );

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
    <AppSidebar
      mode={threads.view.mode}
      onModeChange={threads.setMode}
      showModeToggle={threads.view.captains.length > 0}
      onSidebarToggle={onToggle}
      threadsSlot={
        <SidebarThreadsPanel
          controller={threads}
          onNewThread={() => navigate({ to: "/new" })}
          onNewCaptain={() => setCaptainDialog({ kind: "create" })}
          onSearch={() => openCommandPalette("thread")}
        />
      }
    />
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
      {captainDialog === null ? null : (
        <CaptainDialog
          request={captainDialog}
          onClose={() => setCaptainDialog(null)}
        />
      )}
      {isNarrow && (
        <Sheet open={openMobile} onOpenChange={setOpenMobile}>
          <SheetContent aria-label="Navigation">{mobileNav}</SheetContent>
        </Sheet>
      )}
    </>
  );
}
