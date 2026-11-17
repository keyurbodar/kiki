import type { ComponentType } from "react";

export type PaneProps = { threadId: string };

/** One tab kind the thread pane can open. */
export type PaneEntry = {
  id: string;
  label: string;
  order: number;
  component: ComponentType<PaneProps>;
  /**
   * The route's `pane` search param value this kind answers to. Capy only
   * honours `overview` and `diffs` from the URL and drops every other value, so
   * only those entries carry one; the rest open from the tab strip or a menu.
   */
  param?: string;
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

export function findPane(id: string | undefined): PaneEntry | undefined {
  return panes.find((pane) => pane.id === id);
}

/** The pane a `pane` search param value opens, and nothing for a value Capy drops. */
export function findPaneByParam(value: string | undefined) {
  return value === undefined
    ? undefined
    : panes.find((pane) => pane.param === value);
}
