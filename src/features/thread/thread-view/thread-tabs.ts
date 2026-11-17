import {
  CHAT_TAB_ID,
  type PaneTab,
  tabKey,
} from "@/features/thread-panes/tab-strip";
import { type PaneEntry, panes } from "@/features/thread-panes/thread-pane";

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

/** The strip's selected tab: the pane's, or the chat tab when no pane shows. */
export function activeTabId(pane: PaneEntry | undefined): string {
  if (pane === undefined) return CHAT_TAB_ID;
  const tab = tabForPane(pane);
  return tab === undefined ? CHAT_TAB_ID : tabKey(tab);
}
