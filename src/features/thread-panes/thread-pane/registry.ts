import type { ComponentType } from "react";

export type PaneProps = { threadId: string };

/**
 * Which of the thread's two strips offers a pane. Capy has both: the chat
 * column's strip replaces the transcript (`setup`, a browser tab, a terminal),
 * and the right dock's strip opens the document panes beside it.
 */
export type PaneSurface = "main" | "dock";

/**
 * One tab kind the thread pane can open. `id` is the value of the route's
 * `pane` search param for this kind.
 */
export type PaneEntry = {
  id: string;
  label: string;
  order: number;
  /** Defaults to the dock, where the document panes live. */
  surface?: PaneSurface;
  component: ComponentType<PaneProps>;
};

export function definePane(entry: PaneEntry): PaneEntry {
  return entry;
}

export function collectPanes(entries: readonly PaneEntry[]): PaneEntry[] {
  const seen = new Set<string>();
  for (const entry of entries) {
    if (seen.has(entry.id)) {
      throw new Error(`Duplicate thread pane "${entry.id}"`);
    }
    seen.add(entry.id);
  }
  return [...entries].sort(
    (a, b) => a.order - b.order || a.id.localeCompare(b.id),
  );
}

const modules = import.meta.glob<{ entry: PaneEntry }>("./entries/*.tsx", {
  eager: true,
});

export const panes = collectPanes(
  Object.values(modules).map((module) => module.entry),
);

export const surfaceOf = (pane: PaneEntry): PaneSurface =>
  pane.surface ?? "dock";

/** The panes the chat column's strip offers; they replace the transcript. */
export const mainPanes = panes.filter((pane) => surfaceOf(pane) === "main");

/** The panes the right dock's strip offers. */
export const dockPanes = panes.filter((pane) => surfaceOf(pane) === "dock");

export function findPane(id: string | undefined): PaneEntry | undefined {
  return panes.find((pane) => pane.id === id);
}

/**
 * Pane ids we invented before the captures showed Capy has no such pane: its
 * tab menu switches All threads, Pull requests and Side threads into an inline
 * page instead. The thread route drops these from its URL; every other value —
 * a registry id or a tab key such as `service-preview:<machine>:<port>` — is
 * left exactly as it arrived.
 */
export const retiredPaneIds: ReadonlySet<string> = new Set([
  "threads",
  "all-threads",
  "pull-requests",
]);

export const isRetiredPane = (id: string | undefined) =>
  id !== undefined && retiredPaneIds.has(id);

/**
 * The pane params Capy writes into `?pane=`. `files` is readable but not
 * written: Capy opens the Files pane from the param and then rewrites the param
 * off the URL, so a reload lands back on the chat.
 */
export const writtenPaneParams: ReadonlySet<string> = new Set([
  "overview",
  "diffs",
  "captain_issues",
  "setup",
]);

/**
 * The tab keys the app builds itself are parameterised — the colon separates the
 * kind from the tab's own id — so they are kept even though no registry pane
 * answers to them.
 */
export const parameterisedPaneParams: ReadonlyArray<string> = [
  "browser:",
  "service-preview:",
];

/**
 * Whether a pane value survives a page load. Two different things are kept for
 * two different reasons: a pane Capy writes into `?pane=` is a value a reload
 * should honour, and a parameterised tab key names a tab the route cannot
 * resolve on its own, so dropping it would lose the tab rather than tidy the URL.
 */
export const keepsPaneParam = (value: string | undefined): boolean =>
  value !== undefined && survivesReload(value);

const survivesReload = (value: string): boolean =>
  writtenPaneParams.has(value) ||
  parameterisedPaneParams.some((prefix) => value.startsWith(prefix));

/**
 * Whether picking this pane should write it into the URL. Only Capy's own
 * vocabulary is written; a parameterised key survives a load but is never
 * emitted, because the tab it names is the session's, not the URL's.
 */
export const writesPaneParam = (value: string | undefined): boolean =>
  value !== undefined && writtenPaneParams.has(value);
