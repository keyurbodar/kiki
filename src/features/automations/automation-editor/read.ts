import type { WebhookCoalescingConfig } from "../webhook-coalescing";
import { validateWebhookCoalescing } from "../webhook-coalescing";
import type {
  Automation,
  ModelChoice,
  Organize,
  RunAsKind,
  Trigger,
  TriggerType,
} from "./model";

type Json = Record<string, unknown>;

const isRecord = (value: unknown): value is Json =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const text = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;

const nullableText = (value: unknown) =>
  typeof value === "string" ? value : null;

const strings = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : undefined;

const triggerTypes: ReadonlyArray<TriggerType> = [
  "schedule",
  "on_demand",
  "incoming_webhook",
  "github",
  "slack",
  "sentry",
  "linear",
];

/** A stored batching config, kept only while it still validates. */
const readCoalescing = (
  value: unknown,
): WebhookCoalescingConfig | undefined => {
  if (!isRecord(value) || !Array.isArray(value.rules)) return undefined;
  const coalescing = value as WebhookCoalescingConfig;
  return validateWebhookCoalescing(coalescing) === undefined
    ? coalescing
    : undefined;
};

const readConditions = (value: unknown) =>
  isRecord(value)
    ? Object.fromEntries(
        Object.entries(value).flatMap(([key, entry]) => {
          const list = strings(entry);
          return list === undefined ? [] : [[key, list]];
        }),
      )
    : {};

export const readTrigger = (value: unknown): Trigger | undefined => {
  if (!isRecord(value)) return undefined;
  const type = triggerTypes.find((candidate) => candidate === value.type);
  if (type === undefined) return undefined;
  if (type === "schedule")
    return {
      type,
      cron: text(value.cron, "0 9 * * *"),
      timezone: text(value.timezone, "UTC"),
    };
  if (type === "on_demand") return { type };
  return {
    ...value,
    type,
    event: typeof value.event === "string" ? value.event : undefined,
    conditions: readConditions(value.conditions),
    runWhen: typeof value.runWhen === "string" ? value.runWhen : undefined,
    regex: typeof value.regex === "string" ? value.regex : undefined,
    ...(readCoalescing(value.coalescing) === undefined
      ? {}
      : { coalescing: readCoalescing(value.coalescing) }),
  };
};

const readModel = (value: unknown): ModelChoice | null => {
  if (typeof value === "string") return { id: value, reasoning: null };
  if (!isRecord(value)) return null;
  const id = text(value.id ?? value.modelId);
  if (id === "") return null;
  return {
    id,
    reasoning: nullableText(value.reasoning ?? value.reasoningMode),
  };
};

const readOrganize = (value: unknown): Organize | null =>
  isRecord(value)
    ? {
        pin: value.pin === true ? true : undefined,
        folders: strings(value.folders),
        tags: strings(value.tags),
      }
    : null;

const runAsKind = (value: unknown): RunAsKind =>
  value === "service" ? "service" : "human";

export const readAutomation = (value: unknown): Automation | undefined => {
  const source =
    isRecord(value) && isRecord(value.automation) ? value.automation : value;
  if (!isRecord(source) || typeof source.id !== "string") return undefined;
  if (source.deleted === true) return undefined;
  const triggers = Array.isArray(source.triggers)
    ? source.triggers.flatMap((trigger) => {
        const read = readTrigger(trigger);
        return read === undefined ? [] : [read];
      })
    : [];
  const maxRuns = source.maxRunsPerDay;
  return {
    id: source.id,
    projectId: text(source.projectId),
    name: text(source.name),
    description: nullableText(source.description),
    prompt: text(source.prompt),
    enabled: source.enabled === true,
    creator: text(source.creator),
    creatorUserId: text(source.creatorUserId),
    runAsKind: runAsKind(source.runAsKind),
    runAsId: text(source.runAsId),
    slackImpersonation: source.slackImpersonation === true,
    quietSlackPosts: source.quietSlackPosts === true,
    threadMode: source.threadMode === "single" ? "single" : "new",
    singleJamId: nullableText(source.singleJamId),
    triggers,
    model: readModel(source.model),
    maxRunsPerDay:
      typeof maxRuns === "number" && Number.isFinite(maxRuns) ? maxRuns : null,
    machineSize: nullableText(source.machineSize),
    organize: readOrganize(source.organize),
    updatedAt: text(source.updatedAt),
  };
};

export type Member = {
  userId: string;
  name: string;
  imageUrl: string | null;
};

export type ServiceUser = {
  id: string;
  name: string;
  role: string;
  disabledAt: string | null;
};

const listOf = (value: unknown, key: string) => {
  if (Array.isArray(value)) return value;
  if (isRecord(value) && Array.isArray(value[key]))
    return value[key] as unknown[];
  if (isRecord(value) && Array.isArray(value.items))
    return value.items as unknown[];
  return [];
};

export const readMembers = (value: unknown): ReadonlyArray<Member> =>
  listOf(value, "members").flatMap((entry) => {
    if (!isRecord(entry)) return [];
    const userId = text(entry.userId ?? entry.id);
    if (userId === "" || entry.disabledAt) return [];
    const name =
      text(entry.name) ||
      text(entry.displayName) ||
      text(entry.email) ||
      userId;
    return [{ userId, name, imageUrl: nullableText(entry.imageUrl) }];
  });

export const readServiceUsers = (value: unknown): ReadonlyArray<ServiceUser> =>
  listOf(value, "serviceUsers").flatMap((entry) => {
    if (!isRecord(entry) || typeof entry.id !== "string") return [];
    return [
      {
        id: entry.id,
        name: text(entry.name, entry.id),
        role: text(entry.role, "member"),
        disabledAt: nullableText(entry.disabledAt),
      },
    ];
  });
