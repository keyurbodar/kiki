import { type PaneTab, tabKey } from "@/features/thread-panes/tab-strip";
import {
  removeTile,
  setTileRatio,
  splitTile,
  type TileDirection,
  type TileNode,
  tileLeafIds,
} from "@/features/thread-panes/tile-surface";

/**
 * The dock's own group. Every pane opens into a group, and splitting a group
 * adds another one; this one is there before the first split, holds the tabs a
 * freshly entered thread seeds, and is never removed.
 */
export const DOCK_GROUP = "dock";

/**
 * The thread panel's open tabs and the groups they sit in. Capy keeps every tab
 * a thread opens — a pull request, an issue and a file share one strip — lays
 * the groups out as a tree of splits, and shows each group's own tab. The chat
 * is not a tab here: it stays in the chat column, so an empty session is the
 * thread with no panel at all.
 */
export type PaneSession = {
  /** The open tabs, in the order the strips show them. */
  tabs: readonly PaneTab[];
  /** The dock's groups, as a tree of splits. Leaves name group ids. */
  tiles: TileNode;
  /** The group a tab sits in. A tab with no entry sits in `DOCK_GROUP`. */
  groupOf: Readonly<Record<string, string>>;
  /** The tab each group shows. */
  activeIn: Readonly<Record<string, string>>;
  /** Key of the tab on screen, or `""` when the panel shows no pane. */
  active: string;
};

export const emptySession: PaneSession = {
  tabs: [],
  tiles: { kind: "group", id: DOCK_GROUP },
  groupOf: {},
  activeIn: {},
  active: "",
};

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

/** The group a tab sits in. */
export const groupOfTab = (session: PaneSession, key: string): string =>
  session.groupOf[key] ?? DOCK_GROUP;

/** The tabs one group shows, in strip order. */
export const tabsInGroup = (
  session: PaneSession,
  group: string,
): readonly PaneTab[] =>
  session.tabs.filter((tab) => groupOfTab(session, tabKey(tab)) === group);

/** Every group in the dock, left to right and top to bottom. */
export const sessionGroups = (session: PaneSession): string[] =>
  tileLeafIds(session.tiles);

/** The group the tab on screen belongs to. */
export const focusedGroup = (session: PaneSession): string => {
  if (session.active !== "") return groupOfTab(session, session.active);
  return (
    sessionGroups(session).find(
      (group) => tabsInGroup(session, group).length > 0,
    ) ?? DOCK_GROUP
  );
};

/**
 * Rebuilds the membership around a new tab list: a closed tab leaves its group,
 * a group with nothing left falls out of the tree so its neighbour takes the
 * whole box, and each group and the panel itself fall back to a pane that is
 * still open.
 */
const settle = (
  session: PaneSession,
  tabs: readonly PaneTab[],
  preferred: Readonly<Record<string, string>> = {},
): PaneSession => {
  const keys = new Set(tabs.map(tabKey));
  const groupOf = Object.fromEntries(
    Object.entries(session.groupOf).filter(
      ([key, group]) => keys.has(key) && group !== DOCK_GROUP,
    ),
  );
  const held = (group: string) =>
    tabs.filter((tab) => (groupOf[tabKey(tab)] ?? DOCK_GROUP) === group);
  let tiles = session.tiles;
  for (const group of tileLeafIds(tiles)) {
    if (group !== DOCK_GROUP && held(group).length === 0) {
      tiles = removeTile(tiles, group) ?? {
        kind: "group",
        id: DOCK_GROUP,
      };
    }
  }
  const groups = tileLeafIds(tiles);
  const activeIn: Record<string, string> = {};
  for (const group of groups) {
    const members = held(group);
    const showing = session.activeIn[group] ?? preferred[group];
    const next =
      showing !== undefined && members.some((tab) => tabKey(tab) === showing)
        ? showing
        : members[0] === undefined
          ? undefined
          : tabKey(members[0]);
    if (next !== undefined) activeIn[group] = next;
  }
  const active = keys.has(session.active)
    ? session.active
    : (groups
        .map((group) => activeIn[group])
        .find((key) => key !== undefined) ??
      (tabs[0] === undefined ? "" : tabKey(tabs[0])));
  return { tabs, tiles, groupOf, activeIn, active };
};

/**
 * Opens a tab, or brings it forward when a strip already holds it. Re-opening
 * replaces the held tab, so a second ask carries its new intent — the files
 * pane's search focus, for one — instead of being swallowed by the old tab. A
 * new tab joins the group the thread is looking at.
 */
export function openTab(session: PaneSession, tab: PaneTab): PaneSession {
  const key = tabKey(tab);
  const held = session.tabs.some((open) => tabKey(open) === key);
  const tabs = held
    ? session.tabs.map((open) => (tabKey(open) === key ? tab : open))
    : [...session.tabs, tab];
  const group = held ? groupOfTab(session, key) : focusedGroup(session);
  const groupOf =
    group === DOCK_GROUP
      ? session.groupOf
      : { ...session.groupOf, [key]: group };
  const next = settle(
    { ...session, groupOf },
    withoutStaleTransient(tabs, key),
  );
  return {
    ...next,
    activeIn: { ...next.activeIn, [group]: key },
    active: key,
  };
}

/** Brings an open tab forward, inside its own group, and drops the file tab it replaces. */
export function selectTab(session: PaneSession, key: string): PaneSession {
  if (!session.tabs.some((tab) => tabKey(tab) === key)) return session;
  const next = settle(session, withoutStaleTransient(session.tabs, key));
  const group = groupOfTab(next, key);
  return { ...next, activeIn: { ...next.activeIn, [group]: key }, active: key };
}

/**
 * Sets a files tab's focus intent. The pane clears it once it has focused, so
 * pressing the shortcut again asks for the search field again.
 */
export function setTabFocus(
  session: PaneSession,
  key: string,
  focus: "search" | undefined,
): PaneSession {
  const index = session.tabs.findIndex((tab) => tabKey(tab) === key);
  const tab = session.tabs[index];
  if (tab === undefined || tab.kind !== "files") return session;
  const tabs = [...session.tabs];
  tabs[index] = { ...tab, focus };
  return { ...session, tabs };
}

/**
 * Closes a tab. Its group falls back to the tab beside it, and a group with
 * nothing left is gone — the pane sharing its split takes the full width. The
 * panel itself falls back to a group that still has a tab, and to the chat when
 * it was the last one.
 */
export function closeTab(session: PaneSession, key: string): PaneSession {
  const index = session.tabs.findIndex((tab) => tabKey(tab) === key);
  if (index === -1) return session;
  const group = groupOfTab(session, key);
  const members = tabsInGroup(session, group).map(tabKey);
  const at = members.indexOf(key);
  const neighbour = members[at - 1] ?? members[at + 1];
  const rest = session.tabs.filter((_, position) => position !== index);
  const next = settle(
    session,
    rest,
    neighbour === undefined ? {} : { [group]: neighbour },
  );
  return session.active === key && neighbour !== undefined
    ? { ...next, active: neighbour }
    : next;
}

/**
 * Splits a tab out of its group into a fresh one: `right` puts the new group
 * in a row beside it, `bottom` in a column under it, at half the box. A group
 * that holds only this tab has nothing to leave behind, so Capy does nothing.
 */
export function splitTab(
  session: PaneSession,
  key: string,
  direction: Extract<TileDirection, "right" | "bottom">,
): PaneSession {
  if (!session.tabs.some((tab) => tabKey(tab) === key)) return session;
  const group = groupOfTab(session, key);
  if (group !== DOCK_GROUP && tabsInGroup(session, group).length <= 1) {
    return session;
  }
  const next = nextGroupId(session.tiles);
  const tiles = splitTile(session.tiles, group, direction, next);
  const groupOf = { ...session.groupOf, [key]: next };
  const activeIn = { ...session.activeIn, [next]: key };
  const other = tabsInGroup(session, group).find((tab) => tabKey(tab) !== key);
  if (activeIn[group] === key) {
    if (other === undefined) delete activeIn[group];
    else activeIn[group] = tabKey(other);
  }
  return { ...session, tiles, groupOf, activeIn, active: key };
}

/**
 * Drops a tab into another group. The tab leaves the group it was in, and that
 * group goes with it when it was the last one it held.
 */
export function moveTab(
  session: PaneSession,
  key: string,
  group: string,
): PaneSession {
  if (!session.tabs.some((tab) => tabKey(tab) === key)) return session;
  if (!tileLeafIds(session.tiles).includes(group)) return session;
  if (groupOfTab(session, key) === group) return session;
  const groupOf =
    group === DOCK_GROUP
      ? Object.fromEntries(
          Object.entries(session.groupOf).filter(([held]) => held !== key),
        )
      : { ...session.groupOf, [key]: group };
  const next = settle({ ...session, groupOf }, session.tabs);
  return {
    ...next,
    activeIn: { ...next.activeIn, [group]: key },
    active: key,
  };
}

/** Drags a group's divider: the split at `path` keeps `ratio` of its box. */
export function setGroupRatio(
  session: PaneSession,
  path: string,
  ratio: number,
): PaneSession {
  const tiles = setTileRatio(session.tiles, path, ratio);
  return tiles === session.tiles ? session : { ...session, tiles };
}

/** The first group id this dock has not used. */
function nextGroupId(tiles: TileNode): string {
  const taken = new Set(tileLeafIds(tiles));
  let index = 1;
  while (taken.has(`group:${index}`)) index += 1;
  return `group:${index}`;
}

/** The session a freshly entered thread starts with: the tab its URL names. */
export function seedSession(
  tab: PaneTab | undefined,
  key: string | undefined,
): PaneSession {
  if (tab === undefined || key === undefined) return emptySession;
  return {
    ...emptySession,
    tabs: [tab],
    activeIn: { [DOCK_GROUP]: key },
    active: key,
  };
}
