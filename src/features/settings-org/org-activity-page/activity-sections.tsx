import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent } from "@/primitives/card";
import {
  ActivityNotice,
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartSkeleton,
  ChartTooltipContent,
  chartColor,
  chartMargin,
  cx,
} from "./activity-chart";
import {
  type ActivityRange,
  dayBuckets,
  dayKey,
  formatCount,
  formatDayLabel,
  formatTickDate,
  hourMs,
  niceTicks,
  roundedHours,
  seriesForRange,
} from "./activity-range";
import type {
  ActivityMemberSplit,
  FleetHourlyActivity,
  OrgActivity,
} from "./activity-schema";
import { epochMs } from "./activity-time";
import {
  formerMember,
  MemberAvatar,
  type MemberDisplay,
} from "./member-avatar";

export const mergedChartHeight = 208;
export const smallChartHeight = 160;

export type People = ReadonlyMap<string, MemberDisplay>;

const xAxis = (
  <XAxis
    dataKey="start"
    tickLine={false}
    axisLine={false}
    dy={4}
    tickFormatter={formatTickDate}
    interval="preserveStartEnd"
    minTickGap={24}
  />
);

const grid = <CartesianGrid vertical={false} strokeWidth={0.5} />;

const tooltipLabel = (value: string) => formatDayLabel(value);

const otherKey = "other";
const withoutKey = "without";

export type MemberRows = Array<Record<string, string | number>>;

export const memberRows = (
  split: ActivityMemberSplit,
  range: ActivityRange,
  value: (raw: number) => number,
): MemberRows => {
  const byDay = new Map(
    split.days.map((row) => [dayKey(epochMs(row.date), range.timeZone), row]),
  );
  return dayBuckets(range).map(({ start }) => {
    const row = byDay.get(start.getTime());
    return {
      start: start.toISOString(),
      ...Object.fromEntries(
        split.members.map((_, index) => [
          `member${index}`,
          value(row?.members[index] ?? 0),
        ]),
      ),
      [otherKey]: value(row?.others ?? 0),
    };
  });
};

function MemberSplitChart({
  split,
  rows,
  people,
  format,
  onMember,
  without,
  yAxisWidth,
  allowDecimals,
}: {
  split: ActivityMemberSplit;
  rows: MemberRows;
  people: People;
  format: (value: number) => string;
  onMember: (userId: string) => void;
  without?: { label: string; total: string };
  yAxisWidth: number;
  allowDecimals: boolean;
}) {
  const series = split.members.map((member, index) => {
    const display = people.get(member.userId) ?? formerMember;
    return {
      key: `member${index}`,
      userId: member.userId,
      display,
      total: format(member.total),
    };
  });
  const config: ChartConfig = Object.fromEntries([
    ...series.map((entry, index) => [
      entry.key,
      { label: entry.display.name, color: chartColor(index) },
    ]),
    ...(split.others > 0
      ? [[otherKey, { label: "Everyone else", color: "var(--chart-other)" }]]
      : []),
    ...(without === undefined
      ? []
      : [
          [
            withoutKey,
            { label: without.label, color: "var(--muted-foreground-3)" },
          ],
        ]),
  ]);
  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <ChartContainer config={config} className="h-52">
          <LineChart
            accessibilityLayer={false}
            data={rows}
            margin={chartMargin}
          >
            {grid}
            {xAxis}
            <YAxis
              tickLine={false}
              axisLine={false}
              width={yAxisWidth}
              allowDecimals={allowDecimals}
            />
            <Tooltip
              content={
                <ChartTooltipContent
                  labelFormatter={tooltipLabel}
                  valueFormatter={(value) => format(value)}
                />
              }
            />
            {Object.entries(config).map(([key, entry]) => (
              <Line
                key={key}
                dataKey={key}
                type="monotone"
                stroke={entry.color}
                strokeWidth={
                  key === withoutKey || key === otherKey ? 1.25 : 1.5
                }
                strokeDasharray={key === withoutKey ? "4 3" : undefined}
                dot={false}
                activeDot={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ChartContainer>
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {series.map((entry, index) => (
            <li key={entry.key}>
              <button
                type="button"
                aria-label={`Filter to ${entry.display.name}`}
                onClick={() => onMember(entry.userId)}
                className="flex items-center gap-1.5 rounded text-2xs outline-none focus-visible:outline-ring-inset"
              >
                <span
                  className="size-2.5 shrink-0 rounded-(--radius-inner)"
                  style={{ background: chartColor(index) }}
                />
                <MemberAvatar display={entry.display} />
                <span className="text-muted-foreground-1">
                  {entry.display.name}
                </span>
                <span className="text-muted-foreground-2 tabular-nums">
                  {entry.total}
                </span>
              </button>
            </li>
          ))}
          {split.others > 0 && (
            <li className="flex items-center gap-1.5 text-2xs">
              <span
                className="size-2.5 shrink-0 rounded-(--radius-inner)"
                style={{ background: "var(--chart-other)" }}
              />
              <span className="text-muted-foreground-1">Everyone else</span>
              <span className="text-muted-foreground-2 tabular-nums">
                {format(split.others)}
              </span>
            </li>
          )}
          {without !== undefined && (
            <li className="flex items-center gap-1.5 text-2xs">
              <span
                className="size-2.5 shrink-0 rounded-(--radius-inner)"
                style={{ background: "var(--muted-foreground-3)" }}
              />
              <span className="text-muted-foreground-1">{without.label}</span>
              <span className="text-muted-foreground-2 tabular-nums">
                {without.total}
              </span>
            </li>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}

type SplitProps = {
  activity: OrgActivity | undefined;
  range: ActivityRange;
  split: "total" | "member" | "trigger";
  people: People;
  onMember: (userId: string) => void;
};

const mergedConfig: ChartConfig = {
  merged: { label: "With Capy", color: chartColor(0) },
  without: { label: "Without Capy", color: chartColor(1) },
};

export function MergedChart({
  activity,
  range,
  split,
  people,
  onMember,
}: SplitProps) {
  if (activity === undefined)
    return <ChartSkeleton height={mergedChartHeight} legend={2} />;
  if (activity.membersWithoutLogin.length > 0)
    return <ActivityNotice>Needs every member's GitHub account</ActivityNotice>;
  if (activity.mergedAll.current === 0)
    return (
      <ActivityNotice>
        No pull requests merged in selected period
      </ActivityNotice>
    );
  const byDay = new Map(
    activity.days.map((row) => [
      dayKey(epochMs(row.date), range.timeZone),
      row,
    ]),
  );
  const rows = dayBuckets(range).map(({ start }) => {
    const row = byDay.get(start.getTime());
    return {
      start: start.toISOString(),
      merged: row?.merged ?? 0,
      without: row?.without ?? 0,
    };
  });
  if (split === "member")
    return (
      <MemberSplitChart
        split={activity.mergedByMember}
        rows={memberRows(activity.mergedByMember, range, (value) => value).map(
          (row, index) => ({ ...row, [withoutKey]: rows[index]?.without ?? 0 }),
        )}
        people={people}
        format={formatCount}
        onMember={onMember}
        without={{
          label: "Without Capy",
          total: formatCount(rows.reduce((sum, row) => sum + row.without, 0)),
        }}
        yAxisWidth={32}
        allowDecimals={false}
      />
    );
  const connected =
    activity.connectedAt !== null &&
    epochMs(activity.connectedAt) >= range.from.getTime() &&
    epochMs(activity.connectedAt) < range.to.getTime()
      ? new Date(
          dayKey(epochMs(activity.connectedAt), range.timeZone),
        ).toISOString()
      : undefined;
  const ticks = niceTicks(
    Math.max(...rows.map((row) => Math.max(row.merged, row.without))),
  );
  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <ChartContainer config={mergedConfig} className="h-52">
          <LineChart
            accessibilityLayer={false}
            data={rows}
            margin={chartMargin}
          >
            {grid}
            {xAxis}
            <YAxis
              tickLine={false}
              axisLine={false}
              width={32}
              domain={[0, ticks.at(-1) ?? 0]}
              ticks={ticks}
            />
            <Tooltip
              content={<ChartTooltipContent labelFormatter={tooltipLabel} />}
            />
            {connected !== undefined && (
              <ReferenceLine
                x={connected}
                strokeDasharray="3 3"
                label={{
                  value: "Capy connected",
                  position: "insideTopRight",
                  fill: "var(--muted-foreground-2)",
                }}
              />
            )}
            <Line
              dataKey="merged"
              type="monotone"
              stroke={chartColor(0)}
              strokeWidth={1.5}
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />
            <Line
              dataKey="without"
              type="monotone"
              stroke={chartColor(1)}
              strokeWidth={1.5}
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ChartContainer>
        <ChartLegend config={mergedConfig} />
      </CardContent>
    </Card>
  );
}

export const loopTriggers = [
  { key: "ci_failed", label: "CI failures", color: chartColor(0) },
  {
    key: "review_finding",
    label: "Capy review findings",
    color: chartColor(1),
  },
  { key: "pr_feedback_human", label: "Human feedback", color: chartColor(2) },
  { key: "pr_feedback_bot", label: "Bot feedback", color: chartColor(3) },
] as const;

const loopsConfig: ChartConfig = Object.fromEntries(
  loopTriggers.map((trigger) => [
    trigger.key,
    { label: trigger.label, color: trigger.color },
  ]),
);

export const loopRows = (activity: OrgActivity, range: ActivityRange) => {
  const byDay = new Map<number, Record<string, number>>();
  for (const row of activity.loopDays ?? []) {
    const key = dayKey(epochMs(row.date), range.timeZone);
    const day = byDay.get(key) ?? {};
    day[row.trigger] = (day[row.trigger] ?? 0) + row.loops;
    byDay.set(key, day);
  }
  return dayBuckets(range).map(({ start }) => {
    const day = byDay.get(start.getTime()) ?? {};
    return {
      start: start.toISOString(),
      ...Object.fromEntries(
        loopTriggers.map((trigger) => [trigger.key, day[trigger.key] ?? 0]),
      ),
    };
  });
};

export function FeedbackLoopsChart({
  activity,
  range,
  split,
  people,
  onMember,
}: SplitProps) {
  if (activity === undefined)
    return <ChartSkeleton height={smallChartHeight} legend={4} />;
  if (
    activity.loops === null ||
    activity.loopDays === null ||
    activity.loopsByMember === null
  )
    return (
      <ActivityNotice>
        Feedback loops are temporarily unavailable
      </ActivityNotice>
    );
  if (activity.loops.current === 0)
    return (
      <ActivityNotice>No feedback loops in selected period</ActivityNotice>
    );
  if (split === "member")
    return (
      <MemberSplitChart
        split={activity.loopsByMember}
        rows={memberRows(activity.loopsByMember, range, (value) => value)}
        people={people}
        format={formatCount}
        onMember={onMember}
        yAxisWidth={32}
        allowDecimals={false}
      />
    );
  const rows = loopRows(activity, range);
  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <ChartContainer config={loopsConfig} className="h-40">
          <BarChart accessibilityLayer={false} data={rows} margin={chartMargin}>
            {grid}
            {xAxis}
            <YAxis
              tickLine={false}
              axisLine={false}
              width={32}
              allowDecimals={false}
            />
            <Tooltip
              cursor={false}
              content={<ChartTooltipContent labelFormatter={tooltipLabel} />}
            />
            {loopTriggers.map((trigger, index) => (
              <Bar
                key={trigger.key}
                dataKey={trigger.key}
                stackId="loops"
                fill={trigger.color}
                stroke="var(--card)"
                strokeWidth={1}
                isAnimationActive={false}
                radius={index === loopTriggers.length - 1 ? [2, 2, 0, 0] : 0}
              />
            ))}
          </BarChart>
        </ChartContainer>
        <ChartLegend config={loopsConfig} />
      </CardContent>
    </Card>
  );
}

const hoursConfig: ChartConfig = {
  hours: { label: "Hours", color: chartColor(0) },
};

export function AgentHoursChart({
  activity,
  range,
  split,
  people,
  onMember,
}: SplitProps) {
  if (activity === undefined)
    return <ChartSkeleton height={smallChartHeight} legend={0} />;
  if (
    activity.agentMs === null ||
    activity.hoursDays === null ||
    activity.hoursByMember === null
  )
    return (
      <ActivityNotice>Agent hours are temporarily unavailable</ActivityNotice>
    );
  if (activity.agentMs.current === 0)
    return <ActivityNotice>No agent time in selected period</ActivityNotice>;
  if (split === "member")
    return (
      <MemberSplitChart
        split={activity.hoursByMember}
        rows={memberRows(activity.hoursByMember, range, roundedHours)}
        people={people}
        format={(value) => `${roundedHours(value * hourMs)}h`}
        onMember={onMember}
        yAxisWidth={40}
        allowDecimals
      />
    );
  const buckets = dayBuckets(range);
  const rows = seriesForRange(
    activity.hoursDays,
    range,
    (row) => epochMs(row.date),
    (row) => row.agentMs,
  ).map((agentMs, index) => ({
    start: buckets[index]?.start.toISOString() ?? "",
    hours: roundedHours(agentMs),
  }));
  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <ChartContainer config={hoursConfig} className="h-40">
          <BarChart accessibilityLayer={false} data={rows} margin={chartMargin}>
            {grid}
            {xAxis}
            <YAxis
              tickLine={false}
              axisLine={false}
              width={36}
              tickFormatter={(value) => `${value}h`}
            />
            <Tooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={tooltipLabel}
                  valueFormatter={(value) => `${value}h`}
                />
              }
            />
            <Bar
              dataKey="hours"
              fill={chartColor(0)}
              stroke="var(--card)"
              strokeWidth={1}
              isAnimationActive={false}
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

const weekdayNames = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const hourLabels = Array.from({ length: 24 }, (_, hour) =>
  String(hour).padStart(2, "0"),
);
const legendSteps = [0.12, 0.3, 0.5, 0.75, 1];

const hoursLabel = (ms: number) =>
  `${(ms / hourMs).toLocaleString("en-US", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  })}h`;

function HeatGrid({
  label,
  columns,
  rows,
  values,
  tooltip,
}: {
  label: string;
  columns: ReadonlyArray<string>;
  rows: ReadonlyArray<string>;
  values: ReadonlyArray<ReadonlyArray<number | null>>;
  tooltip: (column: number, row: number) => string;
}) {
  const max = Math.max(1, ...values.flat().map((value) => value ?? 0));
  return (
    // biome-ignore lint/a11y/useSemanticElements: Capy renders the heatmap as divs with grid roles
    <div
      role="grid"
      aria-label={label}
      className="flex flex-col gap-1 overflow-x-auto"
    >
      {rows.map((row, rowIndex) => (
        // biome-ignore lint/a11y/useSemanticElements: Capy renders heatmap rows as divs
        // biome-ignore lint/a11y/useFocusableInteractive: heatmap cells are read-only
        <div
          key={row || "hours"}
          role="row"
          className="flex items-center gap-1"
        >
          {row !== "" && (
            <span className="w-8 shrink-0 text-2xs text-muted-foreground-3">
              {row.slice(0, 3)}
            </span>
          )}
          {columns.map((column, columnIndex) => {
            const value = values[columnIndex]?.[rowIndex] ?? null;
            return (
              // biome-ignore lint/a11y/useSemanticElements: Capy renders heatmap cells as spans
              // biome-ignore lint/a11y/useFocusableInteractive: heatmap cells are read-only
              <span
                key={column}
                role="gridcell"
                title={tooltip(columnIndex, rowIndex)}
                className="relative aspect-square min-w-2.5 flex-1 rounded-inner bg-secondary"
              >
                {value !== null && value > 0 && (
                  <span
                    className="absolute inset-0 rounded-inner bg-chart-1"
                    style={{ opacity: Math.max(0.12, value / max) }}
                  />
                )}
              </span>
            );
          })}
        </div>
      ))}
      <div className="flex items-center gap-1">
        {rows[0] !== "" && <span className="w-8 shrink-0" />}
        {columns.map((column, index) => (
          <span
            key={column}
            className="min-w-2.5 flex-1 text-center text-2xs text-muted-foreground-3"
          >
            {index % 3 === 0 ? column : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

const centered =
  "flex min-h-40 items-center justify-center text-sm text-muted-foreground-1";

export function HourlyActivity({
  hourly,
  failed,
  retry,
}: {
  hourly: FleetHourlyActivity | null | undefined;
  failed: boolean;
  retry: ReactNode;
}) {
  const unavailable = failed || hourly === null;
  const cells = new Map(
    (hourly?.cells ?? []).map((cell) => [`${cell.weekday}:${cell.hour}`, cell]),
  );
  const empty =
    hourly != null &&
    (hourly.hours === null
      ? hourly.cells.every((cell) => cell.agentMs === 0)
      : hourly.hours.every((slot) => slot.agentMs === 0));
  let body: ReactNode;
  if (unavailable)
    body = (
      <div className="flex min-h-40 items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground-1">
          Could not load hourly usage
        </p>
        {retry}
      </div>
    );
  else if (hourly === undefined)
    body = (
      <div
        role="status"
        aria-label="Loading"
        className="animate-skeleton-pulse"
      >
        <div className="h-60 w-full rounded bg-secondary" />
      </div>
    );
  else if (hourly.hours !== null && empty)
    body = <div className={centered}>No agent time in selected period</div>;
  else if (hourly.hours === null && hourly.completeDays < 7)
    body = (
      <div className={centered}>Not enough history for a weekday pattern</div>
    );
  else if (empty)
    body = <div className={centered}>No agent time in selected period</div>;
  else if (hourly.hours === null)
    body = (
      <HeatGrid
        label={`Agent hours by weekday and hour, ${hourly.timezone}, arrow keys move between cells`}
        columns={hourLabels}
        rows={weekdayNames}
        values={hourLabels.map((_, hour) =>
          weekdayNames.map(
            (_, day) => cells.get(`${day + 1}:${hour}`)?.meanAgentMs ?? null,
          ),
        )}
        tooltip={(hour, day) => {
          const cell = cells.get(`${day + 1}:${hour}`);
          return cell === undefined
            ? ""
            : `${weekdayNames[day]}, ${hourLabels[hour]}:00–${String(hour + 1).padStart(2, "0")}:00 · Average agent time ${hoursLabel(cell.meanAgentMs)} · Total agent time ${hoursLabel(cell.agentMs)} · Runs started ${cell.turnCount.toLocaleString("en-US")}`;
        }}
      />
    );
  else {
    const hours = hourly.hours;
    body = (
      <HeatGrid
        label={`Agent hours by start hour, ${hourly.timezone}`}
        columns={hours.map((slot) =>
          new Date(epochMs(slot.from)).toLocaleTimeString("en-US", {
            timeZone: hourly.timezone,
            hour: "2-digit",
            hourCycle: "h23",
          }),
        )}
        rows={[""]}
        values={hours.map((slot) => [slot.agentMs])}
        tooltip={(column) => {
          const slot = hours[column];
          return slot === undefined
            ? ""
            : `Agent time ${hoursLabel(slot.agentMs)} · ${slot.turnCount.toLocaleString("en-US")} runs started`;
        }}
      />
    );
  }
  const legend =
    !unavailable &&
    hourly != null &&
    !empty &&
    (hourly.hours !== null || hourly.completeDays >= 7);
  return (
    <Card>
      <CardContent className="flex flex-col gap-5">
        {body}
        {legend && (
          <div className="flex items-center gap-2 text-2xs text-muted-foreground-1">
            <span>Less</span>
            <div className="flex gap-1" aria-hidden>
              {legendSteps.map((step) => (
                <span
                  key={step}
                  className={cx("size-2.5 rounded-inner bg-chart-1")}
                  style={{ opacity: step }}
                />
              ))}
            </div>
            <span>More</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export const hourlyTitle = (hourly: FleetHourlyActivity | null | undefined) =>
  hourly?.hours
    ? "Agent hours by start hour"
    : "Agent hours by weekday and hour";
