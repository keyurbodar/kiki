export const SIDEBAR_NAV_ITEMS = [
  "newThread",
  "threads",
  "issues",
  "pullRequests",
  "automations",
  "explore",
  "volumes",
  "memory",
] as const;

export type SidebarNavItem = (typeof SIDEBAR_NAV_ITEMS)[number];

export type SidebarNavEntry = { item: SidebarNavItem; hidden?: boolean };

export const SIDEBAR_NAV_DEFAULTS: ReadonlyArray<SidebarNavEntry> =
  SIDEBAR_NAV_ITEMS.map((item) => ({ item }));

export const isSidebarNavItem = (item: string): item is SidebarNavItem =>
  (SIDEBAR_NAV_ITEMS as ReadonlyArray<string>).includes(item);

export function normalizeSidebarNav(
  saved: ReadonlyArray<{ item: string; hidden?: boolean }> | null | undefined,
): SidebarNavEntry[] {
  if (saved == null) return [...SIDEBAR_NAV_DEFAULTS];
  const known = saved.filter(
    (entry, index): entry is SidebarNavEntry =>
      isSidebarNavItem(entry.item) &&
      saved.findIndex((other) => other.item === entry.item) === index,
  );
  const entries = [...known];
  SIDEBAR_NAV_DEFAULTS.forEach((fallback, index) => {
    if (entries.some((entry) => entry.item === fallback.item)) return;
    const nextIndex = SIDEBAR_NAV_DEFAULTS.slice(index + 1)
      .map((later) => entries.findIndex((entry) => entry.item === later.item))
      .find((found) => found !== -1);
    entries.splice(nextIndex ?? entries.length, 0, fallback);
  });
  return entries;
}

export const isDefaultSidebarNav = (entries: ReadonlyArray<SidebarNavEntry>) =>
  entries.length === SIDEBAR_NAV_DEFAULTS.length &&
  entries.every(
    (entry, index) =>
      entry.item === SIDEBAR_NAV_DEFAULTS[index]?.item &&
      (entry.hidden === true) ===
        (SIDEBAR_NAV_DEFAULTS[index]?.hidden === true),
  );

export const toSidebarNavPreference = (entries: SidebarNavEntry[]) =>
  isDefaultSidebarNav(entries) ? null : entries;

export function sidebarNavPages(
  entries: ReadonlyArray<SidebarNavEntry>,
  { memory = false }: { memory?: boolean } = {},
) {
  return entries.filter(
    (entry) =>
      entry.item !== "newThread" && (entry.item !== "memory" || memory),
  );
}

export const toggleSidebarNavItem = (
  entries: ReadonlyArray<SidebarNavEntry>,
  item: SidebarNavItem,
): SidebarNavEntry[] =>
  entries.map((entry) =>
    entry.item === item
      ? { item: entry.item, hidden: entry.hidden !== true || undefined }
      : entry,
  );

export function moveSidebarNavItem(
  entries: ReadonlyArray<SidebarNavEntry>,
  item: SidebarNavItem,
  target: { item: SidebarNavItem; after: boolean },
): SidebarNavEntry[] {
  const moving = entries.find((entry) => entry.item === item);
  if (moving === undefined) return [...entries];
  const rest = entries.filter((entry) => entry !== moving);
  const index =
    rest.findIndex((entry) => entry.item === target.item) +
    (target.after ? 1 : 0);
  return [...rest.slice(0, index), moving, ...rest.slice(index)];
}

export function splitSidebarBar<T extends SidebarNavEntry>(
  pages: ReadonlyArray<T>,
  capacity: number | null,
) {
  const visible = pages.filter((page) => page.hidden !== true);
  const fits = capacity === null || capacity === 0 ? visible.length : capacity;
  const more =
    visible.length > fits ||
    pages.some(
      (page) =>
        page.hidden === true &&
        SIDEBAR_NAV_DEFAULTS.find((entry) => entry.item === page.item)
          ?.hidden !== true,
    );
  const shown = more ? visible.slice(0, Math.max(0, fits - 1)) : visible;
  return {
    shown,
    overflow: pages.filter((page) => !shown.includes(page)),
    more,
  };
}
