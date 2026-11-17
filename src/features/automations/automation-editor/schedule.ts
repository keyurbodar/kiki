import type { ScheduleTrigger, Trigger } from "./model";

export type SchedulePreset =
  | "hourly"
  | "daily"
  | "weekly"
  | "weekdays"
  | "minutes"
  | "custom";

export type ScheduleSpec = {
  preset: SchedulePreset;
  time: string;
  day: string;
  interval: string;
};

export const presetLabels: Record<Exclude<SchedulePreset, "custom">, string> = {
  hourly: "Hourly",
  daily: "Daily",
  weekly: "Weekly",
  weekdays: "Weekdays",
  minutes: "Minutes",
};

export const weekdays = [
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
  { value: "0", label: "Sunday" },
];

const commonTimezones = [
  "UTC",
  "America/New_York",
  "America/Los_Angeles",
  "America/Chicago",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Tokyo",
];

export const timezones = () => [
  ...new Set([
    ...commonTimezones,
    ...(typeof Intl.supportedValuesOf === "function"
      ? Intl.supportedValuesOf("timeZone")
      : []),
  ]),
];

export const hourIntervals = ["1", "2", "3", "4", "6", "8", "12"];

export const minuteIntervals = ["15", "30"];

const withinRange = (value: string, max: number) =>
  /^(0|[1-9]\d*)$/.test(value) && Number(value) <= max;

const stepPattern = /^\*\/([1-9]\d*)$/;

export const parseCron = (cron: string): ScheduleSpec => {
  const fallback: ScheduleSpec = {
    preset: "custom",
    time: "09:00",
    day: "1",
    interval: "6",
  };
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return fallback;
  const [minute = "", hour = "", dayOfMonth = "", month = "", dayOfWeek = ""] =
    parts;
  if (dayOfMonth !== "*" || month !== "*") return fallback;
  const minuteStep = stepPattern.exec(minute)?.[1];
  if (minuteStep !== undefined && hour === "*" && dayOfWeek === "*")
    return { ...fallback, preset: "minutes", interval: minuteStep };
  const hourStep = stepPattern.exec(hour)?.[1];
  if (minute === "0" && hourStep !== undefined && dayOfWeek === "*")
    return { ...fallback, preset: "hourly", interval: hourStep };
  if (!withinRange(minute, 59) || !withinRange(hour, 23)) return fallback;
  const time = `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
  if (dayOfWeek === "*") return { ...fallback, preset: "daily", time };
  if (dayOfWeek === "1-5") return { ...fallback, preset: "weekdays", time };
  if (/^[0-6]$/.test(dayOfWeek))
    return { ...fallback, preset: "weekly", day: dayOfWeek, time };
  return fallback;
};

export const buildCron = (spec: ScheduleSpec): string | null => {
  if (!/^\d{1,2}:\d{2}$/.test(spec.time)) return null;
  const interval = Number(spec.interval);
  if (
    (spec.preset === "hourly" || spec.preset === "minutes") &&
    !(interval > 0)
  )
    return null;
  const [hourText = "9", minuteText = "0"] = spec.time.split(":");
  const hour = String(Number(hourText));
  const minute = String(Number(minuteText));
  switch (spec.preset) {
    case "daily":
      return `${minute} ${hour} * * *`;
    case "weekdays":
      return `${minute} ${hour} * * 1-5`;
    case "weekly":
      return `${minute} ${hour} * * ${spec.day}`;
    case "hourly":
      return `0 */${interval} * * *`;
    case "minutes":
      return `*/${interval} * * * *`;
    case "custom":
      return null;
  }
};

const hoursOf = (field: string) => {
  const hours = field.split(",").flatMap((part) => {
    const match = /^(\d+)(?:-(\d+))?$/.exec(part);
    if (match === null) return [Number.NaN];
    const start = Number(match[1]);
    const end = match[2] === undefined ? start : Number(match[2]);
    return end < start
      ? [Number.NaN]
      : Array.from({ length: end - start + 1 }, (_, offset) => start + offset);
  });
  return hours.every((hour) => Number.isInteger(hour) && hour <= 23)
    ? hours
    : undefined;
};

export const nextSchedule = (
  schedule: ScheduleTrigger,
  triggers: ReadonlyArray<Trigger>,
): ScheduleTrigger => {
  const parts = schedule.cron.trim().split(/\s+/);
  const [
    minute = "0",
    hour = "8",
    dayOfMonth = "*",
    month = "*",
    dayOfWeek = "*",
  ] = parts.length === 5 ? parts : [];
  const baseMinute = withinRange(minute, 59) ? minute : "0";
  const lastHour = hoursOf(hour)?.at(-1) ?? 8;
  const taken = new Set(
    triggers.flatMap((trigger) =>
      trigger.type === "schedule" && trigger.timezone === schedule.timezone
        ? [trigger.cron.trim()]
        : [],
    ),
  );
  const cron =
    Array.from(
      { length: 24 },
      (_, step) =>
        `${baseMinute} ${(lastHour + step + 1) % 24} ${dayOfMonth} ${month} ${dayOfWeek}`,
    ).find((candidate) => !taken.has(candidate)) ?? schedule.cron;
  return { type: "schedule", cron, timezone: schedule.timezone };
};
