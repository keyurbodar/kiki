import { useNavigate, useRouterState } from "@tanstack/react-router";
import { type ReactNode, useEffect, useState } from "react";
import { AppTopBar } from "@/components/app-top-bar";
import {
  SettingsSidebar,
  type SettingsSidebarGroup,
  type SettingsSidebarResult,
} from "@/components/settings-sidebar";
import { UserMenu } from "@/components/user-menu";
import {
  settingsNav,
  settingsNavGroups,
  settingsNavTitle,
} from "../nav/registry";
import { type SettingsSearchContext, searchSettings } from "../nav/search";
import { settingsCrumb } from "./settings-crumb";
import { SettingsIcon } from "./settings-icon";

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

export type SettingsMobileSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  searchContext?: SettingsSearchContext;
};

export type SettingsLayoutProps = {
  children?: ReactNode;
  searchContext?: SettingsSearchContext;
};

/**
 * Settings route content: the back crumb's top bar on narrow viewports, the
 * scrolling page and hash scrolling. The sidebar, its panel and the phone
 * navigation sheet come from the app shell, which hosts SettingsSidebarPanel on
 * every settings route.
 */
export function SettingsLayout({
  children,
  searchContext,
}: SettingsLayoutProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const hash = useRouterState({ select: (s) => s.location.hash });
  const crumb = settingsCrumb(pathname);

  useEffect(() => {
    if (hash !== "")
      document
        .getElementById(hash)
        ?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [hash]);

  return (
    <>
      <AppTopBar
        className="sticky top-0 z-(--z-top-bar) flex min-h-11 shrink-0 items-center bg-panel px-2 md:hidden"
        leading={crumb ? <SettingsCrumbLink crumb={crumb} /> : undefined}
      />
      <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto md:scroll-fade-y">
        {children}
      </div>
    </>
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
