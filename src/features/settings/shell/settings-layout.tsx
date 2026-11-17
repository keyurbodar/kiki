import { useNavigate, useRouterState } from "@tanstack/react-router";
import { type ReactNode, useEffect, useState } from "react";
import { AppTopBar } from "@/components/app-top-bar";
import {
  SettingsSidebar,
  type SettingsSidebarGroup,
  type SettingsSidebarResult,
} from "@/components/settings-sidebar";
import { UserMenu } from "@/components/user-menu";
import { Button } from "@/primitives/button";
import { Sheet, SheetContent, SheetOverlay } from "@/primitives/sheet";
import {
  settingsNav,
  settingsNavGroups,
  settingsNavTitle,
} from "../nav/registry";
import { type SettingsSearchContext, searchSettings } from "../nav/search";
import { settingsCrumb } from "./settings-crumb";
import { SettingsIcon } from "./settings-icon";

const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

const sidebarGroups: SettingsSidebarGroup[] = settingsNavGroups.map(
  (group) => ({
    id: group.section,
    label: group.label,
    ariaLabel: group.ariaLabel,
    links: settingsNav
      .filter((entry) => entry.section === group.section)
      .map((entry) => ({
        to: entry.to,
        label: entry.label,
        icon: entry.icon && <SettingsIcon name={entry.icon} />,
      })),
  }),
);

export type SettingsSidebarPanelProps = {
  searchContext?: SettingsSearchContext;
  trigger?: ReactNode;
  onNavigate?: () => void;
};

/** Capy's settings sidebar wired to the nav registry, settings search and the router. */
export function SettingsSidebarPanel({
  searchContext,
  trigger,
  onNavigate,
}: SettingsSidebarPanelProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const results: SettingsSidebarResult[] = searchSettings(
    query,
    searchContext,
  ).map(({ page, rows }) => ({
    to: page.to,
    title: settingsNavTitle(page),
    icon: page.icon && <SettingsIcon name={page.icon} />,
    rows: rows.map((row) => ({ id: row.id, title: row.title, to: row.to })),
  }));
  const go = (to: string, hash?: string) => {
    setQuery("");
    onNavigate?.();
    void navigate({ to, hash });
  };
  return (
    <SettingsSidebar
      groups={sidebarGroups}
      query={query}
      onQueryChange={setQuery}
      results={results}
      onSelectPage={(result) => go(result.to)}
      onSelectRow={(result, row) => go(row.to ?? result.to, row.id)}
      backIcon={<SettingsIcon name="arrow-left" />}
      searchIcon={<SettingsIcon name="magnifying-glass" />}
      trigger={trigger}
      footer={<UserMenu />}
    />
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
      <SettingsIcon name="sidebar-simple-left-wide" />
    </Button>
  );
}

export type SettingsLayoutProps = {
  children?: ReactNode;
  searchContext?: SettingsSearchContext;
};

/**
 * Settings layout: Capy's settings route (top bar with back crumb, scrolling
 * content, hash scroll) inside a stand-in for the app shell's sidebar container
 * until B1's shell hosts `SettingsSidebarPanel` itself.
 */
export function SettingsLayout({
  children,
  searchContext,
}: SettingsLayoutProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const hash = useRouterState({ select: (s) => s.location.hash });
  const [open, setOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const crumb = settingsCrumb(pathname);

  useEffect(() => {
    if (hash !== "")
      document
        .getElementById(hash)
        ?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [hash]);

  useEffect(() => {
    void pathname;
    setMobileOpen(false);
  }, [pathname]);

  const toggle = () => {
    if (window.matchMedia("(width < 48rem)").matches) setMobileOpen(true);
    else setOpen((value) => !value);
  };

  return (
    <div
      data-slot="sidebar-wrapper"
      className="flex h-dvh w-full bg-chrome [--sidebar-width:--spacing(60)]"
    >
      <div
        data-slot="sidebar-gap"
        className={cx(
          "ease-out-quint relative w-(--sidebar-width) shrink-0 transition-[width] duration-base max-md:hidden",
          !open && "w-0 duration-fast",
          "motion-reduce:transition-none",
        )}
      />
      <div
        data-slot="sidebar-container"
        className={cx(
          "ease-out-quint fixed top-(--shell-top) bottom-0 left-0 z-(--z-sidebar) flex w-(--sidebar-width) transition-[translate] duration-base max-md:hidden",
          !open && "-translate-x-full duration-fast",
          "motion-reduce:transition-none",
        )}
      >
        <div
          data-slot="sidebar-content"
          inert={!open || undefined}
          className="flex h-full min-w-0 flex-1 flex-col"
        >
          <SettingsSidebarPanel
            searchContext={searchContext}
            trigger={<SidebarToggle onClick={toggle} />}
          />
        </div>
      </div>
      <div
        data-slot="sidebar-panel"
        className={cx(
          "ease-out-quint isolate flex min-w-0 flex-1 flex-col transition-[margin-left] duration-base md:my-2 md:mr-2 motion-reduce:transition-none",
          "bg-panel md:rounded-(--radius-panel) md:border-[0.03125rem] md:border-border-1 md:shadow-card",
          !open && "md:ml-2 md:duration-fast",
        )}
      >
        <main className="relative flex min-h-0 flex-1 flex-col overflow-y-auto">
          <AppTopBar
            className={cx(
              "sticky top-0 z-(--z-top-bar) flex min-h-11 shrink-0 items-center bg-panel px-2",
              open && crumb === undefined && "md:hidden",
            )}
          >
            <span
              className={cx(
                "flex w-(--h-control-sm) shrink-0 items-center overflow-hidden -mr-1",
                open && "md:hidden",
              )}
            >
              <SidebarToggle onClick={toggle} />
            </span>
            {crumb && (
              <span className="flex min-w-0 shrink-0 items-center pl-2">
                <SettingsCrumbLink crumb={crumb} />
              </span>
            )}
          </AppTopBar>
          <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto md:scroll-fade-y">
            {children}
          </div>
        </main>
      </div>
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetOverlay className="fixed inset-0 z-(--z-drawer) bg-overlay" />
        <SheetContent
          aria-label="Navigation"
          className="fixed inset-y-0 left-0 z-(--z-drawer) flex w-[88%] flex-col bg-chrome pt-(--safe-top) pb-(--safe-bottom) outline-none"
        >
          <SettingsSidebarPanel
            searchContext={searchContext}
            trigger={<SidebarToggle onClick={() => setMobileOpen(false)} />}
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}

function SettingsCrumbLink({
  crumb,
}: {
  crumb: NonNullable<ReturnType<typeof settingsCrumb>>;
}) {
  const navigate = useNavigate();
  return (
    <a
      href={crumb.to}
      data-slot="breadcrumb"
      onClick={(event) => {
        event.preventDefault();
        void navigate({ to: crumb.to, params: crumb.params });
      }}
      className="-ml-2 flex h-(--h-control-sm) w-fit items-center gap-1.5 rounded px-2 text-sm font-medium text-muted-foreground-1 select-none transition-colors duration-100 hover:bg-secondary outline-none focus-visible:outline-ring-inset"
    >
      <SettingsIcon name="arrow-left" className="size-(--icon-sm) shrink-0" />
      {crumb.label}
    </a>
  );
}
