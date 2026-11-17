import type { LinkProps } from "@tanstack/react-router";

export type SettingsNavEntry = {
  id: string;
  label: string;
  to: NonNullable<LinkProps["to"]>;
  section: string;
  order: number;
};

export function sortSettingsNav(
  entries: readonly SettingsNavEntry[],
): SettingsNavEntry[] {
  return [...entries].sort(
    (a, b) =>
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
