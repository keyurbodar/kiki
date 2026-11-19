import {
  CHAT_TAB_ID,
  type PaneTab,
  tabKey,
} from "@/features/thread-panes/tab-strip";
import {
  dockPanes,
  findPane,
  mainPanes,
  type PaneEntry,
  panes,
} from "@/features/thread-panes/thread-pane";

/**
 * The tab a registered pane opens as. Panes outside Capy's tab union have no
 * tab in the strip; they stay reachable from the + menu and the route.
 */
export const tabForPane = (pane: PaneEntry): PaneTab | undefined => {
  switch (pane.id) {
    case "chat":
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
 * The tab a strip address resolves to: a registered pane, or a tab the strip
 * keys itself — `pr:owner/repo#12`, `issue:AMA-7`, `drive-file:path`, and the
 * `file@machine:jam:repo:path` a tree row opens. Rounds trips `tabKey`.
 */
export function tabForKey(key: string | undefined): PaneTab | undefined {
  if (key === undefined) return undefined;
  const pane = tabForPane(findPane(key) ?? ({} as PaneEntry));
  if (pane !== undefined) return pane;
  // Keys whose tab carries fields a colon can separate. The header's menu hands
  // the strip a tab's key, so without these a side thread, a subagent, a
  // service or a phone row closed the menu and opened nothing.
  if (key.startsWith("side-thread:")) {
    const jamId = key.slice("side-thread:".length);
    return jamId === "" ? undefined : { kind: "side_thread", jamId };
  }
  if (key.startsWith("side-thread-draft:")) {
    const draftId = key.slice("side-thread-draft:".length);
    return draftId === "" ? undefined : { kind: "side_thread_draft", draftId };
  }
  if (key.startsWith("task:")) {
    const jamId = key.slice("task:".length);
    return jamId === "" ? undefined : { kind: "task", jamId, localIndex: null };
  }
  if (key.startsWith("service-preview:")) {
    const [machineId = "", port = ""] = key
      .slice("service-preview:".length)
      .split(":");
    const number = Number(port);
    if (machineId === "" || !Number.isInteger(number) || number <= 0)
      return undefined;
    return {
      kind: "service_preview",
      machineId,
      port: number,
      title: `Port ${number}`,
    };
  }
  if (key.startsWith("phone:")) {
    const machineId = key.slice("phone:".length);
    return machineId === ""
      ? undefined
      : { kind: "phone", machineId, label: "Phone" };
  }
  if (key.startsWith("issue:")) {
    const code = key.slice("issue:".length);
    return code === "" ? undefined : { kind: "issue", code };
  }
  if (key.startsWith("pr:")) {
    const ref = key.slice("pr:".length);
    const at = ref.lastIndexOf("#");
    if (at === -1) return undefined;
    const number = Number(ref.slice(at + 1));
    if (Number.isNaN(number)) return undefined;
    return {
      kind: "pr",
      number,
      url: `https://github.com/${ref.slice(0, at)}/pull/${number}`,
    };
  }
  if (key.startsWith("drive-file:")) {
    const path = key.slice("drive-file:".length);
    return path === "" ? undefined : { kind: "drive_file", path };
  }
  if (key.startsWith("file@") || key.startsWith("file:")) {
    const rest = key.startsWith("file@")
      ? key.slice("file".length)
      : key.slice("file".length);
    const machineEnd = rest.startsWith("@") ? rest.indexOf(":") : 0;
    const machineId = machineEnd > 1 ? rest.slice(1, machineEnd) : undefined;
    const [jamId = "", repo = "", ...parts] = rest
      .slice(machineEnd === 0 ? 1 : machineEnd + 1)
      .split(":");
    const path = parts.join(":");
    if (path === "") return undefined;
    return {
      kind: "file",
      path,
      machineId,
      jamId: jamId === "" ? undefined : jamId,
      repo: repo === "" ? undefined : repo,
    };
  }
  return undefined;
}

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
