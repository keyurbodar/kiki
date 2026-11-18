import { type PaneTab, tabKey } from "@/features/thread-panes/tab-strip";

/**
 * The thread panel's open tabs. Capy keeps every tab a thread opens — a pull
 * request, an issue and a file sit in one strip — and renders the active one
 * below it. The chat is not a tab here: it stays in the chat column, so an
 * empty session is the thread with no panel at all.
 */
export type PaneSession = {
  tabs: readonly PaneTab[];
  /** Key of the tab on screen, or `""` when the panel shows no pane. */
  active: string;
};

export const emptySession: PaneSession = { tabs: [], active: "" };

/**
 * Tabs Capy keeps only while they are on screen: a file opened from the tree
 * joins the strip, and switching to another tab closes it. Measured live — a
 * pull request and an issue both survive the switch, the file does not.
 */
export const isTransientTab = (tab: PaneTab): boolean =>
  tab.kind === "file" || tab.kind === "drive_file" || tab.kind === "attachment";

const withoutStaleTransient = (
  tabs: readonly PaneTab[],
  active: string,
): readonly PaneTab[] =>
  tabs.filter((tab) => !isTransientTab(tab) || tabKey(tab) === active);

/** Opens a tab, or brings it forward when the strip already holds it. */
export function openTab(session: PaneSession, tab: PaneTab): PaneSession {
  const key = tabKey(tab);
  const tabs = session.tabs.some((open) => tabKey(open) === key)
    ? session.tabs
    : [...session.tabs, tab];
  return { tabs: withoutStaleTransient(tabs, key), active: key };
}

/** Brings an open tab forward, and drops the file tab it replaces. */
export function selectTab(session: PaneSession, key: string): PaneSession {
  if (!session.tabs.some((tab) => tabKey(tab) === key)) return session;
  return { tabs: withoutStaleTransient(session.tabs, key), active: key };
}

/**
 * Closes a tab. Closing the one on screen moves to its neighbour, left first,
 * and to the chat when it was the last one — the strip never goes blank while
 * another tab is open.
 */
export function closeTab(session: PaneSession, key: string): PaneSession {
  const index = session.tabs.findIndex((tab) => tabKey(tab) === key);
  if (index === -1) return session;
  const tabs = session.tabs.filter((_, at) => at !== index);
  if (key !== session.active) return { tabs, active: session.active };
  const next = tabs[index - 1] ?? tabs[index];
  return { tabs, active: next === undefined ? "" : tabKey(next) };
}

/** The session a freshly entered thread starts with: the tab its URL names. */
export function seedSession(
  tab: PaneTab | undefined,
  key: string | undefined,
): PaneSession {
  if (tab === undefined || key === undefined) return emptySession;
  return { tabs: [tab], active: key };
}
