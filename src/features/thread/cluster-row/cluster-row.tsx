import { cx } from "class-variance-authority";
import type { Schema } from "effect";
import type { ComponentProps } from "react";
import type {
  ClusterRow as ClusterRowSchema,
  UpdateRow as UpdateRowSchema,
} from "@/data/events";

import { UpdateRow as UpdateLine } from "@/features/thread/update-row";
import { Icon } from "@/primitives/icon";

type ClusterRowData = Schema.Schema.Type<typeof ClusterRowSchema>;
type UpdateRow = Schema.Schema.Type<typeof UpdateRowSchema>;

export type ClusterRowProps = Omit<
  ComponentProps<"div">,
  "children" | "onToggle"
> & {
  row: ClusterRowData;
  onToggle?: () => void;
  onOpenThread?: (jamId: string) => void;
};

/** Counts consecutive updates by the plural copy Capy shows on the folded line. */
export function clusterSummary(members: readonly UpdateRow[]): string {
  const counts = { task: 0, operation: 0, review: 0, notice: 0 };
  for (const member of members) {
    if (member.kind === "task" && member.outcome !== "archived") counts.task++;
    else if (member.kind === "operation") counts.operation++;
    else if (member.kind === "review") counts.review++;
    else counts.notice++;
  }
  const parts: string[] = [];
  const add = (count: number, singular: string, plural: string) => {
    if (count > 0) parts.push(count === 1 ? singular : `${count} ${plural}`);
  };
  add(counts.task, "subagent report", "subagent reports");
  add(counts.operation, "background command", "background commands");
  add(counts.review, "review", "reviews");
  add(counts.notice, "notice", "notices");
  return parts.join(" · ");
}

/** Consecutive update lines folded behind one collapsible summary. */
export function ClusterRow({
  row,
  onToggle,
  onOpenThread,
  className,
  ...props
}: ClusterRowProps) {
  const expanded = row.expanded === true;
  const summary = clusterSummary(row.members);
  const trigger = (
    <button
      type="button"
      data-slot="collapsible-trigger"
      aria-expanded={expanded}
      onClick={onToggle}
      className="flex w-fit max-w-full min-w-0 cursor-pointer items-center gap-1 text-xs whitespace-nowrap text-muted-foreground-2 hover:text-foreground focus-visible:outline-ring-inset"
    >
      <Icon
        name={expanded ? "chevron-top-small" : "chevron-down-small"}
        className="size-3 shrink-0"
      />
      <span className="min-w-0 truncate">{summary}</span>
    </button>
  );
  return (
    <div className={cx("flex w-full flex-col gap-1", className)} {...props}>
      <div className="flex min-h-7 w-full items-center justify-center">
        {trigger}
      </div>
      {expanded ? (
        <div className="flex flex-col gap-1 py-1">
          {row.members.map((member) => (
            <UpdateLine
              key={member.id}
              row={member}
              onOpenThread={onOpenThread}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
