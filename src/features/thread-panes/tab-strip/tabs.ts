/**
 * One open tab in a thread pane's strip. The kinds and their fields follow
 * Capy's pane tab union; the strip only needs the identity and display fields.
 */
export type PaneTab =
  | { kind: "overview" }
  | { kind: "diffs"; jamId?: string }
  | { kind: "files"; jamId?: string }
  | { kind: "setup"; jamId?: string }
  | { kind: "captain_issues" }
  | { kind: "issue"; code: string }
  | { kind: "browser"; id: string; url: string; title: string }
  | { kind: "service_preview"; machineId: string; port: number; title: string }
  | { kind: "side_thread"; jamId: string }
  | { kind: "side_thread_draft"; draftId: string }
  | { kind: "task"; jamId: string; localIndex: number | null }
  | { kind: "pr"; number: number; url: string }
  | { kind: "shell"; machineId: string; clientId: string; label: string }
  | { kind: "desktop"; jamId: string; localIndex: number | null }
  | { kind: "phone"; machineId: string; label: string }
  | { kind: "paper"; jamId: string; fileId: string; title: string | null }
  | {
      kind: "file";
      path: string;
      machineId?: string;
      jamId?: string;
      repo?: string;
    }
  | { kind: "drive_file"; path: string }
  | { kind: "attachment"; id: string; name: string; title?: string };

export type PaneTabKind = PaneTab["kind"];

/** Id of the pinned chat tab at the head of the main strip. */
export const CHAT_TAB_ID = "chat";

/** The fixed tabs the open-a-tab menu lists first, in Capy's order. */
export const BUILTIN_TABS: readonly PaneTab[] = [
  { kind: "overview" },
  { kind: "diffs" },
  { kind: "files" },
  { kind: "setup" },
];

const pullRef = (url: string, number: number) => {
  const match = /github\.com\/([^/]+\/[^/]+)\/pull\//.exec(url);
  return match === null ? `#${number}` : `${match[1]}#${number}`;
};

/** Stable id of a tab: the strip's React key, drag id and selection id. */
export function tabKey(tab: PaneTab): string {
  switch (tab.kind) {
    case "task":
      return `task:${tab.jamId}`;
    case "side_thread":
      return `side-thread:${tab.jamId}`;
    case "side_thread_draft":
      return `side-thread-draft:${tab.draftId}`;
    case "desktop":
      return `desktop:${tab.jamId}`;
    case "diffs":
    case "files":
    case "setup":
      return tab.jamId === undefined ? tab.kind : `${tab.kind}:${tab.jamId}`;
    case "phone":
      return `phone:${tab.machineId}`;
    case "service_preview":
      return `service-preview:${tab.machineId}:${tab.port}`;
    case "browser":
      return `browser:${tab.id}`;
    case "shell":
      return `shell:${tab.machineId}:${tab.clientId}`;
    case "pr":
      return `pr:${pullRef(tab.url, tab.number)}`;
    case "file":
      return `file${tab.machineId === undefined ? "" : `@${tab.machineId}`}:${tab.jamId ?? ""}:${tab.repo ?? ""}:${tab.path}`;
    case "drive_file":
      return `drive-file:${tab.path}`;
    case "issue":
      return `issue:${tab.code}`;
    case "attachment":
      return `attachment:${tab.id}`;
    case "paper":
      return `paper:${tab.fileId}`;
    case "overview":
    case "captain_issues":
      return tab.kind;
  }
}

const hostOf = (url: string) => {
  try {
    return new URL(url).host;
  } catch {
    return undefined;
  }
};

/** Capy's default label for a tab, before thread titles are known. */
export function tabLabel(tab: PaneTab): string {
  switch (tab.kind) {
    case "overview":
      return "Overview";
    case "diffs":
      return "Diffs";
    case "files":
      return "Files";
    case "setup":
      return "Setup";
    case "captain_issues":
      return "Issues";
    case "issue":
      return tab.code;
    case "drive_file":
      return tab.path.split("/").at(-1) ?? tab.path;
    case "phone":
    case "shell":
      return tab.label;
    case "desktop":
      return tab.localIndex === null
        ? "Desktop"
        : `Subagent ${tab.localIndex} desktop`;
    case "service_preview":
      return tab.title;
    case "browser":
      if (tab.title !== "") return tab.title;
      if (tab.url === "") return "New tab";
      return hostOf(tab.url) ?? tab.url;
    case "paper":
      return tab.title ?? tab.fileId.slice(0, 8);
    case "task":
      return tab.localIndex === null
        ? "Subagent"
        : `Subagent ${tab.localIndex}`;
    case "side_thread":
      return "Side thread";
    case "side_thread_draft":
      return "New side thread";
    case "pr":
      return `#${tab.number}`;
    case "file":
      return tab.path.split("/").at(-1) ?? tab.path;
    case "attachment":
      return tab.title ?? tab.name;
  }
}

/** Tabs whose label truncates inside the chat-tab width cap. */
export const isThreadLikeTab = (tab: PaneTab) =>
  tab.kind === "side_thread" ||
  tab.kind === "browser" ||
  tab.kind === "service_preview";

/** Tabs whose label is a file name. */
export const isFileTab = (tab: PaneTab) =>
  tab.kind === "file" || tab.kind === "drive_file" || tab.kind === "attachment";

/** Case-insensitive substring match of a menu search against any field. */
export function matchesQuery(
  query: string,
  ...fields: ReadonlyArray<string | undefined>
): boolean {
  const needle = query.trim().toLowerCase();
  return (
    needle === "" ||
    fields.some((field) => field?.toLowerCase().includes(needle))
  );
}

/** One entry of the strip as the right-click menu sees it. */
export type RailTab = { id: string; tab: PaneTab | undefined };

/** The id `step` places away from the active tab, wrapping around. */
export function cycleTabId(
  railTabs: readonly RailTab[],
  activeId: string | null,
  step: number,
): string | undefined {
  const index = railTabs.findIndex((entry) => entry.id === activeId);
  const next = railTabs[(index + step + railTabs.length) % railTabs.length];
  return next === undefined || next.id === activeId ? undefined : next.id;
}

/** What the close items of the right-click menu act on for `target`. */
export function closeTargets(
  railTabs: readonly RailTab[],
  target: string | null,
) {
  const closable = railTabs.flatMap((entry) =>
    entry.tab === undefined ? [] : [entry.id],
  );
  const index = railTabs.findIndex((entry) => entry.id === target);
  return {
    closable,
    target: railTabs[index],
    others: closable.filter((id) => id !== target),
    toRight:
      index === -1
        ? []
        : railTabs
            .slice(index + 1)
            .flatMap((entry) =>
              closable.includes(entry.id) ? [entry.id] : [],
            ),
  };
}

/**
 * Where a dragged tab lands: the id it now sits before (undefined at the
 * end), or null when the drop leaves the order unchanged.
 */
export function reorderBefore(
  ids: readonly string[],
  activeId: string,
  overId: string,
): string | undefined | null {
  const from = ids.indexOf(activeId);
  const to = ids.indexOf(overId);
  if (from === -1 || to === -1 || from === to) return null;
  const rest = ids.filter((id) => id !== activeId);
  const landed = [...rest.slice(0, to), activeId, ...rest.slice(to)];
  return landed[to + 1];
}

/** Path the "Copy link" item copies for a tab of thread `threadId`. */
export function tabLink(threadId: string, tab: PaneTab | undefined): string {
  return tab === undefined
    ? `/thread/${threadId}`
    : `/thread/${threadId}?pane=${encodeURIComponent(tabKey(tab))}`;
}
