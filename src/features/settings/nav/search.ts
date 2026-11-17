import {
  type SettingsNavEntry,
  type SettingsSearchRow,
  settingsNav,
  settingsNavTitle,
} from "./registry";

const settingsCatalog = [...settingsNav].sort((a, b) => a.order - b.order);

export type SettingsSearchContext = {
  pausedExperiments?: ReadonlySet<string>;
  desktop?: {
    platform?: "darwin" | "win32" | "linux";
    handoff?: boolean;
    keepAwake?: boolean;
    loginItem?: boolean;
  };
  sponsoredGrant?: boolean;
  creditSources?: boolean;
};

export type SettingsSearchResult = {
  page: SettingsNavEntry;
  rows: SettingsSearchRow[];
};

export function settingsRowTitle(
  row: SettingsSearchRow,
  context: SettingsSearchContext = {},
) {
  return row.win32Title !== undefined && context.desktop?.platform === "win32"
    ? row.win32Title
    : row.title;
}

export function isSettingsRowVisible(
  row: SettingsSearchRow,
  context: SettingsSearchContext = {},
) {
  const desktop = context.desktop;
  const platform = desktop?.platform;
  return (
    (row.hiddenWhenExperimentPaused === undefined ||
      !context.pausedExperiments?.has(row.hiddenWhenExperimentPaused)) &&
    (row.desktopOnly !== true || desktop !== undefined) &&
    (row.desktopKeepAwakeOnly !== true || desktop?.keepAwake === true) &&
    (row.sponsoredGrantOnly !== true || context.sponsoredGrant === true) &&
    (row.creditSourcesOnly !== true || context.creditSources === true) &&
    (row.desktopHandoffOnly !== true || desktop?.handoff === true) &&
    (row.desktopLoginItemOnly !== true ||
      (desktop?.loginItem === true &&
        (platform === "darwin" || platform === "win32"))) &&
    (row.desktopMacOnly !== true || platform === "darwin")
  );
}

export function searchSettings(
  query: string,
  context: SettingsSearchContext = {},
  pages: readonly SettingsNavEntry[] = settingsCatalog,
): SettingsSearchResult[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];
  const matches = (text: string) => {
    const haystack = text.toLowerCase();
    return terms.every((term) => haystack.includes(term));
  };
  const results: SettingsSearchResult[] = [];
  for (const page of pages) {
    const title = settingsNavTitle(page);
    const pageMatches = matches(`${title} ${page.keywords ?? ""}`);
    const rows = (page.rows ?? [])
      .filter((row) => isSettingsRowVisible(row, context))
      .map((row) => ({ ...row, title: settingsRowTitle(row, context) }));
    const matchedRows = pageMatches
      ? rows
      : rows.filter((row) =>
          matches(`${title} ${row.title} ${row.keywords ?? ""}`),
        );
    if (pageMatches || matchedRows.length > 0)
      results.push({ page, rows: matchedRows });
  }
  return results;
}
