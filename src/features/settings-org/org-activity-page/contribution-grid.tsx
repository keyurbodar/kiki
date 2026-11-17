import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/primitives/card";
import { ActivityLoading, cx } from "./activity-chart";
import {
  addDays,
  dayKey,
  formatCount,
  isoDate,
  startOfDay,
} from "./activity-range";
import type { ActivityTouchDay, OrgActivity } from "./activity-schema";
import { epochMs } from "./activity-time";

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const levels = [
  "opacity-0",
  "opacity-25",
  "opacity-50",
  "opacity-75",
  "opacity-100",
];
const cellClass = "aspect-square min-w-2.5 rounded-inner bg-secondary";
const axisClass =
  "flex items-center text-2xs leading-none font-normal text-muted-foreground-3";
const skeletonWeeks = 52;
const hideDelay = 100;

const monthName = (ms: number, timeZone: string) =>
  new Date(ms).toLocaleDateString("en-US", { month: "short", timeZone });

const weekdayName = (ms: number, timeZone: string) =>
  new Date(ms).toLocaleDateString("en-US", { weekday: "short", timeZone });

export type ContributionModel = {
  touches: Map<number, ActivityTouchDay>;
  days: Array<{ day: number; total: number }>;
  weeks: number;
  offset: number;
  monthLabels: string[];
  owners: string[];
  total: number;
  level: (total: number) => number;
};

export const contributionModel = (
  activity: Pick<OrgActivity, "to" | "touches">,
  timeZone: string,
): ContributionModel => {
  const touches = new Map(
    activity.touches.map((touch) => [
      dayKey(epochMs(touch.date), timeZone),
      touch,
    ]),
  );
  const end = addDays(epochMs(activity.to) - 1, 1, timeZone);
  const start = addDays(end, -365, timeZone);
  const offset = weekdays.indexOf(weekdayName(start, timeZone));
  const gridStart = addDays(start, -offset, timeZone);
  const days: Array<{ day: number; total: number }> = [];
  for (
    let day = startOfDay(start, timeZone);
    day < end;
    day = addDays(day, 1, timeZone)
  )
    days.push({ day, total: touches.get(day)?.total ?? 0 });
  const max = Math.max(1, ...days.map((day) => day.total));
  const weeks = Math.ceil((days.length + offset) / 7);
  const month = (ms: number) => isoDate(ms, timeZone).slice(0, 7);
  const monthLabels = Array.from({ length: weeks }, (_, week) => {
    const at = addDays(gridStart, week * 7, timeZone);
    if (week === 0)
      return month(at) === month(addDays(gridStart, (week + 2) * 7, timeZone))
        ? monthName(at, timeZone)
        : "";
    return month(at) === month(addDays(gridStart, (week - 1) * 7, timeZone))
      ? ""
      : monthName(at, timeZone);
  });
  const owners = [
    ...new Set(
      activity.touches.flatMap((touch) =>
        touch.repos.map((repo) =>
          repo.repoFullName.slice(0, repo.repoFullName.indexOf("/")),
        ),
      ),
    ),
  ];
  return {
    touches,
    days,
    weeks,
    offset,
    monthLabels,
    owners,
    total: days.reduce((sum, day) => sum + day.total, 0),
    level: (total) =>
      total === 0 ? 0 : Math.min(4, 1 + Math.floor((total / max) * 3.999)),
  };
};

const ownerAvatar = (owner: string) =>
  `https://avatars.githubusercontent.com/${encodeURIComponent(owner)}?s=32`;

function Grid({
  weeks,
  monthLabels,
  cells,
  handlers,
  footer,
}: {
  weeks: number;
  monthLabels: ReadonlyArray<string>;
  cells: React.ReactNode;
  handlers?: React.HTMLAttributes<HTMLDivElement>;
  footer: React.ReactNode;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = scroller.current;
    if (element !== null) element.scrollLeft = element.scrollWidth;
  }, []);
  return (
    <Card>
      <CardContent className="relative flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="grid shrink-0 grid-rows-[0.75rem_repeat(7,minmax(0,1fr))] gap-0.5">
            <span />
            {weekdays.map((name, index) => (
              <span key={name} className={axisClass}>
                {index % 2 === 1 ? name : ""}
              </span>
            ))}
          </div>
          <div
            ref={scroller}
            className="scrollbar-hide scroll-fade-x grid min-w-0 flex-1 grid-flow-col grid-rows-[0.75rem_repeat(7,auto)] gap-0.5 overflow-x-auto [--scroll-fade-ramp:--spacing(6)]"
            style={{
              gridTemplateColumns: `repeat(${weeks}, minmax(0.625rem, 1fr))`,
            }}
            {...handlers}
          >
            {Array.from({ length: weeks }, (_, week) => (
              <span
                // biome-ignore lint/suspicious/noArrayIndexKey: one label per week column
                key={week}
                className="h-3 overflow-visible text-2xs leading-none font-normal whitespace-nowrap text-muted-foreground-3"
                style={{ gridColumn: week + 1, gridRow: 1 }}
              >
                {monthLabels[week]}
              </span>
            ))}
            {cells}
          </div>
        </div>
        <div className="flex min-h-4 flex-wrap items-center justify-between gap-2 text-xs font-normal text-muted-foreground-2 tabular-nums">
          {footer}
        </div>
      </CardContent>
    </Card>
  );
}

function TouchRepos({ touch }: { touch: ActivityTouchDay }) {
  return (
    <div className="mt-1.5 mb-0.5 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1 font-normal">
      {touch.repos.map((repo) => {
        const slash = repo.repoFullName.indexOf("/");
        const owner = repo.repoFullName.slice(0, Math.max(0, slash));
        const name = repo.repoFullName.slice(slash + 1);
        return (
          <div key={repo.repoFullName} className="contents">
            <img
              src={ownerAvatar(owner)}
              alt={owner}
              className="size-4 shrink-0 rounded-full"
            />
            <span className="truncate">
              <span className="text-muted-foreground-2">{owner}/</span>
              <span className="text-foreground">{name}</span>
            </span>
            <span className="text-right text-foreground tabular-nums">
              {repo.touches}
            </span>
          </div>
        );
      })}
      {touch.moreRepos > 0 && (
        <div className="contents text-muted-foreground-2">
          <span />
          <span>{touch.moreRepos} more</span>
          <span className="text-right tabular-nums">{touch.moreTouches}</span>
        </div>
      )}
      {touch.noRepo > 0 && (
        <div className="contents text-muted-foreground-2">
          <span />
          <span>No repository</span>
          <span className="text-right tabular-nums">{touch.noRepo}</span>
        </div>
      )}
    </div>
  );
}

function GridSkeleton() {
  return (
    <ActivityLoading>
      <Grid
        weeks={skeletonWeeks}
        monthLabels={[]}
        cells={Array.from({ length: 364 }, (_, index) => (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton cells
            key={index}
            className={cellClass}
            style={{
              gridColumn: Math.floor(index / 7) + 1,
              gridRow: (index % 7) + 2,
            }}
          />
        ))}
        footer={
          <>
            <span className="h-4 w-48 rounded bg-secondary" />
            <span className="h-4 w-24 rounded bg-secondary" />
          </>
        }
      />
    </ActivityLoading>
  );
}

const touchesLabel = (total: number) =>
  `${formatCount(total)} ${total === 1 ? "touch" : "touches"}`;

export function ContributionGrid({
  activity,
  timeZone,
}: {
  activity: OrgActivity | undefined;
  timeZone: string;
}) {
  const model = useMemo(
    () =>
      activity === undefined
        ? undefined
        : contributionModel(activity, timeZone),
    [activity, timeZone],
  );
  const [hover, setHover] = useState<
    { index: number; cell: HTMLElement } | undefined
  >();
  const [focused, setFocused] = useState<number | undefined>();
  const hideTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(hideTimer.current), []);
  useEffect(() => {
    for (const owner of model?.owners ?? [])
      new Image().src = ownerAvatar(owner);
  }, [model]);
  if (model === undefined) return <GridSkeleton />;

  const cellFor = (target: EventTarget | null) => {
    const cell =
      target instanceof Element ? target.closest("[data-day]") : null;
    if (!(cell instanceof HTMLElement)) return undefined;
    window.clearTimeout(hideTimer.current);
    hideTimer.current = undefined;
    const index = Number(cell.dataset.day);
    setHover((current) =>
      current?.index === index ? current : { index, cell },
    );
    return index;
  };
  const hide = () => setHover(undefined);
  const handlers: React.HTMLAttributes<HTMLDivElement> = {
    onPointerOver: (event) => {
      if (
        cellFor(event.target) === undefined &&
        hideTimer.current === undefined
      )
        hideTimer.current = window.setTimeout(() => {
          hideTimer.current = undefined;
          hide();
        }, hideDelay);
    },
    onPointerLeave: () => {
      window.clearTimeout(hideTimer.current);
      hideTimer.current = undefined;
      hide();
    },
    onFocus: (event) => {
      const index = cellFor(event.target);
      if (index !== undefined) setFocused(index);
    },
    onBlur: (event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) hide();
    },
    onKeyDown: (event) => {
      if (event.key === "Escape") return hide();
      if (focused === undefined) return;
      const step =
        event.key === "ArrowDown"
          ? 1
          : event.key === "ArrowUp"
            ? -1
            : event.key === "ArrowRight"
              ? 7
              : event.key === "ArrowLeft"
                ? -7
                : undefined;
      if (step === undefined) return;
      event.preventDefault();
      const next = focused + step;
      if (next < 0 || next >= model.days.length) return;
      const cell = event.currentTarget.querySelector(`[data-day="${next}"]`);
      if (cell instanceof HTMLElement) cell.focus();
    },
  };
  const hovered = hover === undefined ? undefined : model.days[hover.index];
  const touch =
    hovered === undefined ? undefined : model.touches.get(hovered.day);
  const dayLabel = (ms: number) =>
    `${new Date(ms).toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone,
    })} (${timeZone})`;
  return (
    <div className="relative">
      <Grid
        weeks={model.weeks}
        monthLabels={model.monthLabels}
        handlers={handlers}
        cells={model.days.map((day, index) => (
          <button
            key={day.day}
            type="button"
            data-day={index}
            tabIndex={index === (focused ?? model.days.length - 1) ? 0 : -1}
            aria-label={`${dayLabel(day.day)}, ${touchesLabel(day.total)}`}
            className={cx(
              cellClass,
              "relative [--focus-ring:var(--foreground)] hover:outline-ring-inset focus-visible:outline-ring-inset",
            )}
            style={{
              gridColumn: Math.floor((index + model.offset) / 7) + 1,
              gridRow: ((index + model.offset) % 7) + 2,
            }}
          >
            <span
              className={cx(
                "pointer-events-none absolute inset-0 rounded-inner bg-chart-1",
                levels[model.level(day.total)],
              )}
            />
          </button>
        ))}
        footer={
          <>
            <span>{formatCount(model.total)} touches in the last 365 days</span>
            <span className="flex items-center gap-1">
              Less
              {levels.map((level) => (
                <span
                  key={level}
                  className="relative size-2.5 rounded-inner bg-secondary"
                >
                  <span
                    className={cx(
                      "absolute inset-0 rounded-inner bg-chart-1",
                      level,
                    )}
                  />
                </span>
              ))}
              More
            </span>
          </>
        }
      />
      {hover !== undefined && hovered !== undefined && (
        <div
          role="tooltip"
          data-slot="tooltip-content"
          className="pointer-events-none absolute z-10 -mt-1 w-72 -translate-x-1/2 -translate-y-full rounded-(--radius-overlay) border-(--border-width-hairline) border-border-2 bg-popover px-2.5 py-2 text-xs font-medium text-foreground shadow-overlay"
          style={{
            left:
              hover.cell.getBoundingClientRect().left -
              (hover.cell.closest("[data-slot=card]")?.getBoundingClientRect()
                .left ?? 0) +
              hover.cell.offsetWidth / 2,
            top:
              hover.cell.getBoundingClientRect().top -
              (hover.cell.closest("[data-slot=card]")?.getBoundingClientRect()
                .top ?? 0),
          }}
        >
          <div className="flex items-baseline justify-between gap-3">
            <span>
              {new Date(hovered.day).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
                timeZone,
              })}
            </span>
            <span className="shrink-0 font-normal text-muted-foreground-2 tabular-nums">
              {touchesLabel(hovered.total)}
            </span>
          </div>
          {touch !== undefined && <TouchRepos touch={touch} />}
        </div>
      )}
    </div>
  );
}
