import { Icon } from "@/primitives/icon";
import { eventLabels } from "../events";
import linearIcon from "./assets/linear.svg?url";
import sentryIcon from "./assets/sentry.svg?url";
import slackIcon from "./assets/slack.svg?url";
import { CalendarClock, Globe } from "./glyphs";

export const triggerTypes = [
  "schedule",
  "github",
  "slack",
  "sentry",
  "linear",
  "incoming_webhook",
  "on_demand",
] as const;

export type TriggerType = (typeof triggerTypes)[number];

export type Trigger = {
  readonly type: TriggerType;
  readonly event?: string;
  readonly cron?: string;
  readonly timezone?: string;
};

export const triggerTypeLabels: Record<TriggerType, string> = {
  schedule: "Schedule",
  github: "GitHub",
  slack: "Slack",
  sentry: "Sentry",
  linear: "Linear",
  incoming_webhook: "Webhook",
  on_demand: "On demand",
};

export const isTriggerType = (value: unknown): value is TriggerType =>
  typeof value === "string" &&
  (triggerTypes as ReadonlyArray<string>).includes(value);

export type TriggerStatus = "shipped" | "coming_soon";

export const triggerStatus = (trigger: Trigger): TriggerStatus =>
  trigger.type === "sentry" ||
  (trigger.type === "slack" && trigger.event === "channel_created")
    ? "coming_soon"
    : "shipped";

const brandIcons: Partial<Record<TriggerType, string>> = {
  slack: slackIcon,
  sentry: sentryIcon,
  linear: linearIcon,
};

export type TriggerIconProps = { type: TriggerType; className?: string };

export function TriggerIcon({ type, className }: TriggerIconProps) {
  const classes = ["size-(--icon-sm) shrink-0", className]
    .filter(Boolean)
    .join(" ");
  const brand = brandIcons[type];
  if (brand !== undefined)
    return <img src={brand} alt="" aria-hidden className={classes} />;
  switch (type) {
    case "schedule":
      return <CalendarClock className={classes} />;
    case "github":
      return <Icon name="github" className={classes} />;
    case "incoming_webhook":
      return <Globe className={classes} />;
    default:
      return <Icon name="play" className={classes} />;
  }
}

const eventLabel = (trigger: Trigger) =>
  eventLabels[trigger.type]?.[trigger.event ?? ""] ??
  triggerTypeLabels[trigger.type];

const formatMinutes = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const period = hours >= 12 ? "PM" : "AM";
  return `${hours % 12 === 0 ? 12 : hours % 12}:${String(minutes % 60).padStart(2, "0")} ${period}`;
};

const weekdays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const joinList = (items: ReadonlyArray<string>) =>
  items.length < 2
    ? (items[0] ?? "")
    : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;

const parseCronField = (field: string, max: number) => {
  const values = field.split(",").flatMap((part) => {
    const match = /^(\d+)(?:-(\d+))?$/.exec(part);
    if (match === null) return [Number.NaN];
    const start = Number(match[1]);
    const end = match[2] === undefined ? start : Number(match[2]);
    if (end < start) return [Number.NaN];
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  });
  return values.some((value) => Number.isNaN(value) || value > max)
    ? undefined
    : [...new Set(values)].sort((a, b) => a - b);
};

const dayPhrase = (dayOfMonth: string, month: string, dayOfWeek: string) => {
  if (month !== "*") return undefined;
  if (dayOfMonth !== "*")
    return /^\d+$/.test(dayOfMonth) && dayOfWeek === "*"
      ? `Monthly on day ${dayOfMonth}`
      : undefined;
  if (dayOfWeek === "*") return "Daily";
  if (dayOfWeek === "1-5") return "Weekdays";
  const days = parseCronField(dayOfWeek, 7);
  if (days === undefined) return undefined;
  return joinList(
    [...new Set(days.map((day) => day % 7))]
      .sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7))
      .map((day) => weekdays[day] ?? String(day)),
  );
};

type CronPhrase =
  | { kind: "text"; text: string }
  | { kind: "times"; days: string; minutes: ReadonlyArray<number> };

const parseCron = (cron: string): CronPhrase => {
  if (cron.trim() === "") return { kind: "text", text: "Custom schedule" };
  const fields = cron.trim().split(/\s+/);
  if (fields.length !== 5) return { kind: "text", text: cron };
  const [minute = "", hour = "", dayOfMonth = "", month = "", dayOfWeek = ""] =
    fields;
  if (
    minute.startsWith("*/") &&
    hour === "*" &&
    dayOfMonth === "*" &&
    month === "*"
  )
    return { kind: "text", text: `Every ${minute.slice(2)} minutes` };
  if (
    minute === "0" &&
    hour.startsWith("*/") &&
    dayOfMonth === "*" &&
    month === "*"
  )
    return { kind: "text", text: `Every ${hour.slice(2)} hours` };
  const hours = parseCronField(hour, 23);
  const minutes = parseCronField(minute, 59);
  const days = dayPhrase(dayOfMonth, month, dayOfWeek);
  return hours === undefined || minutes === undefined || days === undefined
    ? { kind: "text", text: cron }
    : {
        kind: "times",
        days,
        minutes: hours.flatMap((h) => minutes.map((m) => h * 60 + m)),
      };
};

const describeTimes = (days: string, minutes: ReadonlyArray<number>) => {
  const sorted = [...new Set(minutes)].sort((a, b) => a - b);
  const first = sorted[0] ?? 0;
  const last = sorted.at(-1) ?? 0;
  return sorted.length > 4
    ? `${days}, ${sorted.length} times between ${formatMinutes(first)} and ${formatMinutes(last)}`
    : `${days} at ${joinList(sorted.map(formatMinutes))}`;
};

type ScheduleGroup = {
  key: string | undefined;
  timezone: string;
  phrase: CronPhrase;
};

const timezoneSuffix = (timezone: string) => `(${timezone || "UTC"})`;

/** One phrase for a set of schedule triggers, merging times that share days and zone. */
export const describeSchedules = (
  schedules: ReadonlyArray<{ cron: string; timezone: string }>,
) => {
  if (schedules.length === 0) return undefined;
  const groups: ScheduleGroup[] = [];
  for (const schedule of schedules) {
    const phrase = parseCron(schedule.cron);
    const key =
      phrase.kind === "times"
        ? `${phrase.days}\u0000${schedule.timezone}`
        : undefined;
    const index = groups.findIndex(
      (group) => key !== undefined && group.key === key,
    );
    const match = groups[index];
    if (
      match === undefined ||
      match.phrase.kind !== "times" ||
      phrase.kind !== "times"
    ) {
      groups.push({ key, timezone: schedule.timezone, phrase });
      continue;
    }
    groups[index] = {
      ...match,
      phrase: {
        ...phrase,
        minutes: [...match.phrase.minutes, ...phrase.minutes],
      },
    };
  }
  const text = (group: ScheduleGroup) =>
    group.phrase.kind === "times"
      ? describeTimes(group.phrase.days, group.phrase.minutes)
      : group.phrase.text;
  return new Set(groups.map((group) => group.timezone)).size === 1
    ? `${groups.map(text).join("; ")} ${timezoneSuffix(groups[0]?.timezone ?? "")}`
    : groups
        .map((group) => `${text(group)} ${timezoneSuffix(group.timezone)}`)
        .join("; ");
};

const scheduleOf = (trigger: Trigger) => ({
  cron: trigger.cron ?? "",
  timezone: trigger.timezone ?? "",
});

/** The trailing summary on an automation row. */
export const describeTriggers = (triggers: ReadonlyArray<Trigger>) => {
  const first = triggers[0];
  if (first === undefined) return undefined;
  if (first.type === "schedule")
    return describeSchedules(
      triggers.filter((t) => t.type === "schedule").map(scheduleOf),
    );
  if (first.type === "on_demand") return "Manual run";
  if (first.type === "incoming_webhook") return "On webhook request";
  return `On ${eventLabel(first).toLowerCase()}`;
};
