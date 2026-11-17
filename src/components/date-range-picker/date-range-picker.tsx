import { useState } from "react";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";

export type DateRangePickerProps = {
  from: string | null;
  to: string | null;
  now?: Date | number;
  onApply: (from: string, to: string) => void;
};

const iso = (date: Date) => date.toISOString().slice(0, 10);
const monthLabel = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});
const dayLabel = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

const shiftMonth = (year: number, month: number, delta: number) => {
  const date = new Date(year, month + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() };
};

const daysInMonth = (year: number, month: number) => {
  const first = new Date(year, month, 1).getDay();
  const count = new Date(year, month + 1, 0).getDate();
  return { first, count };
};

export function DateRangePicker({
  from,
  to,
  now = Date.now(),
  onApply,
}: DateRangePickerProps) {
  const today = iso(new Date(now));
  const fromDate = from === null ? undefined : new Date(`${from}T00:00:00`);
  const start =
    fromDate === undefined || Number.isNaN(fromDate.getTime())
      ? new Date(now)
      : fromDate;
  const [view, setView] = useState({
    year: start.getFullYear(),
    month: start.getMonth(),
  });
  const [draftFrom, setDraftFrom] = useState(from ?? "");
  const [draftTo, setDraftTo] = useState(to ?? "");
  const [hovered, setHovered] = useState<string | null>(null);

  const startIso = draftFrom === "" ? null : draftFrom;
  const endIso =
    draftTo === "" ? (startIso === null ? null : hovered) : draftTo;
  const min = startIso;
  const max =
    min === null || endIso === null
      ? null
      : ([min, endIso].sort().at(-1) ?? min);
  const { first } = daysInMonth(view.year, view.month);
  const cells: Array<{ iso: string; day: number; inMonth: boolean }> = [];
  for (let index = 0; index < 42; index += 1) {
    const date = new Date(view.year, view.month, index - first + 1);
    cells.push({
      iso: iso(date),
      day: date.getDate(),
      inMonth: date.getMonth() === view.month,
    });
  }

  const select = (value: string) => {
    if (startIso === null || draftTo !== "") {
      setDraftFrom(value);
      setDraftTo("");
    } else if (value < startIso) {
      setDraftFrom(value);
      setDraftTo(startIso);
    } else {
      setDraftTo(value);
    }
    setHovered(null);
  };

  const rangeLabel = (value: string | null) =>
    value === null ? null : dayLabel.format(new Date(`${value}T00:00:00`));

  return (
    <div className="flex flex-col">
      <div className="flex h-(--h-menu-row) items-center gap-1 px-1">
        <Button
          data-track-owner="shared/date-range-picker.tsx#DateRangePicker:Button[Previous month]"
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="Previous month"
          className="shrink-0"
          onClick={() =>
            setView((current) => shiftMonth(current.year, current.month, -1))
          }
        >
          <Icon name="arrow-left" />
        </Button>
        <span className="min-w-0 flex-1 text-center text-sm font-medium text-foreground">
          {monthLabel.format(new Date(view.year, view.month, 1))}
        </span>
        <Button
          data-track-owner="shared/date-range-picker.tsx#DateRangePicker:Button[Next month]"
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="Next month"
          className="shrink-0"
          onClick={() =>
            setView((current) => shiftMonth(current.year, current.month, 1))
          }
        >
          <Icon name="arrow-right" />
        </Button>
      </div>
      <div className="grid w-full grid-cols-7 px-1">
        {WEEKDAYS.map((day, index) => (
          <span
            key={`${day}-${String(index)}`}
            className="flex aspect-square items-center justify-center text-2xs text-muted-foreground-3"
          >
            {day}
          </span>
        ))}
      </div>
      <fieldset
        aria-label="Dates in this month"
        className="grid w-full grid-cols-7 px-1"
        onMouseLeave={() => setHovered(null)}
      >
        {cells.map((cell, index) => {
          const inRange =
            min !== null && max !== null && cell.iso >= min && cell.iso <= max;
          const selected = cell.iso === startIso || cell.iso === draftTo;
          return (
            <div
              key={cell.iso}
              className="relative flex aspect-square items-center justify-center"
            >
              {inRange && (
                <span
                  aria-hidden
                  className={`absolute inset-y-[11%] bg-muted ${
                    cell.iso === min
                      ? index % 7 === 0
                        ? "left-[11%] rounded-l"
                        : "left-0"
                      : "left-0"
                  } ${cell.iso === max ? (index % 7 === 6 ? "right-[11%] rounded-r" : "right-0") : "right-0"}`}
                />
              )}
              <button
                data-track-owner="shared/date-range-picker.tsx#DateRangePicker:button.1"
                type="button"
                aria-label={rangeLabel(cell.iso) ?? cell.iso}
                aria-pressed={selected}
                aria-current={cell.iso === today ? "date" : undefined}
                onMouseEnter={() => setHovered(cell.iso)}
                onFocus={() => setHovered(cell.iso)}
                onClick={() => select(cell.iso)}
                className={`relative flex size-[78%] cursor-pointer items-center justify-center rounded text-sm tabular-nums select-none outline-none focus-visible:outline-ring-inset ${
                  cell.inMonth ? "text-foreground" : "text-muted-foreground-3"
                } ${selected ? "bg-foreground text-background" : ""} ${!selected && !inRange ? "hover:bg-secondary" : ""} ${cell.iso === today && !selected ? "border-hairline border-border-3 font-medium" : ""}`}
              >
                {cell.day}
              </button>
            </div>
          );
        })}
      </fieldset>
      <div className="flex items-center justify-between gap-2 border-t-hairline border-border-1 px-2 py-2 text-xs">
        <span className="text-muted-foreground-1">From</span>
        <span className="text-foreground">{rangeLabel(startIso) ?? "—"}</span>
      </div>
      <div className="flex items-center justify-between gap-2 px-2 pb-2 text-xs">
        <span className="text-muted-foreground-1">To</span>
        <span className="text-foreground">{rangeLabel(draftTo) ?? "—"}</span>
      </div>
      <Button
        data-track-owner="shared/date-range-picker.tsx#DateRangePicker:ResponsiveMenuItem[Apply]"
        size="sm"
        intent="accent"
        disabled={min === null || max === null}
        onClick={() => {
          if (min !== null && max !== null) onApply(min, max);
        }}
      >
        Apply
      </Button>
    </div>
  );
}
