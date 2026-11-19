import type { WebhookCoalescingConfig } from "../webhook-coalescing";

export type ThreadMode = "new" | "single";

export type RunsIn = { threadMode: ThreadMode; singleJamId: string | null };

export type RunAsKind = "human" | "service";

export type RunAs = { kind: RunAsKind; id: string };

export type ScheduleTrigger = {
  type: "schedule";
  cron: string;
  timezone: string;
};

export type OnDemandTrigger = { type: "on_demand" };

export type EventTriggerType =
  | "incoming_webhook"
  | "github"
  | "slack"
  | "sentry"
  | "linear";

export type EventTrigger = {
  type: EventTriggerType;
  event?: string;
  conditions: Record<string, ReadonlyArray<string>>;
  runWhen?: string;
  regex?: string;
  /** Whether a message from a bot can fire a Slack trigger. */
  includeBots?: boolean;
  /** How a webhook trigger collects events before running them together. */
  coalescing?: WebhookCoalescingConfig;
};

export type Trigger = ScheduleTrigger | OnDemandTrigger | EventTrigger;

export type TriggerType = Trigger["type"];

export type ModelChoice = { id: string; reasoning: string | null };

export type Organize = {
  pin?: boolean;
  folders?: ReadonlyArray<string>;
  tags?: ReadonlyArray<string>;
};

export type Automation = {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  prompt: string;
  enabled: boolean;
  creator: string;
  creatorUserId: string;
  runAsKind: RunAsKind;
  runAsId: string;
  slackImpersonation: boolean;
  quietSlackPosts: boolean;
  threadMode: ThreadMode;
  singleJamId: string | null;
  triggers: ReadonlyArray<Trigger>;
  model: ModelChoice | null;
  maxRunsPerDay: number | null;
  machineSize: string | null;
  organize: Organize | null;
  updatedAt: string;
};

export type EditorForm = {
  name: string;
  description: string;
  prompt: string;
  runWhen: string;
  triggers: ReadonlyArray<Trigger>;
  maxRunsPerDay: number | null;
  model: ModelChoice | null;
  machineSize: string | null;
  pin: boolean;
  folderIds: ReadonlyArray<string>;
  tagIds: ReadonlyArray<string>;
  runAs: RunAs | null;
  slackImpersonation: boolean;
  quietSlackPosts: boolean | null;
  runsIn: RunsIn;
};

export const maxTriggers = 20;

export const triggerLabels: Record<TriggerType, string> = {
  schedule: "Schedule",
  github: "GitHub",
  slack: "Slack",
  sentry: "Sentry",
  linear: "Linear",
  incoming_webhook: "Webhook",
  on_demand: "On demand",
};

const singletonTriggers: ReadonlyArray<TriggerType> = [
  "incoming_webhook",
  "on_demand",
];

export const isEventTrigger = (trigger: Trigger): trigger is EventTrigger =>
  "conditions" in trigger;

export const defaultTrigger = (type: TriggerType, event?: string): Trigger => {
  switch (type) {
    case "schedule":
      return { type, cron: "0 9 * * *", timezone: "UTC" };
    case "on_demand":
      return { type };
    case "incoming_webhook":
      return { type, conditions: {} };
    case "github":
      return { type, event: event ?? "pull_request_opened", conditions: {} };
    case "slack":
      return { type, event: event ?? "message", conditions: {} };
    case "sentry":
      return { type, event: event ?? "issue_lifecycle", conditions: {} };
    case "linear":
      return { type, event: event ?? "issue_created", conditions: {} };
  }
};

export const sharedRunWhen = (triggers: ReadonlyArray<Trigger>) =>
  triggers.flatMap((trigger) =>
    isEventTrigger(trigger) && trigger.runWhen !== undefined
      ? [trigger.runWhen]
      : [],
  )[0] ?? "";

export const mixedRunWhen = (triggers: ReadonlyArray<Trigger>) =>
  new Set(
    triggers.flatMap((trigger) =>
      isEventTrigger(trigger) ? [trigger.runWhen ?? ""] : [],
    ),
  ).size > 1;

export const formFromAutomation = (automation: Automation): EditorForm => ({
  name: automation.name,
  description: automation.description ?? "",
  prompt: automation.prompt,
  runWhen: sharedRunWhen(automation.triggers),
  triggers: automation.triggers,
  maxRunsPerDay: automation.maxRunsPerDay,
  model: automation.model,
  machineSize: automation.machineSize,
  pin: automation.organize?.pin === true,
  folderIds: automation.organize?.folders ?? [],
  tagIds: automation.organize?.tags ?? [],
  runAs: null,
  slackImpersonation: automation.slackImpersonation,
  quietSlackPosts: automation.quietSlackPosts,
  runsIn: {
    threadMode: automation.threadMode,
    singleJamId: automation.singleJamId,
  },
});

export const withRunAs = (form: EditorForm, runAs: RunAs): EditorForm =>
  runAs.kind === "service"
    ? { ...form, runAs, pin: false, tagIds: [], slackImpersonation: false }
    : { ...form, runAs };

export const organizeOf = (form: EditorForm): Organize | null =>
  !form.pin && form.folderIds.length === 0 && form.tagIds.length === 0
    ? null
    : {
        pin: form.pin ? true : undefined,
        folders: form.folderIds.length === 0 ? undefined : form.folderIds,
        tags: form.tagIds.length === 0 ? undefined : form.tagIds,
      };

export const toggleId = (ids: ReadonlyArray<string>, id: string) =>
  ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id];

export const effectiveRunAs = (
  form: EditorForm,
  automation: Automation,
): RunAs =>
  form.runAs ?? { kind: automation.runAsKind, id: automation.runAsId };

const scheduleKey = (trigger: Trigger) =>
  trigger.type === "schedule"
    ? [`${trigger.cron.trim()}|${trigger.timezone}`]
    : [];

export const hasDuplicateSchedules = (triggers: ReadonlyArray<Trigger>) => {
  const keys = triggers.flatMap(scheduleKey);
  return new Set(keys).size < keys.length;
};

export const canSave = (form: EditorForm) =>
  form.name.trim().length > 0 &&
  form.prompt.trim().length > 0 &&
  form.triggers.length > 0 &&
  !hasDuplicateSchedules(form.triggers);

export const isDirty = (form: EditorForm, saved: EditorForm) =>
  JSON.stringify(form) !== JSON.stringify(saved);

export type AddTriggerResult =
  | { kind: "added"; triggers: ReadonlyArray<Trigger> }
  | { kind: "warning"; title: string; description: string };

export const triggerLimitWarning: AddTriggerResult = {
  kind: "warning",
  title: "Automations can have up to 20 triggers",
  description: "Remove one first",
};

export const addTrigger = (
  form: EditorForm,
  trigger: Trigger,
  nextSchedule: (
    schedule: ScheduleTrigger,
    triggers: ReadonlyArray<Trigger>,
  ) => ScheduleTrigger,
): AddTriggerResult => {
  if (form.triggers.length >= maxTriggers) return triggerLimitWarning;
  const lastScheduleIndex = form.triggers.findLastIndex(
    (existing) => existing.type === "schedule",
  );
  const lastSchedule = form.triggers[lastScheduleIndex];
  if (trigger.type === "schedule" && lastSchedule?.type === "schedule") {
    return {
      kind: "added",
      triggers: form.triggers.toSpliced(
        lastScheduleIndex + 1,
        0,
        nextSchedule(lastSchedule, form.triggers),
      ),
    };
  }
  if (
    singletonTriggers.includes(trigger.type) &&
    form.triggers.some((existing) => existing.type === trigger.type)
  ) {
    return {
      kind: "warning",
      title: `Only one ${triggerLabels[trigger.type].toLowerCase()} trigger is allowed`,
      description: "Edit the existing one instead",
    };
  }
  const runWhen = form.runWhen.trim();
  return {
    kind: "added",
    triggers: [
      ...form.triggers,
      isEventTrigger(trigger) && runWhen !== ""
        ? { ...trigger, runWhen }
        : trigger,
    ],
  };
};

export const addScheduleTime = (
  form: EditorForm,
  index: number,
  schedule: ScheduleTrigger,
  nextSchedule: (
    schedule: ScheduleTrigger,
    triggers: ReadonlyArray<Trigger>,
  ) => ScheduleTrigger,
): AddTriggerResult =>
  form.triggers.length >= maxTriggers
    ? triggerLimitWarning
    : {
        kind: "added",
        triggers: form.triggers.toSpliced(
          index + 1,
          0,
          nextSchedule(schedule, form.triggers),
        ),
      };

export const applyRunWhen = (
  triggers: ReadonlyArray<Trigger>,
  runWhen: string,
  keepEach: boolean,
): ReadonlyArray<Trigger> =>
  keepEach
    ? triggers
    : triggers.map((trigger) => {
        if (!isEventTrigger(trigger)) return trigger;
        const value = runWhen.trim();
        if (value === "") {
          const { runWhen: _dropped, ...rest } = trigger;
          return rest;
        }
        return { ...trigger, runWhen: value };
      });

export const savedAutomation = (
  automation: Automation,
  form: EditorForm,
  triggers: ReadonlyArray<Trigger>,
  now: Date,
): Automation => ({
  ...automation,
  name: form.name.trim(),
  description: form.description.trim(),
  prompt: form.prompt.trim(),
  triggers,
  maxRunsPerDay: form.maxRunsPerDay,
  model:
    form.runsIn.threadMode === "single" && form.model === null
      ? null
      : form.model,
  machineSize: form.machineSize,
  organize: organizeOf(form),
  runAsKind: form.runAs?.kind ?? automation.runAsKind,
  runAsId: form.runAs?.id ?? automation.runAsId,
  slackImpersonation: form.slackImpersonation,
  quietSlackPosts: form.quietSlackPosts ?? automation.quietSlackPosts,
  threadMode: form.runsIn.threadMode,
  singleJamId: form.runsIn.singleJamId,
  updatedAt: now.toISOString(),
});

export const updatePayload = (
  next: Automation,
  previous: Automation,
  form: EditorForm,
) => ({
  name: next.name,
  description: next.description,
  prompt: next.prompt,
  triggers: next.triggers,
  maxRunsPerDay: next.maxRunsPerDay,
  model: next.model,
  machineSize: next.machineSize,
  organize: next.organize,
  slackImpersonation: next.slackImpersonation,
  quietSlackPosts: next.quietSlackPosts,
  ...(form.runAs !== null &&
  (form.runAs.kind !== previous.runAsKind || form.runAs.id !== previous.runAsId)
    ? { runAsKind: next.runAsKind, runAsId: next.runAsId }
    : {}),
  ...(next.threadMode !== previous.threadMode ||
  next.singleJamId !== previous.singleJamId
    ? { threadMode: next.threadMode, singleJamId: next.singleJamId }
    : {}),
});
