import { useEffect, useRef } from "react";
import { Card } from "@/primitives/card";
import { ActivityLoading, cx, skeletonBars } from "./activity-chart";
import {
  type ActivityRange,
  dayBuckets,
  dayKey,
  formatAgentHours,
  formatCount,
  hourMs,
  percentOf,
  seriesForRange,
} from "./activity-range";
import type { OrgActivity } from "./activity-schema";
import { epochMs } from "./activity-time";

const statsGrid =
  "grid grid-cols-2 gap-x-6 gap-y-4 p-4 md:grid-cols-3 lg:grid-cols-6";

const skeletonStats = [
  { label: "w-24", value: "w-12", delta: "w-28" },
  { label: "w-20", value: "w-8", delta: "w-24" },
  { label: "w-28", value: "w-8", delta: "w-20" },
  { label: "w-16", value: "w-8", delta: "w-24" },
  { label: "w-24", value: "w-8", delta: "w-24" },
  { label: "w-20", value: "w-14", delta: "w-24" },
];

const sparkHeight = 28;

function Delta({ value, unit }: { value: number; unit?: string }) {
  return (
    <span className="text-xs font-normal text-muted-foreground-2 tabular-nums">
      {value > 0 ? "+" : ""}
      {value.toLocaleString("en-US")}
      {unit ?? ""} vs last period
    </span>
  );
}

function Note({ children }: { children: string }) {
  return (
    <span className="text-xs font-normal text-muted-foreground-2">
      {children}
    </span>
  );
}

export function SparkBars({ values }: { values: ReadonlyArray<number> }) {
  const max = Math.max(1, ...values);
  const slot = 100 / Math.max(1, values.length);
  return (
    <svg
      viewBox={`0 0 100 ${sparkHeight}`}
      preserveAspectRatio="none"
      className="h-7 w-full"
      aria-hidden
    >
      {values.map((value, index) => {
        const height =
          value === 0 ? 1 : Math.max(2, (value / max) * sparkHeight);
        return (
          <rect
            // biome-ignore lint/suspicious/noArrayIndexKey: one bar per day slot
            key={index}
            x={index * slot + slot * 0.15}
            y={sparkHeight - height}
            width={slot * 0.7}
            height={height}
            rx={0.6}
            fill={value === 0 ? "var(--border-2)" : "var(--chart-1)"}
          />
        );
      })}
    </svg>
  );
}

function Meter({
  fraction,
  tone,
}: {
  fraction: number;
  tone: "primary" | "neutral";
}) {
  return (
    <span
      data-slot="meter"
      className="relative block h-1.5 overflow-hidden rounded-full bg-secondary"
    >
      <span
        className={cx(
          "absolute inset-y-0 left-0 rounded-full",
          tone === "primary" ? "bg-primary" : "bg-muted-foreground-3",
        )}
        style={{ width: `${Math.min(1, Math.max(0, fraction)) * 100}%` }}
      />
    </span>
  );
}

function NowLast({ now, last }: { now: number; last: number }) {
  const max = Math.max(1, now, last);
  return (
    <div className="grid h-7 grid-cols-[auto_minmax(0,1fr)] content-center items-center gap-x-2 gap-y-0.5 text-2xs leading-none font-normal text-muted-foreground-3">
      <span>Now</span>
      <Meter fraction={now / max} tone="primary" />
      <span>Last</span>
      <Meter fraction={last / max} tone="neutral" />
    </div>
  );
}

const ditherMatrix = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];
const ditherCell = 2;
const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

/** Capy's dither fill: an ordered-dither area under a hairline, drawn in currentColor. */
export function DitherFill({
  fractions,
  className,
  peak = 0.5,
  floor = 0.02,
}: {
  fractions: ReadonlyArray<number | null>;
  className?: string;
  peak?: number;
  floor?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const draw = () => {
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      if (width === 0 || height === 0) return;
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.scale(ratio, ratio);
      context.clearRect(0, 0, width, height);
      if (fractions.length === 0) return;
      const color = getComputedStyle(canvas).color;
      const span = height - 2;
      const lineAt = (x: number) => {
        if (fractions.length === 1) {
          const only = fractions[0];
          return only === null || only === undefined
            ? null
            : 1 + (1 - clamp01(only)) * span;
        }
        const t = (x / width) * (fractions.length - 1);
        const i = Math.min(Math.floor(t), fractions.length - 2);
        const a = fractions[i];
        const b = fractions[i + 1];
        if (a === null || b === null || a === undefined || b === undefined)
          return null;
        return (
          1 + (1 - (clamp01(a) + (clamp01(b) - clamp01(a)) * (t - i))) * span
        );
      };
      context.fillStyle = color;
      context.globalAlpha = 0.55;
      for (let x = 0; x < width; x += ditherCell) {
        const top = lineAt(x + ditherCell / 2);
        if (top === null) continue;
        for (let y = 0; y < height; y += ditherCell) {
          if (y + ditherCell / 2 < top) continue;
          const depth = (y + ditherCell / 2 - top) / Math.max(height - top, 1);
          const threshold =
            ((ditherMatrix[(y / ditherCell) % 4]?.[(x / ditherCell) % 4] ?? 0) +
              0.5) /
            16;
          if ((peak - floor) * (1 - depth) ** 1.6 + floor > threshold)
            context.fillRect(x, y, ditherCell, ditherCell);
        }
      }
      context.globalAlpha = 1;
      context.strokeStyle = color;
      context.lineWidth = 1;
      context.lineJoin = "round";
      context.lineCap = "round";
      context.beginPath();
      let drawing = false;
      fractions.forEach((value, index) => {
        if (value === null) {
          drawing = false;
          return;
        }
        const x =
          fractions.length > 1
            ? (index / (fractions.length - 1)) * width
            : width;
        const y = 1 + (1 - clamp01(value)) * span;
        if (drawing) context.lineTo(x, y);
        else {
          context.moveTo(x, y);
          drawing = true;
          if (fractions[index + 1] === undefined) context.lineTo(x, y);
        }
      });
      context.stroke();
    };
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [fractions, peak, floor]);
  return (
    <canvas
      ref={ref}
      className={cx("w-full text-primary", className)}
      aria-hidden
    />
  );
}

export function Stat({
  label,
  value,
  chart,
  delta,
}: {
  label: string;
  value: string;
  chart?: React.ReactNode;
  delta: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className="text-xs font-normal text-muted-foreground-2">
        {label}
      </span>
      <span className="text-xl font-medium text-foreground tabular-nums">
        {value}
      </span>
      <div className="h-7">{chart}</div>
      {delta}
    </div>
  );
}

function StatsSkeleton() {
  return (
    <ActivityLoading>
      <Card className={statsGrid}>
        {skeletonStats.map((widths, index) => (
          <div
            key={widths.label + widths.delta + String(index)}
            className="flex min-w-0 flex-col gap-1.5"
          >
            <div className={cx("h-4 rounded bg-secondary", widths.label)} />
            <div className={cx("h-6.5 rounded bg-secondary", widths.value)} />
            {index === 1 || index === 2 ? (
              <div className="grid h-7 grid-cols-[auto_minmax(0,1fr)] content-center items-center gap-x-2 gap-y-1.5">
                <div className="h-2.5 w-5 rounded bg-secondary" />
                <div className="h-1.5 rounded-full bg-secondary" />
                <div className="h-2.5 w-5 rounded bg-secondary" />
                <div className="h-1.5 rounded-full bg-secondary" />
              </div>
            ) : (
              <div className="flex h-7 items-end gap-0.5">
                {skeletonBars.slice(0, 12).map((bar, bucket) => (
                  <div
                    // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton bars
                    key={bucket}
                    className="flex-1 rounded-t-inner bg-secondary"
                    style={{ height: `${index === 0 ? 70 : bar}%` }}
                  />
                ))}
              </div>
            )}
            <div className={cx("h-4 rounded bg-secondary", widths.delta)} />
          </div>
        ))}
      </Card>
    </ActivityLoading>
  );
}

export const contributionTrend = (
  activity: OrgActivity,
  range: ActivityRange,
) => {
  const byDay = new Map(
    activity.days.map((row) => [
      dayKey(epochMs(row.date), range.timeZone),
      row,
    ]),
  );
  let merged = 0;
  let all = 0;
  return dayBuckets(range).map(({ start }) => {
    const row = byDay.get(start.getTime());
    merged += row?.merged ?? 0;
    all += row?.mergedAll ?? 0;
    return all === 0 ? 0 : (merged / all) * 100;
  });
};

export function ActivityStats({
  activity,
  range,
}: {
  activity: OrgActivity | undefined;
  range: ActivityRange;
}) {
  if (activity === undefined) return <StatsSkeleton />;
  const missingLogins = activity.membersWithoutLogin.length > 0;
  const share = missingLogins
    ? undefined
    : percentOf(activity.merged.current, activity.mergedAll.current);
  const previousShare = missingLogins
    ? undefined
    : percentOf(activity.merged.previous, activity.mergedAll.previous);
  const trend = contributionTrend(activity, range);
  const at = (row: { date: Parameters<typeof epochMs>[0] }) =>
    epochMs(row.date);
  return (
    <Card className={statsGrid}>
      <Stat
        label="Capy contribution"
        value={share === undefined ? "—" : `${share}%`}
        chart={
          share === undefined ? undefined : (
            <DitherFill
              className="h-7 text-chart-1"
              peak={0.85}
              floor={0.14}
              fractions={trend.map((value) => value / 100)}
            />
          )
        }
        delta={
          share !== undefined && previousShare !== undefined ? (
            <Delta value={share - previousShare} unit="pp" />
          ) : (
            <Note>
              {missingLogins
                ? "Needs every member's GitHub account"
                : "No last period"}
            </Note>
          )
        }
      />
      <Stat
        label="Issues detected"
        value={formatCount(activity.findings.current)}
        chart={
          <NowLast
            now={activity.findings.current}
            last={activity.findings.previous}
          />
        }
        delta={
          <Delta
            value={activity.findings.current - activity.findings.previous}
          />
        }
      />
      <Stat
        label="PRs contributed to"
        value={formatCount(activity.contributed.current)}
        chart={
          <NowLast
            now={activity.contributed.current}
            last={activity.contributed.previous}
          />
        }
        delta={
          <Delta
            value={activity.contributed.current - activity.contributed.previous}
          />
        }
      />
      <Stat
        label="PRs merged"
        value={formatCount(activity.merged.current)}
        chart={
          <SparkBars
            values={seriesForRange(
              activity.days,
              range,
              at,
              (row) => row.merged,
            )}
          />
        }
        delta={
          <Delta value={activity.merged.current - activity.merged.previous} />
        }
      />
      {activity.loops === null ? (
        <Stat
          label="Feedback loops"
          value="—"
          delta={<Note>Temporarily unavailable</Note>}
        />
      ) : (
        <Stat
          label="Feedback loops"
          value={formatCount(activity.loops.current)}
          chart={
            <SparkBars
              values={seriesForRange(
                activity.loopDays ?? [],
                range,
                at,
                (row) => row.loops,
              )}
            />
          }
          delta={
            <Delta value={activity.loops.current - activity.loops.previous} />
          }
        />
      )}
      {activity.agentMs === null ? (
        <Stat
          label="Agent hours"
          value="—"
          delta={<Note>Temporarily unavailable</Note>}
        />
      ) : (
        <Stat
          label="Agent hours"
          value={formatAgentHours(activity.agentMs.current)}
          chart={
            <SparkBars
              values={seriesForRange(
                activity.hoursDays ?? [],
                range,
                at,
                (row) => row.agentMs,
              )}
            />
          }
          delta={
            <Delta
              value={Math.round(
                (activity.agentMs.current - activity.agentMs.previous) / hourMs,
              )}
              unit="h"
            />
          }
        />
      )}
    </Card>
  );
}
