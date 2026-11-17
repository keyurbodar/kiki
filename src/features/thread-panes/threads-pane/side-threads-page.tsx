import type { ReactNode } from "react";
import { ResponsiveMenuItem } from "@/primitives/responsive-menu";
import {
  EntriesPage,
  entryIconClass,
  entryLabelClass,
  entryTrailingClass,
} from "./entries-page";
import { ChatBubbleGlyph, PlusLargeGlyph } from "./glyphs";
import { matchesQuery } from "./match";

const track = (owner: string) =>
  `features/thread/pane/tab-strip.tsx#ThreadOptions:${owner}`;

export type SideThreadEntry = {
  id: string;
  label: string;
  trailing?: ReactNode;
};

export type SideThreadsPageProps = {
  sideThreads: ReadonlyArray<SideThreadEntry>;
  onOpen: (entry: SideThreadEntry) => void;
  onBack: () => void;
  /** Absent when this thread cannot start side threads. */
  onNewSideThread?: () => void;
  newSideThreadShortcut?: string;
};

export const showsSideThreadsPage = (
  query: string,
  count: number,
  canCreate: boolean,
) =>
  query === "" ||
  (canCreate && matchesQuery(query, "new side thread", "side thread")) ||
  count > 0;

export function sideThreadEntries(
  query: string,
  sideThreads: ReadonlyArray<SideThreadEntry>,
  canCreate: boolean,
) {
  return {
    create: canCreate && matchesQuery(query, "new side thread"),
    entries: sideThreads.filter((entry) => matchesQuery(query, entry.label)),
  };
}

export function SideThreadsPage({
  sideThreads,
  onOpen,
  onBack,
  onNewSideThread,
  newSideThreadShortcut,
}: SideThreadsPageProps) {
  return (
    <EntriesPage
      label="Side threads"
      searchLabel="Search side threads"
      onBack={onBack}
    >
      {(query) => {
        const { create, entries } = sideThreadEntries(
          query,
          sideThreads,
          onNewSideThread !== undefined,
        );
        return [
          ...(create
            ? [
                <ResponsiveMenuItem
                  key="new-side-thread"
                  data-track-owner={track(
                    "ResponsiveMenuItem[onClick=onNewSideThread]",
                  )}
                  onClick={onNewSideThread}
                >
                  <span className={entryIconClass}>
                    <PlusLargeGlyph />
                  </span>
                  <span className={entryLabelClass}>New side thread</span>
                  {newSideThreadShortcut !== undefined && (
                    <span className={entryTrailingClass}>
                      {newSideThreadShortcut}
                    </span>
                  )}
                </ResponsiveMenuItem>,
              ]
            : []),
          ...entries.map((entry) => (
            <ResponsiveMenuItem
              key={entry.id}
              data-track-owner={track("ResponsiveMenuItem.2")}
              onClick={() => onOpen(entry)}
            >
              <span className={entryIconClass}>
                <ChatBubbleGlyph />
              </span>
              <span className={entryLabelClass}>{entry.label}</span>
              {entry.trailing}
            </ResponsiveMenuItem>
          )),
        ];
      }}
    </EntriesPage>
  );
}
