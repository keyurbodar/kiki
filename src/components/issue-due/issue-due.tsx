import { cx } from "class-variance-authority";
import { type ReactElement, type ReactNode, useState } from "react";
import {
  CalendarGlyph,
  ChevronLeftSmallGlyph,
  ChevronRightSmallGlyph,
  CrossMediumGlyph,
  issuePickerGlyphClass,
  issuePickerTrailingClass,
} from "@/components/issue-pickers";
import { Button } from "@/primitives/button";
import { menuRowVariants } from "@/primitives/menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/primitives/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import {
  addMonths,
  dueFormats,
  duePresets,
  formatDay,
  type IssueDay,
  isOverdue,
  isValidDay,
  monthGrid,
  orderRange,
  relativeDueLabel,
} from "./due-date";

const weekdays = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

const rowClass = menuRowVariants({ interaction: "button" });

const separator = <div className="-mx-1 my-1 h-px bg-border-1" />;

export type IssueDueChipProps = {
  due: IssueDay;
  today: IssueDay;
  closed: boolean;
};

/** A list row's due date; red once an open issue is past it. */
export function IssueDueChip({ due, today, closed }: IssueDueChipProps) {
  const overdue = isOverdue(due, today, closed);
  const full = formatDay(due, dueFormats.long);
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            className={cx(
              "flex shrink-0 items-center gap-1 text-xs font-normal whitespace-nowrap tabular-nums",
              overdue ? "text-destructive" : "text-muted-foreground-2",
            )}
          >
            <CalendarGlyph className="size-(--icon-xs)" />
            {relativeDueLabel(due, today)}
          </span>
        }
      />
      <TooltipContent side="bottom">
        {overdue ? `Overdue, due ${full}` : `Due ${full}`}
      </TooltipContent>
    </Tooltip>
  );
}

export type DueCalendarProps = {
  /** The month shown, as `YYYY-MM`. */
  month: string;
  today: IssueDay;
  onMonth: (month: string) => void;
  selected: (day: IssueDay) => boolean;
  within: (day: IssueDay) => boolean;
  onPick: (day: IssueDay) => void;
};

/** A Monday-first month grid with previous and next month buttons. */
export function DueCalendar({
  month,
  today,
  onMonth,
  selected,
  within,
  onPick,
}: DueCalendarProps) {
  return (
    <div className="flex flex-col gap-1 px-1 pb-1">
      <div className="flex h-7 items-center gap-1">
        <span className="min-w-0 flex-1 pl-1 text-xs font-medium text-foreground">
          {formatDay(`${month}-01`, dueFormats.month)}
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="Previous month"
          disabled={month <= "1000-01"}
          onClick={() => onMonth(addMonths(month, -1))}
        >
          <ChevronLeftSmallGlyph />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="Next month"
          disabled={month >= "9999-12"}
          onClick={() => onMonth(addMonths(month, 1))}
        >
          <ChevronRightSmallGlyph />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {weekdays.map((weekday) => (
          <span
            key={weekday}
            className="flex h-6 items-center justify-center text-xs text-muted-foreground-2"
          >
            {weekday}
          </span>
        ))}
        {monthGrid(month).map((day) =>
          isValidDay(day) ? (
            <button
              key={day}
              type="button"
              aria-label={formatDay(day, dueFormats.cell)}
              aria-pressed={selected(day)}
              className={cx(
                "flex h-7 cursor-pointer items-center justify-center rounded text-xs tabular-nums outline-none transition-colors duration-100 focus-visible:outline-ring-inset",
                selected(day)
                  ? "bg-primary font-medium text-primary-foreground"
                  : cx(
                      "hover:bg-popover-hover",
                      within(day)
                        ? "bg-primary-20"
                        : day === today && "bg-secondary font-medium",
                      day.slice(0, 7) === month
                        ? "text-foreground"
                        : "text-muted-foreground-3",
                    ),
              )}
              onClick={() => onPick(day)}
            >
              {Number(day.slice(8))}
            </button>
          ) : (
            <span key={day} />
          ),
        )}
      </div>
    </div>
  );
}

export type DueDatePickerProps = {
  value: IssueDay | undefined;
  today: IssueDay;
  onChange: (due: IssueDay | null) => void;
  trigger: ReactElement;
  children?: ReactNode;
};

/** Quick presets, a month calendar and, once a date is set, Remove due date. */
export function DueDatePicker({
  value,
  today,
  onChange,
  trigger,
  children,
}: DueDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState((value ?? today).slice(0, 7));
  const pick = (due: IssueDay | null) => {
    setOpen(false);
    if (due !== (value ?? null)) onChange(due);
  };
  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) setMonth((value ?? today).slice(0, 7));
        setOpen(next);
      }}
    >
      <PopoverTrigger render={trigger}>{children}</PopoverTrigger>
      <PopoverContent className="w-60 p-1">
        {duePresets(today).map((preset) => (
          <button
            key={preset.label}
            type="button"
            className={rowClass}
            onClick={() => pick(preset.date)}
          >
            <span className={issuePickerGlyphClass}>
              <CalendarGlyph />
            </span>
            {preset.label}
            <span className={issuePickerTrailingClass}>
              {formatDay(preset.date, dueFormats.preset)}
            </span>
          </button>
        ))}
        {separator}
        <DueCalendar
          month={month}
          today={today}
          onMonth={setMonth}
          selected={(day) => day === value}
          within={() => false}
          onPick={pick}
        />
        {value !== undefined && (
          <>
            {separator}
            <button
              type="button"
              className={rowClass}
              onClick={() => pick(null)}
            >
              <span className={issuePickerGlyphClass}>
                <CrossMediumGlyph />
              </span>
              Remove due date
            </button>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

export type DueRangeCalendarProps = {
  from: IssueDay | null;
  to: IssueDay | null;
  today: IssueDay;
  onChange: (from: IssueDay | null, to: IssueDay | null) => void;
};

/**
 * Picks a range in two clicks: the first sets both ends to that day, the
 * second closes the range in whichever order the days were picked.
 */
export function DueRangeCalendar({
  from,
  to,
  today,
  onChange,
}: DueRangeCalendarProps) {
  const [month, setMonth] = useState((from ?? to ?? today).slice(0, 7));
  const [anchor, setAnchor] = useState<IssueDay | null>(null);
  return (
    <div className="flex flex-col">
      <div className="flex h-7 items-center px-2 pt-1 text-xs font-normal text-muted-foreground-2">
        {anchor === null ? "Pick the first day" : "Pick the last day"}
      </div>
      <DueCalendar
        month={month}
        today={today}
        onMonth={setMonth}
        selected={(day) => day === from || day === to}
        within={(day) => from !== null && to !== null && day > from && day < to}
        onPick={(day) => {
          if (anchor === null) {
            setAnchor(day);
            onChange(day, day);
            return;
          }
          setAnchor(null);
          onChange(...orderRange(anchor, day));
        }}
      />
      {(from !== null || to !== null) && (
        <>
          {separator}
          <button
            type="button"
            className={rowClass}
            onClick={() => {
              setAnchor(null);
              onChange(null, null);
            }}
          >
            <span className={issuePickerGlyphClass}>
              <CrossMediumGlyph />
            </span>
            Clear range
          </button>
        </>
      )}
    </div>
  );
}
