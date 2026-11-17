import { ResponsiveMenuItem } from "@/primitives/responsive-menu";
import {
  EntriesPage,
  entryIconClass,
  entryLabelClass,
  entryTrailingClass,
} from "./entries-page";
import { ChatBubbleGlyph } from "./glyphs";
import { matchesQuery, untitledThread } from "./match";

export type CrewThreadEntry = {
  id: string;
  title: string | null;
  code?: string;
};

export type AllThreadsPageProps = {
  threads: ReadonlyArray<CrewThreadEntry>;
  onOpen: (thread: CrewThreadEntry) => void;
  onBack: () => void;
};

export const allThreadsPageSize = 50;

export const matchingCrewThreads = (
  query: string,
  threads: ReadonlyArray<CrewThreadEntry>,
) =>
  threads.filter((thread) =>
    matchesQuery(query, thread.title ?? untitledThread, thread.code),
  );

export function AllThreadsPage({
  threads,
  onOpen,
  onBack,
}: AllThreadsPageProps) {
  return (
    <EntriesPage
      label="All threads"
      searchLabel="Search threads"
      pageSize={allThreadsPageSize}
      onBack={onBack}
    >
      {(query) =>
        matchingCrewThreads(query, threads).map((thread) => (
          <ResponsiveMenuItem
            key={thread.id}
            data-track-owner="features/thread/pane/tab-strip.tsx#ThreadOptions:ResponsiveMenuItem[crew]"
            onClick={() => onOpen(thread)}
          >
            <span className={entryIconClass}>
              <ChatBubbleGlyph />
            </span>
            <span className={entryLabelClass}>
              {thread.title ?? untitledThread}
            </span>
            {thread.code !== undefined && (
              <span className={entryTrailingClass}>{thread.code}</span>
            )}
          </ResponsiveMenuItem>
        ))
      }
    </EntriesPage>
  );
}
