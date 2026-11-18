import {
  formatMachine,
  formatWhole,
  type MachineSize,
  machineHourRates,
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

function MachineUsageExplainer({
  meter,
  size,
}: {
  meter: MachineHourMeter;
  size: MachineSize | null;
}) {
  const sizeRate = machineMinuteRate(size);
  return (
    <div className="flex flex-col gap-2 text-sm font-normal text-muted-foreground-2">
      <p>
        {size === null || sizeRate === null
          ? "Each run bills its machine time to the org's allowance in machine hours."
          : `Machine time counts at the size a run boots: a minute on ${formatMachine(size)} uses ${formatWhole(sizeRate)} ${minuteUnit(sizeRate)}.`}
      </p>
      <p>
        {`This cycle ${formatWhole(meter.consumed)} of ${formatWhole(meter.allowance)} machine hours are spent, leaving ${formatWhole(machineHoursLeft(meter))} h.`}
      </p>
      <p>Past the allowance, machine time is paid from your credits.</p>
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
          align="start"
          className="w-80 max-w-(--available-width) p-3"
        >
          <MachineUsageExplainer meter={meter} size={size} />
        </PopoverContent>
      </Popover>
    </span>
  );
}
