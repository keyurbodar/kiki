import { useState } from "react";
import { useIsNarrow } from "@/features/mobile/use-mobile";
import { Button } from "@/primitives/button";
import { MobileListSection } from "../mobile-list-section";
import { MobilePullRow, type MobilePullSection } from "./mobile-pull-row";

export type MobilePullListProps = {
  sections: ReadonlyArray<MobilePullSection>;
  now: number;
  loading: boolean;
  emptyText: string;
  failed?: boolean;
  onRetry?: () => void;
  repoInitials?: (repoFullName: string) => string;
};

/**
 * The pull requests list on phones: state sections built on Collapsible
 * around the pull row, which the container queries in the row itself thin out.
 */
export function MobilePullList({
  sections,
  now,
  loading,
  emptyText,
  failed = false,
  onRetry,
  repoInitials,
}: MobilePullListProps) {
  const mobile = useIsNarrow();
  const [openSections, setOpenSections] = useState<
    Readonly<Record<string, boolean>>
  >({});
  if (!mobile) return null;
  if (failed)
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 py-16 text-sm font-normal text-muted-foreground-2">
        Could not load pull requests
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
        {loading ? "Loading pull requests" : emptyText}
      </div>
    );
  return (
    <div
      data-slot="mobile-pull-list"
      className="@container/list flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain px-2 pt-1 pb-16 [--pull-code-width:max-content]"
    >
      {sections.map((section) => {
        const open = openSections[section.id] ?? true;
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
            <ul className="flex flex-col pt-1">
              {section.members.map((pull) => (
                <li key={pull.id} className="-m-0.5 p-0.5">
                  <MobilePullRow
                    pull={pull}
                    now={now}
                    repoInitials={repoInitials}
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
