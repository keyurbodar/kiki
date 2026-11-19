import { useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import { useState } from "react";
import { EmojiPickerPopover } from "@/components/emoji-picker";
import { membersAtom } from "@/data/atoms/members";
import { Badge } from "@/primitives/badge";
import { Button } from "@/primitives/button";
import { ChipMenu, ChipMenuTrigger } from "@/primitives/chip-menu";
import { Icon } from "@/primitives/icon";
import { Input } from "@/primitives/input";
import {
  Menu,
  MenuContent,
  MenuGroup,
  MenuItem,
  MenuLabel,
  MenuSearchRow,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  MenuTrigger,
} from "@/primitives/menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/primitives/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import {
  type ConditionField,
  type ConditionOption,
  conditionFields,
  conditionSearchLabel,
  conditionSummary,
  memberLogins,
  patternSubject,
  primaryFields,
} from "../conditions";
import { eventGroups, eventOptions, eventStatus } from "../events";
import { WebhookCoalescing } from "../webhook-coalescing";
import { CalendarClock, Checkmark, CrossMedium, PlusMedium } from "./icons";
import {
  type EventTrigger,
  type EventTriggerType,
  isEventTrigger,
  type ScheduleTrigger,
  type Trigger,
  type TriggerType,
  triggerLabels,
} from "./model";
import {
  cx,
  menuCheckClass,
  menuEmptyClass,
  menuIconClass,
  menuLabelClass,
  menuSearchInputClass,
  menuTrailingClass,
  OptionChip,
  stopMenuKeys,
} from "./parts";
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
import { useOrgId } from "./use-org";

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

export const triggerTitle = (trigger: Trigger) => {
  if (trigger.type === "schedule") return "On a schedule";
  if (trigger.type === "on_demand") return "Manual run";
  if (trigger.type === "incoming_webhook") return "Webhook request";
  return triggerLabels[trigger.type];
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

const withValues = (
  trigger: EventTrigger,
  onChange: (trigger: EventTrigger) => void,
  key: string,
  values: ReadonlyArray<string>,
) => {
  const conditions = { ...trigger.conditions };
  if (values.length === 0) delete conditions[key];
  else conditions[key] = values;
  onChange({ ...trigger, conditions });
};

const toggleValue = (
  values: ReadonlyArray<string>,
  value: string,
): ReadonlyArray<string> =>
  values.includes(value)
    ? values.filter((entry) => entry !== value)
    : [...values, value];

/** The org's members by GitHub login, for the authors filter's suggestions. */
function useMemberLogins(): ReadonlyArray<ConditionOption> {
  const orgId = useOrgId();
  const result = useAtomValue(membersAtom(orgId ?? ""));
  return AsyncResult.isSuccess(result) ? memberLogins(result.value) : [];
}

type ConditionChipProps = {
  field: ConditionField;
  values: ReadonlyArray<string>;
  suggestions?: ReadonlyArray<ConditionOption>;
  onChange: (values: ReadonlyArray<string>) => void;
};

/** One filter on a trigger: a chip reading "in any repository", "by 2 PR authors". */
function ConditionChip({
  field,
  values,
  suggestions,
  onChange,
}: ConditionChipProps) {
  const [query, setQuery] = useState("");
  const labelOf = (value: string) =>
    suggestions?.find((entry) => entry.value === value)?.label ?? value;
  const needle = query.trim().toLowerCase();
  const matches = (suggestions ?? [])
    .filter((entry) => !values.includes(entry.value))
    .filter(
      (entry) =>
        needle === "" ||
        entry.value.toLowerCase().includes(needle) ||
        entry.label.toLowerCase().includes(needle),
    )
    .slice(0, 20);
  const add = (value: string) => {
    const trimmed = value.trim();
    if (trimmed === "" || values.includes(trimmed)) return;
    onChange([...values, trimmed]);
    setQuery("");
  };
  return (
    <ChipMenu onOpenChange={(open) => (open ? undefined : setQuery(""))}>
      <ChipMenuTrigger
        render={
          <Button
            variant="soft"
            size="xs"
            aria-label={`${field.label} filter`}
            className="kiki-filter-chip"
          />
        }
      >
        <span className="shrink-0 font-normal text-muted-foreground-2">
          {field.prefix}
        </span>
        <span className="kiki-filter-chip-value">
          {conditionSummary(field, values, labelOf)}
        </span>
      </ChipMenuTrigger>
      <MenuContent align="start" className="kiki-menu">
        {suggestions === undefined ? (
          <MenuSearchRow>
            <input
              className={menuSearchInputClass}
              aria-label={conditionSearchLabel(field)}
              placeholder={conditionSearchLabel(field)}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  add(query);
                  return;
                }
                stopMenuKeys(event);
              }}
            />
          </MenuSearchRow>
        ) : (
          <MenuSearchRow>
            <input
              className={menuSearchInputClass}
              aria-label={conditionSearchLabel(field)}
              placeholder={conditionSearchLabel(field)}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  const typed = query.trim().replace(/^@/, "");
                  const needle = typed.toLowerCase();
                  const match =
                    matches.find(
                      (entry) => entry.value.toLowerCase() === needle,
                    ) ??
                    matches.find((entry) =>
                      entry.label.toLowerCase().startsWith(needle),
                    ) ??
                    matches[0];
                  add(match === undefined ? typed : match.value);
                  return;
                }
                stopMenuKeys(event);
              }}
            />
          </MenuSearchRow>
        )}
        {values.map((value) => (
          <MenuItem
            key={value}
            onClick={() => onChange(values.filter((entry) => entry !== value))}
          >
            <span className={menuLabelClass}>{labelOf(value)}</span>
            <Checkmark className={cx("ml-auto", menuCheckClass)} />
          </MenuItem>
        ))}
        {suggestions === undefined ? (
          values.length === 0 ? (
            <div className={menuEmptyClass}>Press Enter to add</div>
          ) : null
        ) : matches.length === 0 ? (
          <div className={menuEmptyClass}>Type to search PR authors</div>
        ) : (
          matches.map((entry) => (
            <MenuItem
              key={entry.value}
              onClick={() => onChange(toggleValue(values, entry.value))}
            >
              <span className={menuLabelClass}>{entry.label}</span>
              <span className={menuTrailingClass}>{entry.value}</span>
            </MenuItem>
          ))
        )}
      </MenuContent>
    </ChipMenu>
  );
}

/** The reactions filter, an emoji picker that `No reaction` clears. */
function ReactionChip({ field, values, onChange }: ConditionChipProps) {
  return (
    <EmojiPickerPopover
      {...(values.length === 0
        ? {}
        : { clear: { label: "No reaction", onClear: () => onChange([]) } })}
      onPick={(emoji) => onChange([...values, emoji])}
      include={(emoji) => !values.includes(emoji)}
    >
      <Button
        variant="soft"
        size="xs"
        aria-label="reaction filter"
        className="kiki-filter-chip"
      >
        <span className="shrink-0 font-normal text-muted-foreground-2">
          {field.prefix}
        </span>
        <span className="kiki-filter-chip-value">
          {values.length === 0
            ? "any reaction"
            : values.length <= 3
              ? values.join(" ")
              : `${values.length} reactions`}
        </span>
      </Button>
    </EmojiPickerPopover>
  );
}

const chipFor = (
  field: ConditionField,
  values: ReadonlyArray<string>,
  suggestions: ReadonlyArray<ConditionOption> | undefined,
  onChange: (values: ReadonlyArray<string>) => void,
) =>
  field.picker === "emoji" ? (
    <ReactionChip
      key={field.key}
      field={field}
      values={values}
      onChange={onChange}
    />
  ) : (
    <ConditionChip
      key={field.key}
      field={field}
      values={values}
      suggestions={field.picker === "members" ? suggestions : undefined}
      onChange={onChange}
    />
  );

/** The filters a row always shows, empty or not. */
function PrimaryFilters({
  trigger,
  onChange,
}: {
  trigger: EventTrigger;
  onChange: (trigger: EventTrigger) => void;
}) {
  const members = useMemberLogins();
  return (
    <>
      {primaryFields(trigger.type, trigger.event).map((field) =>
        chipFor(field, trigger.conditions[field.key] ?? [], members, (values) =>
          withValues(trigger, onChange, field.key, values),
        ),
      )}
    </>
  );
}

/** A filter added from the menu, and the pattern, on their own `and` rows. */
function ExtraFilters({
  trigger,
  onChange,
}: {
  trigger: EventTrigger;
  onChange: (trigger: EventTrigger) => void;
}) {
  const members = useMemberLogins();
  const primary = primaryFields(trigger.type, trigger.event).map(
    (field) => field.key,
  );
  const extra = conditionFields(trigger.type, trigger.event).filter(
    (field) =>
      !primary.includes(field.key) &&
      (trigger.conditions[field.key] ?? []).length > 0,
  );
  return (
    <>
      {extra.map((field) => (
        <div
          key={field.key}
          data-slot="trigger-filter-row"
          data-filter={field.key}
          className="kiki-chip-row"
        >
          <span className="text-sm font-normal text-muted-foreground-2">
            and
          </span>
          {chipFor(field, trigger.conditions[field.key] ?? [], members, (v) =>
            withValues(trigger, onChange, field.key, v),
          )}
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={`Remove ${field.label} filter`}
            onClick={() => withValues(trigger, onChange, field.key, [])}
          >
            <CrossMedium />
          </Button>
        </div>
      ))}
      {trigger.regex === undefined ? null : (
        <div
          data-slot="trigger-filter-row"
          data-filter="pattern"
          className="kiki-chip-row"
        >
          <span className="text-sm font-normal text-muted-foreground-2">
            and
          </span>
          <PatternChip
            value={trigger.regex}
            subject={patternSubject(trigger.type)}
            onChange={(regex) => onChange({ ...trigger, regex })}
          />
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Remove pattern filter"
            onClick={() => {
              const { regex: _dropped, ...rest } = trigger;
              onChange(rest);
            }}
          >
            <CrossMedium />
          </Button>
        </div>
      )}
    </>
  );
}

/** The pattern filter: a chip reading "body matches …" over a regex input. */
function PatternChip({
  value,
  subject,
  onChange,
}: {
  value: string;
  subject: string;
  onChange: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const invalid = (() => {
    try {
      new RegExp(draft);
      return false;
    } catch {
      return true;
    }
  })();
  return (
    <Popover onOpenChange={(open) => (open ? setDraft(value) : undefined)}>
      <PopoverTrigger
        render={
          <Button
            variant="soft"
            size="xs"
            aria-label="Pattern filter"
            className="kiki-filter-chip"
            data-wide
          />
        }
      >
        <span className="shrink-0 font-normal text-muted-foreground-2">
          {subject} matches
        </span>
        <span className="kiki-filter-chip-value">
          {value === "" ? "any pattern" : value}
        </span>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="kiki-pattern-menu"
      >
        <input
          className={menuSearchInputClass}
          aria-label="Regular expression"
          aria-invalid={invalid}
          placeholder="Regular expression"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !invalid) {
              event.preventDefault();
              onChange(draft);
            }
            if (event.key !== "Escape") event.stopPropagation();
          }}
        />
        <div className={menuEmptyClass}>
          {invalid
            ? "Not a valid regular expression"
            : `Runs only when the ${subject} matches, press Enter to apply`}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** The filters this event offers that the row is not already showing. */
function AddFilterMenu({
  trigger,
  onChange,
}: {
  trigger: EventTrigger;
  onChange: (trigger: EventTrigger) => void;
}) {
  const inline = primaryFields(trigger.type, trigger.event).map(
    (field) => field.key,
  );
  const offered = conditionFields(trigger.type, trigger.event).filter(
    (field) =>
      !inline.includes(field.key) &&
      (trigger.conditions[field.key] ?? []).length === 0,
  );
  const canAddPattern = trigger.regex === undefined;
  if (offered.length === 0 && !canAddPattern) return null;
  return (
    <Menu>
      <MenuTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label="Add filter" />
        }
      >
        <PlusMedium />
      </MenuTrigger>
      <MenuContent align="end" className="kiki-menu">
        {offered.map((field) => (
          <MenuItem
            key={field.key}
            onClick={() => withValues(trigger, onChange, field.key, [])}
          >
            <span className={menuLabelClass}>
              {field.label.slice(0, 1).toUpperCase()}
              {field.label.slice(1)}
            </span>
          </MenuItem>
        ))}
        {canAddPattern ? (
          <MenuItem onClick={() => onChange({ ...trigger, regex: "" })}>
            <span className={menuLabelClass}>Matching pattern</span>
          </MenuItem>
        ) : null}
      </MenuContent>
    </Menu>
  );
}

/** Slack's bot switch, beside the message filters it decides for. */
function BotMessagesChip({
  value,
  onChange,
}: {
  value: boolean | undefined;
  onChange: (value: boolean) => void;
}) {
  return (
    <OptionChip
      ariaLabel="Bot messages"
      current={value === true ? "bots" : "humans"}
      options={[
        { value: "humans", label: "humans only" },
        { value: "bots", label: "bots included" },
      ]}
      onPick={(next) => onChange(next === "bots")}
    />
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
        {event === null ? null : (
          <PrimaryFilters trigger={event} onChange={(next) => onChange(next)} />
        )}
        {event?.type === "slack" && event.event === "message" ? (
          <BotMessagesChip
            value={event.includeBots}
            onChange={(includeBots) => onChange({ ...event, includeBots })}
          />
        ) : null}
        <span className="ml-auto flex items-center gap-0.5">
          {event === null ? null : (
            <AddFilterMenu
              trigger={event}
              onChange={(next) => onChange(next)}
            />
          )}
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
        <ExtraFilters trigger={event} onChange={(next) => onChange(next)} />
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
  onAdd: (type: TriggerType, event?: string) => void;
};

export function AddTriggerMenu({ onAdd }: AddTriggerMenuProps) {
  return (
    <Menu>
      <MenuTrigger render={<Button variant="ghost" size="sm" />}>
        <PlusMedium />
        Add trigger
      </MenuTrigger>
      <MenuContent align="end" className="kiki-menu">
        <MenuItem onClick={() => onAdd("schedule")}>
          <span className={menuIconClass}>
            <CalendarClock />
          </span>
          On a schedule
        </MenuItem>
        {integrationTriggers.map((type) => (
          <MenuSub key={type}>
            <MenuSubTrigger>
              <span className={menuIconClass}>
                <TriggerIcon type={type} />
              </span>
              {triggerLabels[type]}
            </MenuSubTrigger>
            <MenuSubContent className="kiki-menu">
              {(eventGroups[type] ?? []).map((group) => (
                <MenuGroup key={group.label}>
                  <MenuLabel>{group.label}</MenuLabel>
                  {group.leaves.map((leaf) => {
                    const coming = eventStatus(type, leaf.event);
                    return (
                      <MenuItem
                        key={leaf.event}
                        disabled={coming === "coming_soon"}
                        onClick={() => onAdd(type, leaf.event)}
                      >
                        <span className={menuIconClass}>
                          <TriggerIcon type={type} />
                        </span>
                        <span className={menuLabelClass}>{leaf.label}</span>
                        {coming === "coming_soon" ? (
                          <Badge
                            size="sm"
                            variant="ghost"
                            className={menuTrailingClass}
                            glyph={false}
                          >
                            Coming soon
                          </Badge>
                        ) : null}
                      </MenuItem>
                    );
                  })}
                </MenuGroup>
              ))}
            </MenuSubContent>
          </MenuSub>
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
