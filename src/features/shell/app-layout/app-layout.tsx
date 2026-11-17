import { useRouterState } from "@tanstack/react-router";
import { cx } from "class-variance-authority";
import { type ReactNode, useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SettingsSidebar } from "@/components/settings-sidebar";
import { Card } from "@/primitives/card";
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

export function AppLayout({ children, banner }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="group/shell flex min-w-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1">
          <AppShellBody banner={banner}>{children}</AppShellBody>
        </div>
      </div>
    </SidebarProvider>
  );
}

const selectPathname = (state: { location: { pathname: string } }) =>
  state.location.pathname;

function AppShellBody({ children, banner }: AppLayoutProps) {
  const { open, isNarrow } = useSidebarState();
  const openMobile = useSidebarOpenMobile();
  const { setOpenMobile, toggle } = useSidebarActions();
  const pathname = useRouterState({ select: selectPathname });
  const nav = pathname.startsWith("/settings") ? (
    <SettingsSidebar />
  ) : (
    <AppSidebar />
  );

  useSidebarShortcut(toggle);
  useEffect(() => {
    if (pathname) setOpenMobile(false);
  }, [pathname, setOpenMobile]);

  return (
    <>
      {!isNarrow && <Sidebar>{nav}</Sidebar>}
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
          <SheetContent aria-label="Navigation">{nav}</SheetContent>
        </Sheet>
      )}
    </>
  );
}
