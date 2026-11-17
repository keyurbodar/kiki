import {
  type EditorForm,
  organizeOf,
  type RunsIn,
  sharedRunWhen,
  type Trigger,
} from "../automation-editor/model";
import type { AutomationTemplate, TemplateTrigger } from "../templates-section";

/** What `/automation/new` starts the editor form from, before the user edits it. */
export type NewAutomationSeed = {
  readonly name: string;
  readonly description: string;
  readonly prompt: string;
  readonly triggers: ReadonlyArray<Trigger>;
  readonly runWhen: string;
  readonly runsIn: RunsIn;
};

export const blankSeed = (): NewAutomationSeed => ({
  name: "",
  description: "",
  prompt: "",
  triggers: [],
  runWhen: "",
  runsIn: { threadMode: "new", singleJamId: null },
});

/** Templates carry a flat trigger; the editor form holds the discriminated union. */
export const triggerFromTemplate = (source: TemplateTrigger): Trigger => {
  if (source.type === "schedule")
    return {
      type: "schedule",
      cron: source.cron ?? "0 9 * * *",
      timezone: source.timezone ?? "UTC",
    };
  if (source.type === "on_demand") return { type: "on_demand" };
  return {
    type: source.type,
    ...(source.event === undefined ? {} : { event: source.event }),
    conditions: source.conditions ?? {},
    ...(source.runWhen === undefined ? {} : { runWhen: source.runWhen }),
  };
};

export const seedFromTemplate = (
  template: AutomationTemplate,
): NewAutomationSeed => {
  const triggers = template.triggers.map(triggerFromTemplate);
  return {
    name: template.name,
    description: template.description,
    prompt: template.instructions,
    triggers,
    runWhen: sharedRunWhen(triggers),
    runsIn: { threadMode: "new", singleJamId: null },
  };
};

/**
 * `?thread=` pins the automation to one thread, and Capy names it after that
 * thread because the thread is what the automation is for.
 */
export const seedFromThread = (
  threadId: string,
  title: string | null,
): NewAutomationSeed => ({
  name: title ?? "",
  description: "",
  prompt: title ?? "",
  triggers: [],
  runWhen: "",
  runsIn: { threadMode: "single", singleJamId: threadId },
});

export const formFromSeed = (seed: NewAutomationSeed): EditorForm => ({
  name: seed.name,
  description: seed.description,
  prompt: seed.prompt,
  runWhen: seed.runWhen,
  triggers: seed.triggers,
  maxRunsPerDay: null,
  model: null,
  machineSize: null,
  pin: false,
  folderIds: [],
  tagIds: [],
  runAs: null,
  slackImpersonation: false,
  quietSlackPosts: null,
  runsIn: seed.runsIn,
});

export type CreatePayloadContext = {
  readonly projectId: string;
  /** The person creating it becomes the run-as owner until they pick someone else. */
  readonly viewerId: string | undefined;
};

export const createPayload = (
  form: EditorForm,
  context: CreatePayloadContext,
) => {
  const description = form.description.trim();
  const runAs = form.runAs ?? {
    kind: "human" as const,
    id: context.viewerId ?? "",
  };
  return {
    projectId: context.projectId,
    name: form.name.trim(),
    description: description === "" ? null : description,
    prompt: form.prompt.trim(),
    enabled: form.triggers.length > 0,
    threadMode: form.runsIn.threadMode,
    singleJamId: form.runsIn.singleJamId,
    triggers: form.triggers,
    runAsKind: runAs.kind,
    runAsId: runAs.id,
    slackImpersonation: form.slackImpersonation,
    quietSlackPosts: form.quietSlackPosts ?? false,
    maxRunsPerDay: form.maxRunsPerDay,
    model: form.model,
    machineSize: form.machineSize,
    organize: organizeOf(form),
  };
};

/** The create response is undecoded, so read the id we navigate to. */
export const createdAutomationId = (result: unknown): string | undefined => {
  if (typeof result !== "object" || result === null) return undefined;
  const id = (result as { id?: unknown }).id;
  return typeof id === "string" && id !== "" ? id : undefined;
};
