import {
  CHAT_TAB_ID,
  type PaneTab,
  tabKey,
} from "@/features/thread-panes/tab-strip";
import {
  dockPanes,
  mainPanes,
  type PaneEntry,
  panes,
} from "@/features/thread-panes/thread-pane";

/**
 * The tab a registered pane opens as. Panes outside Capy's tab union have no
 * tab in the strip; they stay reachable from the + menu and the route.
 */
const tabForPane = (pane: PaneEntry): PaneTab | undefined => {
  switch (pane.id) {
    case "overview":
    case "diffs":
    case "files":
    case "setup":
    case "captain_issues":
      return { kind: pane.id };
    default:
      return undefined;
  }
};

/** Every registered pane that has a tab, in the registry's order. */
export const paneTabs = (entries: readonly PaneEntry[] = panes): PaneTab[] =>
  entries.flatMap((entry) => tabForPane(entry) ?? []);

/** The chat column's strip catalogue: the panes that replace the transcript. */
export const mainTabs = (): PaneTab[] => paneTabs(mainPanes);

/** The right dock's strip catalogue: the panes that sit beside the transcript. */
export const dockTabs = (): PaneTab[] => paneTabs(dockPanes);

/**
 * The tabs a strip renders: one per open pane, never the catalogue. A thread
 * shows its chat, and the pane its URL names, so a strip with nothing open
 * carries no pane tab at all.
 */
export const openTabs = (pane: PaneEntry | undefined): PaneTab[] => {
  if (pane === undefined) return [];
  const tab = tabForPane(pane);
  return tab === undefined ? [] : [tab];
};

/**
 * The strip's selected tab: the pane's own tab when it has one, the chat tab
 * when no pane shows, and nothing while a pane without a tab (a browser with no
 * session) covers the transcript — the strip must not claim the chat is up.
 */
export function activeTabId(pane: PaneEntry | undefined): string {
  if (pane === undefined) return CHAT_TAB_ID;
  const tab = tabForPane(pane);
  return tab === undefined ? "" : tabKey(tab);
}
