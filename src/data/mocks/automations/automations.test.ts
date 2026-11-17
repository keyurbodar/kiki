import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { ApiClient } from "../../client/ApiClient.ts";
import { orgId, people, projects } from "../fixtures/world.ts";

interface Automation {
  readonly id: string;
  readonly name: string;
  readonly enabled: boolean;
  readonly creatorUserId?: string;
  readonly createdAt?: string;
}

interface Run {
  readonly id: string;
  readonly automationId: string;
  readonly status: string;
}

const automationId = "auto_sample_deps";
const batchId = "batch_sample_deps";
const key = `automations:${orgId}`;

const listAtom = ApiClient.query("automations", "list", {
  params: { orgId },
  query: {},
  reactivityKeys: [key],
});
const getAtom = ApiClient.query("automations", "get", {
  params: { orgId, automationId },
  reactivityKeys: [key],
});
const create = ApiClient.mutation("automations", "create");
const enable = ApiClient.mutation("automations", "enable");
const disable = ApiClient.mutation("automations", "disable");

const values = (result: unknown) => result as ReadonlyArray<Automation>;

describe("automations mock", () => {
  it.effect("serves every read endpoint with useful data", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const read = <A>(atom: Parameters<typeof AtomRegistry.getResult>[1]) =>
        AtomRegistry.getResult(registry, atom as never) as Effect.Effect<A>;

      const list = yield* read<ReadonlyArray<Automation>>(listAtom);
      const detail = yield* read<Automation>(getAtom);
      assert.isAbove(list.length, 0);
      assert.equal(detail.id, automationId);
      assert.isTrue(detail.enabled);

      const page = yield* read<{
        items: ReadonlyArray<Automation>;
        total: number;
      }>(
        ApiClient.query("automations", "listPage", {
          params: { orgId },
          query: {},
        }),
      );
      const batches = yield* read<
        ReadonlyArray<{ id: string; status: string }>
      >(
        ApiClient.query("automations", "listBatches", {
          params: { orgId, automationId },
          query: {},
        }),
      );
      const usage = yield* read<{ totalRuns: number }>(
        ApiClient.query("automations", "usage", {
          params: { orgId, automationId },
          query: {},
        }),
      );
      assert.isAbove(page.items.length, 0);
      assert.equal(page.total, list.length);
      for (const item of page.items) {
        assert.isString(item.createdAt);
        assert.isString(item.creatorUserId);
      }
      assert.include(
        page.items.map((item) => item.creatorUserId),
        people.alex.id,
      );
      assert.isAbove(batches.length, 0);
      assert.isAbove(usage.totalRuns, 0);
    }),
  );

  it.effect("applies mutations and refreshes automation queries", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      registry.mount(listAtom);
      registry.mount(getAtom);
      yield* AtomRegistry.getResult(registry, listAtom);

      registry.set(create, {
        params: { orgId },
        payload: {
          name: "Nightly accessibility check",
          projectId: projects.web.id,
          trigger: { kind: "schedule", cron: "0 3 * * *", timezone: "UTC" },
        },
        reactivityKeys: [key],
      });
      const created = (yield* AtomRegistry.getResult(
        registry,
        create,
      )) as Automation;
      assert.include(
        values(
          yield* AtomRegistry.getResult(registry, listAtom, {
            suspendOnWaiting: true,
          }),
        ).map((row) => row.id),
        created.id,
      );

      registry.set(disable, {
        params: { orgId, automationId },
        reactivityKeys: [key],
      });
      yield* AtomRegistry.getResult(registry, disable);
      const disabled = (yield* AtomRegistry.getResult(registry, getAtom, {
        suspendOnWaiting: true,
      })) as Automation;
      assert.isFalse(disabled.enabled);

      registry.set(enable, {
        params: { orgId, automationId },
        reactivityKeys: [key],
      });
      yield* AtomRegistry.getResult(registry, enable);
      const enabled = (yield* AtomRegistry.getResult(registry, getAtom, {
        suspendOnWaiting: true,
      })) as Automation;
      assert.isTrue(enabled.enabled);

      const atom = (endpoint: string) =>
        ApiClient.mutation("automations" as never, endpoint as never);
      const mutate = <A>(
        mutation: ReturnType<typeof atom>,
        request: unknown,
      ) => {
        registry.set(mutation, request as never);
        return AtomRegistry.getResult(
          registry,
          mutation,
        ) as unknown as Effect.Effect<A>;
      };

      const updated = yield* mutate<Automation>(atom("update"), {
        params: { orgId, automationId },
        payload: { name: "Nightly dependency audit" },
        reactivityKeys: [key],
      });
      assert.equal(updated.name, "Nightly dependency audit");
      const run = yield* mutate<Run>(atom("trigger"), {
        params: { orgId, automationId },
        payload: { trigger: "manual" },
        reactivityKeys: [key],
      });
      assert.equal(run.status, "running");

      const cancelled = yield* mutate<Run>(atom("cancel"), {
        params: { orgId, automationId, runId: run.id },
        reactivityKeys: [key],
      });
      assert.equal(cancelled.status, "cancelled");
      const batch = yield* mutate<{ id: string; status: string }>(
        atom("cancelBatch"),
        {
          params: { orgId, automationId, batchId },
          reactivityKeys: [key],
        },
      );
      assert.equal(batch.status, "cancelled");
      const flushed = yield* mutate<{ id: string; status: string }>(
        atom("flushBatch"),
        {
          params: { orgId, automationId, batchId },
          reactivityKeys: [key],
        },
      );
      assert.equal(flushed.status, "flushed");

      const rotated = yield* mutate<{ webhookSecret: string }>(
        atom("rotateWebhook"),
        { params: { orgId, automationId }, reactivityKeys: [key] },
      );
      assert.isNotEmpty(rotated.webhookSecret);
      const restored = yield* mutate<{ ok: boolean }>(atom("restore"), {
        params: { orgId, automationId },
        reactivityKeys: [key],
      });
      assert.isTrue(restored.ok);
      const removed = yield* mutate<{ ok: boolean }>(atom("delete"), {
        params: { orgId, automationId: created.id },
        reactivityKeys: [key],
      });
      assert.isTrue(removed.ok);
      assert.notInclude(
        values(
          yield* AtomRegistry.getResult(registry, listAtom, {
            suspendOnWaiting: true,
          }),
        ).map((row) => row.id),
        created.id,
      );
    }),
  );
});

describe("automation editor fields", () => {
  it.effect("keeps the fields the client sends and echoes them", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const create = ApiClient.mutation("automations", "create");
      registry.set(create, {
        params: { orgId },
        payload: {
          name: "Nightly triage",
          description: "Runs after the on-call handover.",
          prompt: "Read new issues, group them and post a summary.",
          projectId: "proj_sample_web",
          enabled: false,
          triggers: [{ type: "schedule", cron: "0 3 * * *", timezone: "UTC" }],
          threadMode: "single",
          singleJamId: "jam_sample_0001",
          runAsKind: "service",
          runAsId: "svc_sample_release",
          slackImpersonation: true,
          quietSlackPosts: true,
          maxRunsPerDay: 4,
          machineSize: "medium",
          model: { id: "anthropic/claude-opus", reasoning: "high" },
          organize: { pin: true, tags: ["tag_sample_urgent"] },
          creator: "Sam Rivera",
          creatorUserId: people.sam.id,
        },
        reactivityKeys: [],
      } as never);
      const created = (yield* AtomRegistry.getResult(registry, create)) as {
        id: string;
        description: string | null;
        prompt: string;
        triggers: ReadonlyArray<{
          type?: string;
          cron?: string;
          timezone?: string;
        }>;
        threadMode: string;
        singleJamId: string | null;
        runAsKind: string;
        runAsId: string;
        maxRunsPerDay: number | null;
        creator: string;
      };
      assert.strictEqual(
        created.prompt,
        "Read new issues, group them and post a summary.",
      );
      assert.strictEqual(created.threadMode, "single");
      assert.strictEqual(created.singleJamId, "jam_sample_0001");
      assert.strictEqual(created.runAsKind, "service");
      assert.strictEqual(created.runAsId, "svc_sample_release");
      assert.strictEqual(created.maxRunsPerDay, 4);
      assert.strictEqual(created.creator, "Sam Rivera");
      assert.deepStrictEqual(created.triggers, [
        { type: "schedule", cron: "0 3 * * *", timezone: "UTC" },
      ]);

      const update = ApiClient.mutation("automations", "update");
      registry.set(update, {
        params: { orgId, automationId: created.id },
        payload: {
          prompt: "Post a shorter summary.",
          triggers: [{ type: "github", event: "pull_request.opened" }],
          threadMode: "new",
          singleJamId: null,
        },
        reactivityKeys: [],
      } as never);
      const updated = (yield* AtomRegistry.getResult(registry, update)) as {
        prompt: string;
        triggers: ReadonlyArray<{ type?: string; event?: string }>;
        threadMode: string;
        singleJamId: string | null;
      };
      assert.strictEqual(updated.prompt, "Post a shorter summary.");
      assert.strictEqual(updated.threadMode, "new");
      assert.isNull(updated.singleJamId);
      assert.deepStrictEqual(updated.triggers, [
        { type: "github", event: "pull_request.opened" },
      ]);
    }),
  );
});
