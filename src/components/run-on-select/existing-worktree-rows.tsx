import { useState } from "react";
import {
  joinClasses,
  SelectorCheck,
  SelectorRow,
  SelectorSearch,
  selectorIconSlot,
  selectorItemLabel,
} from "@/components/project-select/selector-parts";
import { DotGridIcon } from "@/primitives/dot-grid-icon";
import { Icon } from "@/primitives/icon";
import { MenuLabel } from "@/primitives/menu";
import { ResponsiveMenuItem } from "@/primitives/responsive-menu";
import { ShimmerText } from "@/primitives/shimmer-text";
import { type DeviceWorkspace, folderName, homePath } from "./entries";

export type WorktreeState =
  | "active"
  | "unused"
  | "other"
  | "missing"
  | "archived";

export type WorktreeEntry = {
  root: string;
  branch?: string;
  commit: string;
  state: WorktreeState;
  dirty: { modified: number; untracked: number };
  createdJamId?: string;
  title?: string;
};

export type ExistingWorktreeRowsProps = {
  entries: readonly WorktreeEntry[] | undefined;
  error?: string;
  selectedRoot?: string;
  linkedRoots: readonly string[];
  scanning: readonly DeviceWorkspace[];
  counting?: ReadonlySet<string>;
  uncounted?: ReadonlySet<string>;
  onPick: (entry: WorktreeEntry) => void;
};

const groups: ReadonlyArray<{
  label: string;
  states: readonly WorktreeState[];
}> = [
  { label: "In use", states: ["active"] },
  { label: "Not in use", states: ["unused"] },
  { label: "Other worktrees", states: ["other", "missing"] },
];

export function worktreeDetails(
  entry: WorktreeEntry,
  linkedRoots: readonly string[],
  uncounted = false,
) {
  return [
    entry.branch ?? `detached @ ${entry.commit.slice(0, 7)}`,
    entry.dirty.modified > 0 ? `${entry.dirty.modified} modified` : undefined,
    entry.dirty.untracked > 0
      ? `${entry.dirty.untracked} untracked`
      : undefined,
    entry.state === "missing" ? "Missing" : undefined,
    entry.state === "other" && !linkedRoots.includes(entry.root)
      ? "Not linked"
      : undefined,
    uncounted ? "Changes unknown" : undefined,
  ].filter((part): part is string => part !== undefined);
}

export function groupWorktrees(
  entries: readonly WorktreeEntry[],
  query: string,
) {
  const q = query.trim().toLowerCase();
  const visible = entries
    .filter((e) => e.state !== "archived")
    .filter(
      (e) =>
        q === "" ||
        folderName(e.root).toLowerCase().includes(q) ||
        (e.branch?.toLowerCase().includes(q) ?? false),
    );
  return groups.flatMap((group) => {
    const rows = visible.filter((e) => group.states.includes(e.state));
    return rows.length === 0 ? [] : [{ label: group.label, rows }];
  });
}

export function WorktreeScanning({
  folders,
}: {
  folders: readonly DeviceWorkspace[];
}) {
  const roots = folders.filter((f) => f.missing !== true).map((f) => f.root);
  const first = roots[0];
  return (
    <div
      role="status"
      className="flex h-(--h-menu-row) items-center gap-2 px-2 text-sm font-normal text-muted-foreground"
    >
      <span className={selectorIconSlot}>
        <DotGridIcon size="inherit" label="Scanning worktrees" />
      </span>
      <span className={selectorItemLabel}>
        {roots.length === 1 && first !== undefined
          ? `Scanning ${homePath(first)}`
          : roots.length > 1
            ? `Scanning ${roots.length} folders`
            : "Scanning worktrees"}
      </span>
    </div>
  );
}

export function ExistingWorktreeRows({
  entries,
  error,
  selectedRoot,
  linkedRoots,
  scanning,
  counting,
  uncounted,
  onPick,
}: ExistingWorktreeRowsProps) {
  const [query, setQuery] = useState("");
  if (entries === undefined) {
    if (error === undefined) return <WorktreeScanning folders={scanning} />;
    return (
      <ResponsiveMenuItem
        data-track-owner="shared/new-thread/existing-worktree-rows.tsx#ExistingWorktreeRows:ResponsiveMenuItem.1"
        disabled
      >
        <span className={selectorItemLabel}>{error}</span>
      </ResponsiveMenuItem>
    );
  }
  if (entries.every((e) => e.state === "archived"))
    return (
      <ResponsiveMenuItem
        data-track-owner="shared/new-thread/existing-worktree-rows.tsx#ExistingWorktreeRows:ResponsiveMenuItem.2"
        disabled
      >
        <span className={selectorItemLabel}>No worktrees yet</span>
      </ResponsiveMenuItem>
    );
  const grouped = groupWorktrees(entries, query);
  return (
    <>
      <SelectorSearch
        placeholder="Search worktrees"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {grouped.length === 0 ? (
        <div className="px-2 py-3 text-center text-sm font-normal text-muted-foreground-2">
          No matches
        </div>
      ) : (
        grouped.map((group) => (
          <div key={group.label} className="flex flex-col">
            <MenuLabel>{group.label}</MenuLabel>
            {group.rows.map((entry) => {
              const missing = entry.state === "missing";
              const unlinked =
                entry.state === "other" && !linkedRoots.includes(entry.root);
              const details = worktreeDetails(
                entry,
                linkedRoots,
                uncounted?.has(entry.root) === true,
              ).join(" · ");
              return (
                <ResponsiveMenuItem
                  key={entry.root}
                  data-track-owner="shared/new-thread/existing-worktree-rows.tsx#ExistingWorktreeRows:ResponsiveMenuItem.3"
                  disabled={missing || unlinked}
                  onClick={
                    missing || unlinked ? undefined : () => onPick(entry)
                  }
                >
                  <SelectorRow
                    density="rich"
                    icon={<Icon name="branch-simple" size="sm" />}
                    label={
                      <span className={joinClasses(missing && "line-through")}>
                        {entry.title ?? folderName(entry.root)}
                      </span>
                    }
                    description={
                      counting?.has(entry.root) === true ? (
                        <ShimmerText>{details}</ShimmerText>
                      ) : (
                        details
                      )
                    }
                    trailing={
                      entry.root === selectedRoot ? (
                        <SelectorCheck />
                      ) : undefined
                    }
                  />
                </ResponsiveMenuItem>
              );
            })}
          </div>
        ))
      )}
    </>
  );
}
