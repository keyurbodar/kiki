import { useState } from "react";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { Input } from "@/primitives/input";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/primitives/menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/primitives/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import { eventOptions } from "../events";
import { WebhookCoalescing } from "../webhook-coalescing";
import { CalendarClock, CrossMedium, PlusMedium } from "./icons";
import {
  type EventTrigger,
  type EventTriggerType,
  isEventTrigger,
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
            className="w-fit!"
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
          className="w-32!"
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

const conditionEntries = (conditions: EventTrigger["conditions"]) =>
  Object.entries(conditions).flatMap(([field, values]) =>
    values.map((value) => ({ field, value })),
  );

const withoutCondition = (
  conditions: EventTrigger["conditions"],
  field: string,
  value: string,
): EventTrigger["conditions"] => {
  const kept = (conditions[field] ?? []).filter((entry) => entry !== value);
  if (kept.length > 0) return { ...conditions, [field]: kept };
  const { [field]: _dropped, ...rest } = conditions;
  return rest;
};

const withCondition = (
  conditions: EventTrigger["conditions"],
  field: string,
  value: string,
): EventTrigger["conditions"] => ({
  ...conditions,
  [field]: [
    ...(conditions[field] ?? []).filter((entry) => entry !== value),
    value,
  ],
});

/** The field/value pairs an event trigger is narrowed by. */
function ConditionsEditor({
  trigger,
  onChange,
}: {
  trigger: EventTrigger;
  onChange: (trigger: EventTrigger) => void;
}) {
  const [open, setOpen] = useState(false);
  const [field, setField] = useState("");
  const [value, setValue] = useState("");
  const entries = conditionEntries(trigger.conditions);
  const addable = field.trim() !== "" && value.trim() !== "";
  const add = () => {
    if (!addable) return;
    onChange({
      ...trigger,
      conditions: withCondition(trigger.conditions, field.trim(), value.trim()),
    });
    setField("");
    setValue("");
    setOpen(false);
  };
  return (
    <div className="kiki-chip-row">
      {entries.map((entry) => (
        <span
          key={`${entry.field}:${entry.value}`}
          data-slot="trigger-condition"
          data-size="xs"
          className="kiki-badge text-xs text-muted-foreground-1"
        >
          <span className="text-muted-foreground-2">{entry.field}</span>
          <span className="font-normal text-muted-foreground-2">is</span>
          <span className="truncate font-medium text-foreground">
            {entry.value}
          </span>
          <button
            type="button"
            aria-label={`Remove condition ${entry.field} is ${entry.value}`}
            className="kiki-icon text-icon-muted hover:text-foreground"
            data-size="xs"
            onClick={() =>
              onChange({
                ...trigger,
                conditions: withoutCondition(
                  trigger.conditions,
                  entry.field,
                  entry.value,
                ),
              })
            }
          >
            <CrossMedium />
          </button>
        </span>
      ))}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button variant="ghost" size="xs" aria-label="Add condition" />
          }
        >
          <PlusMedium />
          Add condition
        </PopoverTrigger>
        <PopoverContent align="start" sideOffset={6} className="kiki-menu">
          <div className="kiki-list">
            <Input
              size="xs"
              aria-label="Condition field"
              placeholder="Field, e.g. repository"
              value={field}
              onChange={(event) => setField(event.target.value)}
            />
            <Input
              size="xs"
              aria-label="Condition value"
              placeholder="Value, e.g. acme/web"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  add();
                }
              }}
            />
            <Button
              size="sm"
              aria-label="Add the condition"
              disabled={!addable}
              onClick={add}
            >
              Add
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

/** The event a trigger fires on, out of the type's own vocabulary. */
function EventField({
  trigger,
  onChange,
}: {
  trigger: EventTrigger;
  onChange: (trigger: EventTrigger) => void;
}) {
  const options = eventOptions(trigger.type);
  if (options.length === 0) return null;
  const current = trigger.event ?? options[0]?.value ?? "";
  return (
    <OptionChip
      ariaLabel="Event"
      current={current}
      options={options}
      onPick={(event) => onChange({ ...trigger, event })}
      searchPlaceholder="Search events"
    />
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
  const event = isEventTrigger(trigger) ? trigger : null;
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
        {event === null ? null : (
          <EventField trigger={event} onChange={(next) => onChange(next)} />
        )}
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
      {event === null ? null : (
        <ConditionsEditor trigger={event} onChange={(next) => onChange(next)} />
      )}
      {event?.type === "incoming_webhook" ? (
        <WebhookCoalescing
          value={event.coalescing}
          onChange={(coalescing) => onChange({ ...event, coalescing })}
        />
      ) : null}
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
