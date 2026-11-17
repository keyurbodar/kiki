import type { LinkProps } from "@tanstack/react-router";

export type SettingsNavSection =
  | "personal"
  | "agent"
  | "review"
  | "organization";

export type SettingsNavGroup = {
  section: SettingsNavSection;
  label: string | null;
  ariaLabel: string;
};

export const settingsNavGroups: readonly SettingsNavGroup[] = [
  { section: "personal", label: null, ariaLabel: "Settings" },
  { section: "agent", label: "Agent", ariaLabel: "Agent settings" },
  { section: "review", label: "Review", ariaLabel: "Review settings" },
  {
    section: "organization",
    label: "Organization",
    ariaLabel: "Organization settings",
  },
];

export type SettingsSearchRow = {
  id: string;
  title: string;
  win32Title?: string;
  to?: NonNullable<LinkProps["to"]>;
  keywords?: string;
  desktopOnly?: boolean;
  desktopHandoffOnly?: boolean;
  desktopKeepAwakeOnly?: boolean;
  desktopLoginItemOnly?: boolean;
  desktopMacOnly?: boolean;
  sponsoredGrantOnly?: boolean;
  creditSourcesOnly?: boolean;
  hiddenWhenExperimentPaused?: string;
};

export type SettingsNavEntry = {
  id: string;
  /** Sidebar label (Capy's navLabel ?? title). */
  label: string;
  /** Page title used by settings search; defaults to label. */
  title?: string;
  to: NonNullable<LinkProps["to"]>;
  /** Sidebar group. "search" entries never show in the sidebar, only in settings search. */
  section: SettingsNavSection | "search" | (string & {});
  order: number;
  /** CDS icon id (sprite name). */
  icon?: string;
  keywords?: string;
  rows?: readonly SettingsSearchRow[];
};

const sectionRank = (section: string) => {
  const index = settingsNavGroups.findIndex((g) => g.section === section);
  return index === -1 ? settingsNavGroups.length : index;
};

export function sortSettingsNav(
  entries: readonly SettingsNavEntry[],
): SettingsNavEntry[] {
  return [...entries].sort(
    (a, b) =>
      sectionRank(a.section) - sectionRank(b.section) ||
      a.section.localeCompare(b.section) ||
      a.order - b.order ||
      a.id.localeCompare(b.id),
  );
}

const modules = import.meta.glob<{ entry: SettingsNavEntry }>(
  "./entries/*.ts",
  { eager: true },
);

export const settingsNav = sortSettingsNav(
  Object.values(modules).map((module) => module.entry),
);

export const settingsNavTitle = (entry: SettingsNavEntry) =>
  entry.title ?? entry.label;
