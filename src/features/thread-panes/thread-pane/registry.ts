import type { ComponentType } from "react";

export type PaneProps = { threadId: string };

/**
 * One tab kind the thread pane can open. `id` is the value of the route's
 * `pane` search param for this kind.
 */
export type PaneEntry = {
  id: string;
  label: string;
  order: number;
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

export function findPane(id: string | undefined): PaneEntry | undefined {
  return panes.find((pane) => pane.id === id);
}
