import { cx } from "class-variance-authority";
import type { ReactNode } from "react";
import { Markdown } from "@/components/markdown";
import type { ActivityRow as ActivityRowData } from "@/data/events";
import {
  ElapsedFor,
  elapsedEnter,
  formatDuration,
  RollingNumber,
  useElapsedMs,
} from "@/features/thread/live-status";
import { hasToolBody, ToolBody } from "@/features/thread/tool-body";
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@/primitives/collapsible";
import { ShimmerText } from "@/primitives/shimmer-text";
import { ChevronDownSmall } from "./chevron";
import { ASK_LABELS, toolLabel } from "./tool-label";

type Activity = typeof ActivityRowData.Type;
type ToolRow = Extract<Activity, { kind: "tool" }>;

const rowText = "min-h-7 min-w-0 py-1 text-sm";

export const rowStatic = cx(
  "flex items-center gap-1.5 font-medium text-muted-foreground-1",
  rowText,
);

export const rowTrigger = cx(
  rowText,
  "text-muted-foreground-1 group/collapsible flex cursor-pointer items-center gap-1.5 rounded text-left font-medium outline-none select-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-(--icon-sm) focus-visible:outline-ring-inset focus-gutter w-fit transition-colors duration-hover hover:text-foreground [&>svg:last-child]:opacity-0 [&>svg:last-child]:transition-opacity [&>svg:last-child]:duration-fast [&>svg:last-child]:ease-out-quint [&:hover>svg:last-child]:opacity-100 data-[panel-open]:[&>svg:last-child]:opacity-100 max-w-full [--focus-ring:var(--muted-foreground-2)]",
);

const panel =
  "h-(--collapsible-panel-height) overflow-clip transition-[height,opacity] duration-fast ease-out-quint [overflow-clip-margin:--spacing(2)] motion-reduce:transition-none data-[ending-style]:h-0 data-[ending-style]:opacity-0 data-[ending-style]:duration-exit data-[starting-style]:h-0 data-[starting-style]:opacity-0";

export type RowLabelProps = { text: string; live: boolean };

export function RowLabel({ text, live }: RowLabelProps) {
  return (
    <span className="inline-grid min-w-0 align-baseline">
      <ShimmerText
        data-state={live ? "live" : "rest"}
        className="text-shimmer truncate"
      >
        {text}
      </ShimmerText>
    </span>
  );
}

type RowProps = {
  label: ReactNode;
  trailing?: ReactNode;
  panel?: ReactNode;
  defaultOpen?: boolean;
};

function Row({ label, trailing, panel: body, defaultOpen }: RowProps) {
  const head = (
    <span className="flex min-w-0 items-baseline tabular-nums">
      <span className="min-w-0 truncate">{label}</span>
      {trailing}
    </span>
  );
  if (body === undefined) {
    return (
      <Collapsible data-closed="">
        <div className={rowStatic}>{head}</div>
      </Collapsible>
    );
  }
  return (
    <Collapsible defaultOpen={defaultOpen}>
      <CollapsibleTrigger
        nativeButton={false}
        render={<div />}
        className={rowTrigger}
      >
        {head}
        <ChevronDownSmall />
      </CollapsibleTrigger>
      <CollapsiblePanel className={panel}>{body}</CollapsiblePanel>
    </Collapsible>
  );
}

function Ticking({ startedAt, live }: { startedAt?: Date; live: boolean }) {
  const ms = useElapsedMs(startedAt, live);
  if (ms === undefined) return null;
  return (
    <span className={cx("shrink-0 whitespace-pre", elapsedEnter)}>
      <ElapsedFor ms={ms} />
    </span>
  );
}

function ReasoningLine({
  row,
}: {
  row: Extract<Activity, { kind: "reasoning" }>;
}) {
  const live = row.turnOpen && row.elapsedMs === 0;
  const trailing = live ? (
    <Ticking startedAt={row.startedAt} live />
  ) : (
    <span className="shrink-0 whitespace-pre">
      <ElapsedFor ms={row.elapsedMs} />
    </span>
  );
  const quote =
    row.text.trim() === "" ? undefined : (
      <div className="pt-1 pb-2">
        <div className="relative pl-6">
          <div className="absolute inset-y-0.5 left-[--spacing(2.75)] w-0.5 rounded-full bg-border-3" />
          <Markdown data-component="markdown" data-tone="muted">
            <p>{row.text}</p>
          </Markdown>
        </div>
      </div>
    );
  return (
    <Row
      label={<RowLabel text={live ? "Thinking" : "Thought"} live={live} />}
      trailing={trailing}
      panel={live ? undefined : quote}
    />
  );
}

function liveClock(row: ToolRow) {
  return row.phase === "running" || row.phase === "forming";
}

function ToolLine({ row, open }: { row: ToolRow; open?: boolean }) {
  const live = liveClock(row);
  const ask = row.ask === undefined ? undefined : ASK_LABELS[row.ask];
  const trailing = ask ? (
    <span className="shrink-0 pl-1.5 text-muted-foreground-2">{ask}</span>
  ) : live && !row.untimed ? (
    <LiveSeconds startedAt={row.startedAt} />
  ) : undefined;
  return (
    <Row
      label={<RowLabel text={toolLabel(row)} live={live} />}
      trailing={trailing}
      panel={hasToolBody(row) ? <ToolBody row={row} /> : undefined}
      defaultOpen={open}
    />
  );
}

function LiveSeconds({ startedAt }: { startedAt?: Date }) {
  const ms = useElapsedMs(startedAt, true);
  if (ms === undefined) return null;
  return (
    <span
      className={cx(
        "shrink-0 pl-1.5 text-muted-foreground-2 tabular-nums",
        elapsedEnter,
      )}
    >
      <RollingNumber value={formatDuration(Math.max(1000, ms))} />
    </span>
  );
}

export type ActivityRowProps = {
  row: Activity;
  open?: boolean;
};

export function ActivityRow({ row, open }: ActivityRowProps) {
  switch (row.kind) {
    case "text":
      return (
        <div className="py-1">
          <Markdown data-component="markdown" data-tone="muted">
            <p>{row.text}</p>
          </Markdown>
        </div>
      );
    case "reasoning":
      return <ReasoningLine row={row} />;
    case "tool":
      return <ToolLine row={row} open={open} />;
    case "fallback":
      return (
        <Row
          label={
            <span className="truncate">
              {row.toModel === undefined
                ? `Switched providers from ${row.provider}`
                : `Switched to ${row.toModel}`}
            </span>
          }
        />
      );
    case "wire":
      return <Row label={<span className="truncate">{row.text}</span>} />;
  }
}
