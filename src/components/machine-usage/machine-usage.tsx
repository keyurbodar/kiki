import {
  formatMachine,
  formatWhole,
  type MachineSize,
  machineHourRates,
  machineSizes,
} from "@/components/plan-picker/plan-catalog";
import { Button } from "@/primitives/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/primitives/popover";

/** The org's machine-hour allowance and what this cycle has spent of it. */
export type MachineHourMeter = {
  readonly allowance: number;
  readonly consumed: number;
};

/** A size's rate in machine minutes a minute, the unit Capy prints; null while no size is known. */
export const machineMinuteRate = (size: MachineSize | null) =>
  size === null ? null : machineHourRates[size];

export const machineHoursLeft = (meter: MachineHourMeter) =>
  Math.max(0, meter.allowance - meter.consumed);

const minuteUnit = (rate: number) =>
  rate === 1 ? "machine minute" : "machine minutes";

/** Capy's line: `Uses 4 machine minutes a minute, about 125 h of the 30,000 left`. */
export const machineUsageLine = (
  meter: MachineHourMeter,
  minuteRate: number | null,
) => {
  const left = `${formatWhole(machineHoursLeft(meter))} h of the ${formatWhole(meter.allowance)} left`;
  return minuteRate === null
    ? `About ${left}`
    : `Uses ${formatWhole(minuteRate)} ${minuteUnit(minuteRate)} a minute, about ${left}`;
};

/** Capy's panel behind `How usage counts`: one row per size, then the fallthrough note. */
export function MachineUsagePanel({
  meter,
  defaultSize,
}: {
  meter: MachineHourMeter;
  /** The plan's default size, which the panel marks; unknown leaves every row unmarked. */
  defaultSize?: MachineSize | null;
}) {
  const left = machineHoursLeft(meter);
  return (
    <div className="flex flex-col gap-4 px-2 pt-1 pb-2">
      <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-baseline gap-x-6 gap-y-1.5 text-sm font-normal text-foreground tabular-nums">
        <span className="text-sm font-medium text-foreground">
          Machine hours
        </span>
        <span className="text-right text-xs font-normal text-muted-foreground-2">
          Per hour
        </span>
        <span className="text-right text-xs font-normal text-muted-foreground-2">
          Hours left
        </span>
        {machineSizes.flatMap((size) => {
          const rate = machineHourRates[size];
          return [
            <span
              key={`${size}:shape`}
              className="flex min-w-0 items-baseline gap-1.5 text-muted-foreground-1"
            >
              <span className="truncate">{formatMachine(size)}</span>
              {size === defaultSize ? (
                <span className="shrink-0 text-xs text-muted-foreground-2">
                  Default
                </span>
              ) : null}
            </span>,
            <span key={`${size}:weight`} className="text-right">
              {rate}
            </span>,
            <span
              key={`${size}:hours`}
              className="text-right text-muted-foreground-2"
            >
              {`${formatWhole(left / rate)} h`}
            </span>,
          ];
        })}
      </div>
      <div className="flex flex-col gap-2">
        <div className="-mx-1 my-1 h-px bg-border-1" />
        <span className="text-xs font-normal text-muted-foreground-2">
          Past the included amount, work is paid from your usage balance
        </span>
      </div>
    </div>
  );
}

/** The usage line under the machine-size row, with its `How usage counts` popover. */
export function MachineUsageNote({
  meter,
  size,
}: {
  meter: MachineHourMeter;
  size: MachineSize | null;
}) {
  return (
    <span className="flex flex-wrap items-center gap-x-2">
      {machineUsageLine(meter, machineMinuteRate(size))}
      <Popover>
        <PopoverTrigger
          render={
            <Button
              variant="bare"
              size="auto-xs"
              aria-label="How usage counts"
            />
          }
        >
          How usage counts
        </PopoverTrigger>
        <PopoverContent
          side="bottom"
          align="end"
          className="w-96 max-w-(--available-width) p-2"
        >
          <MachineUsagePanel meter={meter} />
        </PopoverContent>
      </Popover>
    </span>
  );
}
