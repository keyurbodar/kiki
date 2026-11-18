import { DateTime, Effect, Ref } from "effect";
import { fields, MockDb, newId, notFound, type Row } from "../db/MockDb.ts";
import { minutesAgo } from "../fixtures/time.ts";
import {
  isoMinutesAgo,
  org,
  people,
  projects as sampleProjects,
} from "../fixtures/world.ts";
import { mockGroup } from "../mockGroup.ts";
import {
  type AutomationBatch,
  type AutomationDetails,
  type AutomationRun,
  automationDetails,
  batches,
  defaultUsage,
  runs,
  usage,
} from "./fixtures.ts";

type AutomationRow = {
  readonly id: string;
  readonly name: string;
  readonly projectId: string;
  readonly enabled: boolean;
  readonly trigger: {
    readonly kind: string;
    readonly cron?: string;
    readonly timezone?: string;
    readonly event?: string;
  };
  readonly ownerId: string;
  readonly lastRunAt: string | null;
  readonly details?: AutomationDetails;
};

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const asOrganize = (
  value: Record<string, unknown>,
): AutomationDetails["organize"] => {
  const folders = strings(value.folders);
  const tags = strings(value.tags);
  return {
    ...(value.pin === true ? { pin: true } : {}),
    ...(folders === undefined ? {} : { folders }),
    ...(tags === undefined ? {} : { tags }),
  };
};

const asDetails = (value: unknown): AutomationDetails | undefined =>
  typeof value === "object" && value !== null
    ? (value as AutomationDetails)
    : undefined;

const strings = (value: unknown): ReadonlyArray<string> | undefined =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : undefined;

const asStored = (row: AutomationRow) => row as Row<"automations">;

const text = (value: unknown): string | undefined =>
  typeof value === "string" && value.length > 0 ? value : undefined;

const enabled = (value: unknown): boolean => value === true || value === "true";

const sampleProjectsArray = Object.values(sampleProjects);

export const AutomationsMock = mockGroup("automations", (handlers) =>
  Effect.gen(function* () {
    const { automations } = yield* MockDb;
    const webhookSecrets = yield* Ref.make<Readonly<Record<string, string>>>(
      {},
    );
    const runsRef = yield* Ref.make<ReadonlyArray<AutomationRun>>(runs);
    const batchesRef = yield* Ref.make<ReadonlyArray<AutomationBatch>>(batches);

    const find = (automationId: string) =>
      Effect.gen(function* () {
        const rows = yield* Ref.get(automations);
        const row = rows.find((candidate) => candidate.id === automationId);
        if (!row) return yield* notFound("automations", automationId);
        return row;
      });

    const view = (row: AutomationRow) =>
      Effect.gen(function* () {
        const project = sampleProjectsArray.find(
          (item) => item.id === row.projectId,
        );
        const details =
          asDetails(row.details) ?? automationDetails[row.id] ?? undefined;
        return {
          ...row,
          ...(details ?? {}),
          organizationId: org.id,
          projectName: project?.name ?? "Unassigned",
          webhookUrl: `https://hooks.example.com/orgs/${org.id}/automations/${row.id}`,
          webhookSecret: (yield* Ref.get(webhookSecrets))[row.id] ?? null,
          webhookRotatedAt: (yield* Ref.get(webhookSecrets))[row.id]
            ? isoMinutesAgo(0)
            : null,
          lastRun:
            (yield* Ref.get(runsRef)).find(
              (run) => run.automationId === row.id,
            ) ?? null,
          lastTriggeredAt: row.lastRunAt,
        };
      });

    const setEnabled = (automationId: string, next: boolean) =>
      Effect.gen(function* () {
        yield* find(automationId);
        const rows = yield* Ref.get(automations);
        const current = rows.find((row) => row.id === automationId);
        if (!current) return yield* notFound("automations", automationId);
        const updated: AutomationRow = { ...current, enabled: next };
        yield* Ref.set(
          automations,
          rows.map((row) =>
            row.id === automationId ? asStored(updated) : row,
          ),
        );
        return yield* view(updated);
      });

    const setBatchStatus = (
      batchId: string,
      status: AutomationBatch["status"],
    ) =>
      Effect.gen(function* () {
        const rows = yield* Ref.get(batchesRef);
        const current = rows.find((row) => row.id === batchId);
        if (!current) {
          return yield* Effect.die(
            new Error(`automations.batches: no row ${batchId}`),
          );
        }
        const updated = {
          ...current,
          status,
          flushedAt:
            status === "flushed" ? DateTime.formatIso(minutesAgo(0)) : null,
        };
        yield* Ref.set(
          batchesRef,
          rows.map((row) => (row.id === batchId ? updated : row)),
        );
        return updated;
      });

    return handlers
      .handle("list", ({ query }) =>
        Effect.gen(function* () {
          const input = fields(query);
          const search = text(input.search)?.toLowerCase();
          const enabledOnly =
            input.enabled === true || input.enabled === "true";
          const rows = (yield* Ref.get(automations)).filter((row) => {
            if (enabledOnly && !row.enabled) return false;
            return search ? row.name.toLowerCase().includes(search) : true;
          });
          return yield* Effect.forEach(rows, view);
        }),
      )
      .handle("listPage", ({ query }) =>
        Effect.gen(function* () {
          const input = fields(query);
          const rows = yield* Ref.get(automations);
          const limit = Number(text(input.limit) ?? rows.length);
          const offset = Number(text(input.offset) ?? 0);
          const page = rows.slice(
            Number.isFinite(offset) ? offset : 0,
            Number.isFinite(limit) ? offset + limit : undefined,
          );
          return {
            items: yield* Effect.forEach(page, view),
            total: rows.length,
            cursor: page.length > 0 ? page.at(-1)?.id : null,
          };
        }),
      )
      .handle("create", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const projectId = text(input.projectId) ?? "";
          if (
            !sampleProjectsArray.some((project) => project.id === projectId)
          ) {
            return yield* Effect.die(
              new Error(`automations.projects: no row ${projectId}`),
            );
          }
          const triggers = Array.isArray(input.triggers)
            ? (input.triggers.filter(
                (trigger) => typeof trigger === "object" && trigger !== null,
              ) as ReadonlyArray<Record<string, unknown>>)
            : undefined;
          const creator = text(input.creator) ?? "Alex Morgan";
          const creatorUserId = text(input.creatorUserId) ?? people.alex.id;
          const model = asRecord(input.model);
          const organize = asRecord(input.organize);
          const details: AutomationDetails = {
            description:
              typeof input.description === "string" ? input.description : null,
            prompt: text(input.prompt) ?? "",
            triggers: triggers ?? [
              {
                type: "schedule",
                cron: "0 9 * * 1",
                timezone: "UTC",
              },
            ],
            threadMode: input.threadMode === "single" ? "single" : "new",
            singleJamId:
              typeof input.singleJamId === "string" ? input.singleJamId : null,
            runAsKind: input.runAsKind === "service" ? "service" : "human",
            runAsId: text(input.runAsId) ?? creatorUserId,
            slackImpersonation: input.slackImpersonation === true,
            quietSlackPosts: input.quietSlackPosts === true,
            model:
              model === undefined
                ? null
                : {
                    id: text(model.id) ?? "",
                    reasoning: text(model.reasoning) ?? "",
                  },
            maxRunsPerDay:
              typeof input.maxRunsPerDay === "number"
                ? input.maxRunsPerDay
                : null,
            machineSize:
              typeof input.machineSize === "string" ? input.machineSize : null,
            organize: organize === undefined ? null : asOrganize(organize),
            creator,
            creatorUserId,
            createdAt: isoMinutesAgo(0),
            updatedAt: isoMinutesAgo(0),
          };
          const row: AutomationRow = {
            id: newId("auto"),
            name: text(input.name) ?? "New automation",
            projectId,
            enabled:
              input.enabled === undefined ? true : enabled(input.enabled),
            trigger:
              typeof input.trigger === "object" && input.trigger !== null
                ? (input.trigger as AutomationRow["trigger"])
                : { kind: "schedule", cron: "0 9 * * 1", timezone: "UTC" },
            ownerId: text(input.ownerId) ?? org.id,
            lastRunAt: null,
            details,
          };
          yield* Ref.update(automations, (rows) => [...rows, asStored(row)]);
          return yield* view(row);
        }),
      )
      .handle("get", ({ params }) =>
        find(params.automationId).pipe(Effect.flatMap(view)),
      )
      .handle("update", ({ params, payload }) =>
        Effect.gen(function* () {
          const current = yield* find(params.automationId);
          const input = fields(payload);
          const name = text(input.name);
          const projectIdValue = text(input.projectId);
          const triggerValue =
            typeof input.trigger === "object" && input.trigger !== null
              ? (input.trigger as AutomationRow["trigger"])
              : undefined;
          const details = asDetails(
            (current as { readonly details?: unknown }).details,
          );
          const currentDetails =
            details ?? automationDetails[current.id] ?? undefined;
          const triggers = Array.isArray(input.triggers)
            ? (input.triggers.filter(
                (trigger) => typeof trigger === "object" && trigger !== null,
              ) as ReadonlyArray<Record<string, unknown>>)
            : undefined;
          const model = asRecord(input.model);
          const organize = asRecord(input.organize);
          const patchedDetails: AutomationDetails | undefined =
            currentDetails === undefined
              ? undefined
              : {
                  ...currentDetails,
                  ...(typeof input.description === "string"
                    ? { description: input.description }
                    : {}),
                  ...(input.description === null ? { description: null } : {}),
                  ...(typeof input.prompt === "string"
                    ? { prompt: input.prompt }
                    : {}),
                  ...(triggers === undefined ? {} : { triggers }),
                  ...(input.threadMode === "single" ||
                  input.threadMode === "new"
                    ? { threadMode: input.threadMode }
                    : {}),
                  ...(input.singleJamId === null ||
                  typeof input.singleJamId === "string"
                    ? { singleJamId: input.singleJamId }
                    : {}),
                  ...(input.runAsKind === "human" ||
                  input.runAsKind === "service"
                    ? { runAsKind: input.runAsKind }
                    : {}),
                  ...(typeof input.runAsId === "string"
                    ? { runAsId: input.runAsId }
                    : {}),
                  ...(typeof input.slackImpersonation === "boolean"
                    ? { slackImpersonation: input.slackImpersonation }
                    : {}),
                  ...(typeof input.quietSlackPosts === "boolean"
                    ? { quietSlackPosts: input.quietSlackPosts }
                    : {}),
                  ...(model === undefined && input.model !== null
                    ? {}
                    : model === undefined
                      ? { model: null }
                      : {
                          model: {
                            id: text(model.id) ?? "",
                            reasoning: text(model.reasoning) ?? "",
                          },
                        }),
                  ...(typeof input.maxRunsPerDay === "number" ||
                  input.maxRunsPerDay === null
                    ? {
                        maxRunsPerDay:
                          typeof input.maxRunsPerDay === "number"
                            ? input.maxRunsPerDay
                            : null,
                      }
                    : {}),
                  ...(typeof input.machineSize === "string" ||
                  input.machineSize === null
                    ? {
                        machineSize:
                          typeof input.machineSize === "string"
                            ? input.machineSize
                            : null,
                      }
                    : {}),
                  ...(organize === undefined && input.organize !== null
                    ? {}
                    : organize === undefined
                      ? { organize: null }
                      : { organize: asOrganize(organize) }),
                  updatedAt: isoMinutesAgo(0),
                };
          const updated: AutomationRow = {
            ...current,
            ...(name ? { name } : {}),
            ...(projectIdValue ? { projectId: projectIdValue } : {}),
            ...(input.enabled === undefined
              ? {}
              : { enabled: enabled(input.enabled) }),
            ...(triggerValue ? { trigger: triggerValue } : {}),
            ...(patchedDetails === undefined
              ? {}
              : { details: patchedDetails }),
          };
          yield* Ref.update(automations, (rows) =>
            rows.map((row) =>
              row.id === current.id ? asStored(updated) : row,
            ),
          );
          return yield* view(updated);
        }),
      )
      .handle("listBatches", ({ params }) =>
        Effect.gen(function* () {
          yield* find(params.automationId);
          const rows = yield* Ref.get(batchesRef);
          return rows.filter((row) => row.automationId === params.automationId);
        }),
      )
      .handle("cancelBatch", ({ params }) =>
        Effect.gen(function* () {
          yield* find(params.automationId);
          return yield* setBatchStatus(params.batchId, "cancelled");
        }),
      )
      .handle("flushBatch", ({ params }) =>
        Effect.gen(function* () {
          yield* find(params.automationId);
          return yield* setBatchStatus(params.batchId, "flushed");
        }),
      )
      .handle("delete", ({ params }) =>
        Effect.gen(function* () {
          yield* find(params.automationId);
          yield* Ref.update(automations, (rows) =>
            rows.filter((row) => row.id !== params.automationId),
          );
          return { ok: true };
        }),
      )
      .handle("disable", ({ params }) => setEnabled(params.automationId, false))
      .handle("enable", ({ params }) => setEnabled(params.automationId, true))
      .handle("restore", ({ params }) =>
        Effect.gen(function* () {
          yield* find(params.automationId);
          return {
            ok: true,
            id: params.automationId,
            restoredAt: isoMinutesAgo(0),
          };
        }),
      )
      .handle("cancel", ({ params }) =>
        Effect.gen(function* () {
          yield* find(params.automationId);
          const rows = yield* Ref.get(runsRef);
          const run = rows.find((candidate) => candidate.id === params.runId);
          if (!run) {
            return yield* Effect.die(
              new Error(`automations.runs: no row ${params.runId}`),
            );
          }
          const cancelled = { ...run, status: "cancelled" as const };
          yield* Ref.set(
            runsRef,
            rows.map((candidate) =>
              candidate.id === run.id ? cancelled : candidate,
            ),
          );
          return cancelled;
        }),
      )
      .handle("trigger", ({ params, payload }) =>
        Effect.gen(function* () {
          const current = yield* find(params.automationId);
          const input = fields(payload);
          const run: AutomationRun = {
            id: newId("run"),
            automationId: current.id,
            status: "running",
            trigger: text(input.trigger) ?? "manual",
            startedAt: DateTime.formatIso(minutesAgo(0)),
            finishedAt: null,
            threadId: text(input.threadId) ?? null,
          };
          yield* Ref.update(runsRef, (rows) => [run, ...rows]);
          yield* Ref.update(automations, (rows) =>
            rows.map((row) =>
              row.id === current.id
                ? asStored({ ...row, lastRunAt: run.startedAt })
                : row,
            ),
          );
          return run;
        }),
      )
      .handle("usage", ({ params }) =>
        find(params.automationId).pipe(
          Effect.map(() => usage[params.automationId] ?? { ...defaultUsage }),
        ),
      )
      .handle("rotateWebhook", ({ params }) =>
        Effect.gen(function* () {
          const current = yield* find(params.automationId);
          const secret = `whsec_mock_${current.id}`;
          yield* Ref.update(webhookSecrets, (rows) => ({
            ...rows,
            [current.id]: secret,
          }));
          return {
            ok: true,
            webhookSecret: secret,
            rotatedAt: isoMinutesAgo(0),
          };
        }),
      );
  }),
);
