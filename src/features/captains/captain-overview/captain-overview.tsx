import { type ReactNode, useState } from "react";
import { formatAge } from "@/features/threads/threads-page/model";

const cx = (...parts: ReadonlyArray<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

export type CaptainIssueActor = {
  readonly name: string;
  readonly avatar?: ReactNode;
};

export type CaptainIssue = {
  readonly id: string;
  readonly code: string;
  readonly title: string;
  readonly unread: boolean;
  readonly updatedAt: Date;
  readonly assignee: CaptainIssueActor | null;
  /** Issue state glyph (Capy's IssueStateIcon). */
  readonly stateIcon?: ReactNode;
  /** Priority glyph (Capy's PriorityIcon). */
  readonly priorityIcon?: ReactNode;
};

export type CaptainOverviewSectionProps = {
  label: string;
  count: number;
  children: ReactNode;
  chevron?: ReactNode;
  defaultOpen?: boolean;
};

/** A collapsible overview section header: label, muted count, chevron. */
export function CaptainOverviewSection({
  label,
  count,
  children,
  chevron,
  defaultOpen = true,
}: CaptainOverviewSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section data-slot="captain-overview-section" className="flex flex-col">
      <button
        type="button"
        aria-expanded={open}
        data-panel-open={open ? "" : undefined}
        onClick={() => setOpen(!open)}
        className="group/collapsible flex h-8 w-full cursor-pointer items-center gap-1.5 rounded-(--radius-card) bg-section px-2 text-left text-sm font-medium text-foreground outline-none focus-visible:outline-ring-inset"
      >
        {label}
        <span className="font-normal text-muted-foreground-3 tabular-nums">
          {count}
        </span>
        <span className="flex size-(--icon-xs) items-center justify-center text-muted-foreground-3 transition-transform duration-100 group-data-[panel-open]/collapsible:rotate-0 -rotate-90">
          {chevron}
        </span>
      </button>
      {open ? <div className="flex flex-col py-1">{children}</div> : null}
    </section>
  );
}

export type CaptainIssueRowProps = {
  issue: CaptainIssue;
  /** "for" on Needs you rows, "with" on In progress rows. */
  relation: "for" | "with";
  now: number;
  onOpenIssue: (code: string, newTab: boolean) => void;
};

export function CaptainIssueRow({
  issue,
  relation,
  now,
  onOpenIssue,
}: CaptainIssueRowProps) {
  return (
    <button
      type="button"
      data-slot="captain-issue-row"
      onClick={(event) =>
        onOpenIssue(issue.code, event.metaKey || event.ctrlKey)
      }
      className="flex w-full cursor-pointer flex-col gap-0.5 rounded px-2 py-1.5 text-left outline-none select-none transition-colors duration-100 hover:bg-section focus-visible:outline-ring-inset"
    >
      <span className="flex min-w-0 items-center gap-2">
        <span className="flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted">
          {issue.stateIcon}
        </span>
        <span
          className={cx(
            "min-w-0 flex-1 truncate text-sm",
            issue.unread
              ? "font-semibold text-foreground"
              : "font-normal text-foreground",
          )}
        >
          {issue.title}
        </span>
        {issue.priorityIcon}
      </span>
      <span className="mask-fade-r flex min-w-0 items-center gap-1.5 overflow-hidden pl-6 text-xs font-normal whitespace-nowrap text-muted-foreground-2">
        <span className="shrink-0">{issue.code}</span>
        {issue.assignee === null ? null : (
          <>
            <span className="shrink-0">{relation}</span>
            {issue.assignee.avatar}
            <span className="truncate">{issue.assignee.name}</span>
            <span className="ml-auto shrink-0 pl-2">
              {formatAge(issue.updatedAt, { now, minified: true })}
            </span>
          </>
        )}
      </span>
    </button>
  );
}

export type CaptainOverviewProps = {
  needsYou: ReadonlyArray<CaptainIssue>;
  inProgress: ReadonlyArray<CaptainIssue>;
  now: number;
  onOpenIssue: (code: string, newTab: boolean) => void;
  chevron?: ReactNode;
};

/** The captain's issue sections in the thread overview pane: Needs you, then In progress. */
export function CaptainOverview({
  needsYou,
  inProgress,
  now,
  onOpenIssue,
  chevron,
}: CaptainOverviewProps) {
  return (
    <div data-slot="captain-overview" className="flex flex-col gap-1">
      {needsYou.length === 0 ? null : (
        <CaptainOverviewSection
          label="Needs you"
          count={needsYou.length}
          chevron={chevron}
        >
          {needsYou.map((issue) => (
            <CaptainIssueRow
              key={issue.id}
              issue={issue}
              relation="for"
              now={now}
              onOpenIssue={onOpenIssue}
            />
          ))}
        </CaptainOverviewSection>
      )}
      {inProgress.length === 0 ? null : (
        <CaptainOverviewSection
          label="In progress"
          count={inProgress.length}
          chevron={chevron}
        >
          {inProgress.map((issue) => (
            <CaptainIssueRow
              key={issue.id}
              issue={issue}
              relation="with"
              now={now}
              onOpenIssue={onOpenIssue}
            />
          ))}
        </CaptainOverviewSection>
      )}
    </div>
  );
}
