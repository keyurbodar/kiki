import { useState } from "react";
import { useIsNarrow } from "@/features/mobile/use-mobile";
import {
  ThreadRow,
  type ThreadsListIcons,
} from "@/features/threads/threads-list";
import {
  type ProjectSummary,
  sectionStartsOpen,
  type ThreadSection,
} from "@/features/threads/threads-page/model";
import { Button } from "@/primitives/button";
import { MobileListSection } from "../mobile-list-section";

export type MobileThreadListProps = {
  sections: ReadonlyArray<ThreadSection>;
  projects: ReadonlyMap<string, ProjectSummary>;
  modelName: (id: string) => string | undefined;
  groupedByProject: boolean;
  now: number;
  loading: boolean;
  emptyText: string;
  checked: ReadonlySet<string>;
  onCheckedChange: (checked: ReadonlySet<string>) => void;
  onRetry?: () => void;
  failed?: boolean;
  icons?: ThreadsListIcons;
};

/**
 * The threads list on phones. The rows are the desktop `ThreadRow` (its own
 * container queries drop the thread code and badges at this width); the
 * difference is sections built on Collapsible so each one opens in place, and
 * no context-menu wrapper, which Capy drops on `phone`.
 */
export function MobileThreadList({
  sections,
  projects,
  modelName,
  groupedByProject,
  now,
  loading,
  emptyText,
  checked,
  onCheckedChange,
  onRetry,
  failed = false,
  icons,
}: MobileThreadListProps) {
  const mobile = useIsNarrow();
  const [openSections, setOpenSections] = useState<
    Readonly<Record<string, boolean>>
  >({});
  if (!mobile) return null;
  if (failed)
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 py-16 text-sm font-normal text-muted-foreground-2">
        Could not load threads
        {onRetry === undefined ? null : (
          <Button variant="ghost" size="xs" onClick={onRetry}>
            Retry loading
          </Button>
        )}
      </div>
    );
  if (sections.length === 0)
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center py-16 text-sm font-normal text-muted-foreground-2">
        {loading ? "Loading threads" : emptyText}
      </div>
    );
  const onCheck = (id: string) => {
    const next = new Set(checked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onCheckedChange(next);
  };
  return (
    <div
      data-slot="mobile-thread-list"
      className="@container/list flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain px-2 pt-1 pb-16 [--thread-code-width:max-content]"
    >
      {sections.map((section) => {
        const open = openSections[section.id] ?? sectionStartsOpen(section.id);
        return (
          <MobileListSection
            key={section.id}
            label={section.label}
            count={section.members.length}
            open={open}
            onOpenChange={(next) =>
              setOpenSections((current) => ({
                ...current,
                [section.id]: next,
              }))
            }
          >
            <ul className="flex flex-col pt-0.5">
              {section.members.map((thread) => (
                <li key={thread.id} className="group/row">
                  <ThreadRow
                    thread={thread}
                    projects={projects}
                    modelName={modelName}
                    groupedByProject={groupedByProject}
                    now={now}
                    checked={checked.has(thread.id)}
                    selectionMode={checked.size > 0}
                    onCheck={onCheck}
                    icons={icons}
                  />
                </li>
              ))}
            </ul>
          </MobileListSection>
        );
      })}
    </div>
  );
}
