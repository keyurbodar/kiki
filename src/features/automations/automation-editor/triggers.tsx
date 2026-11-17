import { useState } from "react";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { Input } from "@/primitives/input";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/primitives/menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import { CalendarClock, CrossMedium, PlusMedium } from "./icons";
import {
  type EventTriggerType,
  type ScheduleTrigger,
  type Trigger,
  type TriggerType,
  triggerLabels,
} from "./model";
import { menuIconClass, OptionChip } from "./parts";
import {
  buildCron,
  hourIntervals,
  minuteIntervals,
  parseCron,
  presetLabels,
  type SchedulePreset,
  timezones,
  weekdays,
} from "./schedule";

const triggerIconClass = "size-(--icon-sm) shrink-0";

export function TriggerIcon({ type }: { type: TriggerType }) {
  switch (type) {
    case "schedule":
      return <CalendarClock className={triggerIconClass} />;
    case "github":
      return <Icon name="github" className={triggerIconClass} />;
    case "incoming_webhook":
      return <Icon name="webhooks" className={triggerIconClass} />;
    case "on_demand":
      return <Icon name="play-outline" className={triggerIconClass} />;
    default:
      return <Icon name="plugin-1" className={triggerIconClass} />;
  }
}

const humanize = (value: string) => value.replaceAll("_", " ");

export const triggerTitle = (trigger: Trigger) => {
  if (trigger.type === "schedule") return "On a schedule";
  if (trigger.type === "on_demand") return "Manual run";
  if (trigger.type === "incoming_webhook") return "Webhook request";
  return trigger.event === undefined
    ? triggerLabels[trigger.type]
    : `${triggerLabels[trigger.type]} ${humanize(trigger.event)}`;
};

const presetOptions = [
  ...(Object.keys(presetLabels) as Array<keyof typeof presetLabels>).map(
    (preset) => ({ value: preset, label: presetLabels[preset] }),
  ),
  { value: "custom", label: "Custom" },
];

const timezoneOptions = timezones().map((zone) => ({
  value: zone,
  label: zone,
}));

export type ScheduleFieldsProps = {
  trigger: ScheduleTrigger;
  onChange: (trigger: ScheduleTrigger) => void;
};

export function ScheduleFields({ trigger, onChange }: ScheduleFieldsProps) {
  const [customOpen, setCustomOpen] = useState(false);
  const spec = parseCron(trigger.cron);
  const preset: SchedulePreset = customOpen ? "custom" : spec.preset;
  const apply = (next: typeof spec) => {
    const cron = buildCron(next);
    if (cron !== null) onChange({ ...trigger, cron });
  };
  return (
    <>
      <OptionChip
        ariaLabel="Frequency"
        current={preset}
        options={presetOptions}
        onPick={(value) => {
          if (value === "custom") {
            setCustomOpen(true);
            return;
          }
          setCustomOpen(false);
          const nextPreset = value as SchedulePreset;
          apply({
            ...spec,
            preset: nextPreset,
            interval:
              nextPreset === "minutes"
                ? "15"
                : nextPreset === "hourly"
                  ? "6"
                  : spec.interval,
          });
        }}
      />
      {preset === "weekly" ? (
        <OptionChip
          ariaLabel="Day"
          prefix="on"
          current={spec.day}
          options={weekdays}
          onPick={(day) => apply({ ...spec, day })}
        />
      ) : null}
      {preset === "daily" || preset === "weekly" || preset === "weekdays" ? (
        <>
          <span className="text-xs font-normal text-muted-foreground-2">
            at
          </span>
          <Input
            type="time"
            size="xs"
            aria-label="Time"
            className="w-fit"
            value={spec.time}
            onChange={(event) => apply({ ...spec, time: event.target.value })}
          />
        </>
      ) : null}
      {preset === "hourly" || preset === "minutes" ? (
        <OptionChip
          ariaLabel="Interval"
          prefix="every"
          current={
            preset === "hourly" ? spec.interval || "6" : spec.interval || "15"
          }
          options={
            preset === "hourly"
              ? hourIntervals.map((value) => ({
                  value,
                  label: value === "1" ? "hour" : `${value} hours`,
                }))
              : minuteIntervals.map((value) => ({
                  value,
                  label: `${value} minutes`,
                }))
          }
          onPick={(interval) => apply({ ...spec, interval })}
        />
      ) : null}
      {preset === "custom" ? (
        <Input
          size="xs"
          aria-label="Cron expression"
          placeholder="0 9 * * 1-5"
          className="w-32"
          value={trigger.cron}
          onChange={(event) =>
            onChange({ ...trigger, cron: event.target.value })
          }
        />
      ) : null}
      <OptionChip
        ariaLabel="Timezone"
        prefix="in"
        current={trigger.timezone}
        options={timezoneOptions}
        onPick={(timezone) => onChange({ ...trigger, timezone })}
        searchPlaceholder="Search timezones"
      />
    </>
  );
}

export type TriggerRowProps = {
  trigger: Trigger;
  onChange: (trigger: Trigger) => void;
  onAddTime?: () => void;
  onRemove: () => void;
};

export function TriggerRow({
  trigger,
  onChange,
  onAddTime,
  onRemove,
}: TriggerRowProps) {
  return (
    <div className="flex flex-col gap-2 px-4 py-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <TriggerIcon type={trigger.type} />
        <span className="text-sm font-medium text-foreground">
          {triggerTitle(trigger)}
        </span>
        {trigger.type === "schedule" ? (
          <ScheduleFields trigger={trigger} onChange={onChange} />
        ) : null}
        <span className="ml-auto flex items-center gap-0.5">
          {onAddTime === undefined ? null : (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Add time"
                    onClick={onAddTime}
                  />
                }
              >
                <PlusMedium />
              </TooltipTrigger>
              <TooltipContent side="top">Add time</TooltipContent>
            </Tooltip>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Remove trigger"
            onClick={onRemove}
          >
            <CrossMedium />
          </Button>
        </span>
      </div>
    </div>
  );
}

const integrationTriggers: ReadonlyArray<EventTriggerType> = [
  "github",
  "slack",
  "sentry",
  "linear",
];

export type AddTriggerMenuProps = {
  onAdd: (type: TriggerType) => void;
};

export function AddTriggerMenu({ onAdd }: AddTriggerMenuProps) {
  return (
    <Menu>
      <MenuTrigger render={<Button variant="ghost" size="sm" />}>
        <PlusMedium />
        Add trigger
      </MenuTrigger>
      <MenuContent align="end" className="w-64">
        <MenuItem onClick={() => onAdd("schedule")}>
          <span className={menuIconClass}>
            <CalendarClock />
          </span>
          On a schedule
        </MenuItem>
        {integrationTriggers.map((type) => (
          <MenuItem key={type} onClick={() => onAdd(type)}>
            <span className={menuIconClass}>
              <TriggerIcon type={type} />
            </span>
            {triggerLabels[type]}
          </MenuItem>
        ))}
        <MenuItem onClick={() => onAdd("incoming_webhook")}>
          <span className={menuIconClass}>
            <TriggerIcon type="incoming_webhook" />
          </span>
          Webhook request
        </MenuItem>
        <MenuItem onClick={() => onAdd("on_demand")}>
          <span className={menuIconClass}>
            <Icon name="play-outline" />
          </span>
          Manual run
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}
