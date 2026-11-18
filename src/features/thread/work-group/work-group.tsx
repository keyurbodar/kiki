import { cx } from "class-variance-authority";
import { type ComponentProps, useState } from "react";
import type { WorkGroupRow } from "@/data/events";
import {
  ActivityLine,
  ActivityLineMember,
} from "@/features/thread/activity-line";
import { ActivityRow } from "@/features/thread/activity-row";
import { ElapsedFor, useElapsedMs } from "@/features/thread/live-status";
import { TimelineRow } from "@/features/thread/timeline-row";
import { ShimmerText } from "@/primitives/shimmer-text";

type WorkGroup = typeof WorkGroupRow.Type;
type Entry = WorkGroup["entries"][number];

export type WorkGroupPanelProps = ComponentProps<"div"> & {
  clamped?: boolean;
};

export function WorkGroupPanel({
  clamped = false,
  className,
  children,
  ...props
}: WorkGroupPanelProps) {
  return (
    <div data-slot="work-group-panel" className={className} {...props}>
      <div
        data-tail={clamped || undefined}
        className={cx(
          "focus-gutter min-w-0 overflow-clip data-tail:[mask-image:linear-gradient(to_bottom,transparent,black_var(--tail-fade,0))] data-tail:will-change-[opacity]",
          clamped ? "flex max-h-42 flex-col justify-end" : "max-h-max",
        )}
      >
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}

export type WorkGroupPreviewProps = ComponentProps<"div">;

export function WorkGroupPreview(props: WorkGroupPreviewProps) {
  return <div data-slot="work-group-preview" {...props} />;
}

export function failureCount(row: WorkGroup) {
  return row.failures;
}

export function workGroupState(row: WorkGroup) {
  return row.live ? "Working" : "Worked";
}

/** The phrases a settled or live group lists before its clock. */
export function groupPhrases(entries: ReadonlyArray<Entry>): string[] {
  const phrases: string[] = [];
  let issues = 0;
  const flushIssues = () => {
    if (issues > 0)
      phrases.push(`${issues} issue update${issues === 1 ? "" : "s"}`);
    issues = 0;
  };
  for (const entry of entries) {
    if (entry.type !== "update" || entry.kind !== "notice") continue;
    if (entry.notificationKey === "issue_activity") {
      issues += 1;
      continue;
    }
    flushIssues();
    if (entry.summary !== "") phrases.push(entry.summary);
  }
  flushIssues();
  return phrases;
}

function GroupEntry({ entry }: { entry: Entry }) {
  return (
    <div className="min-w-0">
      {entry.type === "activity" ? (
        <ActivityRow row={entry} />
      ) : (
        <TimelineRow row={entry} />
      )}
    </div>
  );
}

function Clock({ row }: { row: WorkGroup }) {
  const elapsed = useElapsedMs(row.startedAt, row.live);
  const ms = row.live && elapsed !== undefined ? elapsed : row.activeMs;
  const failures = failureCount(row);
  if (ms < 1000 && failures === 0) return null;
  return (
    <>
      {ms >= 1000 && <ElapsedFor ms={ms} />}
      {failures > 0 && `, ${failures} failed`}
    </>
  );
}

export type WorkGroupProps = { row: WorkGroup };

export function WorkGroup({ row }: WorkGroupProps) {
  const [expanded, setExpanded] = useState(row.expanded);
  const state = workGroupState(row);
  const phrases = groupPhrases(row.entries);
  const label = (
    <span className="flex min-w-0 items-baseline tabular-nums">
      {phrases.length > 0 && (
        <span className="min-w-0 flex-1 truncate">{`${phrases.join(", ")},`}</span>
      )}
      <span className="min-w-0 truncate">
        <ShimmerText
          data-state={row.live ? "live" : "rest"}
          className="text-shimmer"
        >
          {state}
        </ShimmerText>
      </span>
      <span className="shrink-0 whitespace-pre">
        <Clock row={row} />
      </span>
    </span>
  );
  const showPanel = expanded || row.live;
  return (
    <ActivityLine
      label={label}
      expanded={expanded}
      onToggle={() => setExpanded((open) => !open)}
    >
      <ActivityLineMember open={showPanel}>
        <WorkGroupPanel clamped={!expanded && row.live}>
          <div className="flex flex-col gap-1 pt-1 pb-1 motion-safe:transition-[padding] motion-safe:duration-fast motion-safe:ease-out-quint">
            {row.entries.map((entry) => (
              <GroupEntry key={entry.id} entry={entry} />
            ))}
          </div>
        </WorkGroupPanel>
      </ActivityLineMember>
    </ActivityLine>
  );
}
