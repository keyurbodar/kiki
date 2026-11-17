import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { OrgId } from "../../api/schemas/ids.ts";
import { ApiClient } from "../../client/ApiClient.ts";
import { orgId, threads, world } from "../fixtures/world.ts";

const org = OrgId.make(orgId);
const key = `jams:${orgId}`;
const jamId = threads.checkoutTest.id;
const otherJamId = threads.darkMode.id;
const toolCallId = "tool_sample_feedback_1";

interface Thread {
  readonly id: string;
  readonly title: string | null;
  readonly threadNumber: number | null;
}

interface Named {
  readonly id: string;
  readonly code?: string;
  readonly state?: string;
}

const listAtom = ApiClient.query("jams", "list", {
  params: { orgId: org },
  query: {},
  reactivityKeys: [key],
});
const asksAtom = ApiClient.query("jams", "asks", {
  params: { orgId: org },
  query: {},
  reactivityKeys: [key],
});
const countsAtom = ApiClient.query("jams", "counts", {
  params: { orgId: org },
  query: {},
  reactivityKeys: [key],
});

const isNonEmpty = (value: unknown) =>
  Array.isArray(value)
    ? value.length > 0
    : value !== undefined && value !== null;

const mutate = (
  endpoint: string,
  request: object,
  registry: ReturnType<typeof AtomRegistry.make>,
) => {
  const atom = ApiClient.mutation("jams", endpoint as never);
  registry.set(atom, { ...request, reactivityKeys: [key] } as never);
  return AtomRegistry.getResult(registry, atom);
};

describe("jams mock", () => {
  it.effect("serves every read endpoint with sensible data", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const requests: ReadonlyArray<readonly [string, object]> = [
        ["organization", { params: { jamId } }],
        ["list", { params: { orgId: org }, query: {} }],
        ["get", { params: { orgId: org, jamId } }],
        ["threadAccessRequests", { params: { orgId: org, jamId } }],
        ["ad", { params: { orgId: org, jamId } }],
        ["listEnvironmentVariables", { params: { orgId: org, jamId } }],
        ["threadIssues", { params: { orgId: org, jamId } }],
        ["usage", { params: { orgId: org, jamId } }],
        ["asks", { params: { orgId: org }, query: {} }],
        ["counts", { params: { orgId: org }, query: {} }],
      ];
      const results = yield* Effect.all(
        requests.map(([endpoint, request]) =>
          AtomRegistry.getResult(
            registry,
            endpoint === "list"
              ? listAtom
              : endpoint === "asks"
                ? asksAtom
                : endpoint === "counts"
                  ? countsAtom
                  : ApiClient.query(
                      "jams",
                      endpoint as never,
                      {
                        ...request,
                        reactivityKeys: [key],
                      } as never,
                    ),
          ).pipe(Effect.map((result) => [endpoint, result] as const)),
        ),
      );
      for (const [endpoint, result] of results) {
        assert.isTrue(isNonEmpty(result), `${endpoint} returned no data`);
      }
      const page = yield* AtomRegistry.getResult(registry, listAtom);
      assert.deepStrictEqual(
        page.items.map((thread) => thread.threadNumber),
        [41, 40, 39, 38, 37, 36],
      );
      const counts = yield* AtomRegistry.getResult(registry, countsAtom);
      assert.strictEqual((counts as { readonly total: number }).total, 7);
      assert.strictEqual((counts as { readonly asks: number }).asks, 1);
      const issues = yield* AtomRegistry.getResult(
        registry,
        ApiClient.query("jams", "threadIssues", {
          params: { orgId: org, jamId },
          reactivityKeys: [key],
        }),
      );
      const issueRows = issues as ReadonlyArray<Named>;
      assert.isTrue(issueRows.length > 0);
      assert.isTrue(
        issueRows.every((issue) => issue.code?.startsWith("ACME-") === true),
      );
    }),
  );

  it.effect("calls every remaining endpoint and keeps mutations reactive", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      registry.mount(listAtom);
      registry.mount(asksAtom);
      registry.mount(countsAtom);
      const before = yield* AtomRegistry.getResult(registry, listAtom);
      const created = yield* mutate(
        "createProjectless",
        {
          params: { orgId: org },
          payload: { title: "Investigate the retry budget" },
        },
        registry,
      );
      const afterCreate = yield* AtomRegistry.getResult(registry, listAtom, {
        suspendOnWaiting: true,
      });
      assert.isTrue(
        afterCreate.items.some(
          (thread) => thread.title === "Investigate the retry budget",
        ),
      );

      const createdId = (created as Thread).id;
      const renamed = yield* mutate(
        "rename",
        {
          params: { orgId: org, jamId: createdId },
          payload: { title: "Tune the retry budget" },
        },
        registry,
      );
      assert.strictEqual((renamed as Thread).title, "Tune the retry budget");

      const deleted = yield* mutate(
        "delete",
        { params: { orgId: org }, payload: { jamIds: [createdId] } },
        registry,
      );
      assert.isTrue((deleted as { readonly ok: boolean }).ok);
      const afterDelete = yield* AtomRegistry.getResult(registry, listAtom, {
        suspendOnWaiting: true,
      });
      assert.deepStrictEqual(
        afterDelete.items.map((thread) => thread.threadNumber),
        before.items.map((thread) => thread.threadNumber),
      );

      yield* mutate(
        "create",
        {
          params: { orgId: org, projectId: world.projects.api.id },
          payload: { title: "Draft the usage report" },
        },
        registry,
      );
      yield* mutate(
        "setThreadAccess",
        {
          params: { orgId: org, jamId },
          payload: { policy: "org", memberIds: [world.people.alex.id] },
        },
        registry,
      );
      yield* mutate(
        "requestThreadAccess",
        { params: { orgId: org, jamId: otherJamId } },
        registry,
      );
      yield* mutate(
        "declineThreadAccessRequest",
        {
          params: {
            orgId: org,
            jamId: otherJamId,
            userId: world.people.jordan.id,
          },
        },
        registry,
      );
      yield* mutate(
        "setCompactAt",
        {
          params: { orgId: org, jamId },
          payload: { compactAt: "2026-03-02T08:00:00.000Z" },
        },
        registry,
      );
      yield* mutate(
        "retryConnection",
        { params: { orgId: org, jamId }, payload: { provider: "openai" } },
        registry,
      );
      yield* mutate(
        "readConnectionUsage",
        { params: { orgId: org, jamId }, payload: { provider: "openai" } },
        registry,
      );
      yield* mutate(
        "answerCredits",
        {
          params: { orgId: org, jamId },
          payload: { amount: 1000, reason: "Approved by the owner" },
        },
        registry,
      );
      yield* mutate(
        "revokeCredits",
        { params: { orgId: org, jamId } },
        registry,
      );
      yield* mutate(
        "desktopRequestDone",
        {
          params: {
            orgId: org,
            jamId: otherJamId,
            toolCallId: "tool_sample_desktop_1",
          },
        },
        registry,
      );
      yield* mutate(
        "setEnvironmentVariables",
        {
          params: { orgId: org, jamId },
          payload: { LOG_LEVEL: "debug", FEATURE_FLAG: "on" },
        },
        registry,
      );
      yield* mutate(
        "deleteEnvironmentVariable",
        { params: { orgId: org, jamId, name: "LOG_LEVEL" } },
        registry,
      );
      yield* mutate(
        "refreshEnvironment",
        { params: { orgId: org, jamId } },
        registry,
      );
      yield* mutate(
        "feedbackRequestDecline",
        { params: { orgId: org, jamId, toolCallId } },
        registry,
      );
      yield* mutate(
        "feedbackRequestSend",
        {
          params: { orgId: org, jamId, toolCallId: "tool_sample_feedback_2" },
        },
        registry,
      );
      yield* mutate(
        "fork",
        {
          params: { orgId: org, jamId },
          payload: { title: "Fork of checkout retry" },
        },
        registry,
      );
      yield* mutate(
        "setThreadIssues",
        {
          params: { orgId: org, jamId },
          payload: { issueIds: [world.threads.checkoutTest.id] },
        },
        registry,
      );
      yield* mutate("joinThread", { params: { orgId: org, jamId } }, registry);
      yield* mutate(
        "setJoinPolicy",
        { params: { orgId: org, jamId }, payload: { policy: "invite" } },
        registry,
      );
      yield* mutate("leaveThread", { params: { orgId: org, jamId } }, registry);
      yield* mutate(
        "inviteThreadMembers",
        {
          params: { orgId: org, jamId },
          payload: { userIds: [world.people.priya.id] },
        },
        registry,
      );
      yield* mutate(
        "removeThreadMembers",
        {
          params: { orgId: org, jamId },
          query: { userIds: [world.people.priya.id] },
        },
        registry,
      );
      yield* mutate(
        "setThreadOwner",
        {
          params: { orgId: org, jamId },
          payload: { userId: world.people.sam.id },
        },
        registry,
      );
      yield* mutate(
        "read",
        { params: { orgId: org, jamId }, payload: {} },
        registry,
      );
      yield* mutate(
        "regenerateTitle",
        { params: { orgId: org, jamId } },
        registry,
      );
      yield* mutate("settle", { params: { orgId: org, jamId } }, registry);
      yield* mutate(
        "createSideThread",
        {
          params: { orgId: org, jamId },
          payload: { title: "Follow up on retries" },
        },
        registry,
      );
      yield* mutate(
        "linkSlack",
        {
          params: { orgId: org, jamId },
          payload: { channelId: "C_SAMPLE_WEB", channelName: "web-releases" },
        },
        registry,
      );
      yield* mutate(
        "setSlackActive",
        { params: { orgId: org, jamId }, payload: { active: false } },
        registry,
      );
      yield* mutate("takeover", { params: { orgId: org, jamId } }, registry);
      yield* mutate(
        "terminalRequestDone",
        {
          params: { orgId: org, jamId, toolCallId: "tool_sample_terminal_1" },
        },
        registry,
      );
      yield* mutate("unread", { params: { orgId: org, jamId } }, registry);
      yield* mutate("unsettle", { params: { orgId: org, jamId } }, registry);
      yield* mutate(
        "unsubscribeThread",
        { params: { orgId: org, jamId } },
        registry,
      );
      yield* mutate(
        "archive",
        {
          params: { orgId: org },
          payload: { jamIds: [world.threads.bundler.id] },
        },
        registry,
      );
      const asksBefore = (yield* AtomRegistry.getResult(
        registry,
        asksAtom,
      )) as {
        readonly items: ReadonlyArray<Named>;
      };
      assert.strictEqual(asksBefore.items.length, 2);
      yield* mutate(
        "dismissAsks",
        { params: { orgId: org }, payload: { ids: ["ask_sample_org_1"] } },
        registry,
      );
      const asksAfterDismiss = (yield* AtomRegistry.getResult(
        registry,
        asksAtom,
        {
          suspendOnWaiting: true,
        },
      )) as { readonly items: ReadonlyArray<Named> };
      assert.isTrue(
        asksAfterDismiss.items.every((ask) => ask.state !== "open"),
      );
      yield* mutate(
        "reopenAsks",
        { params: { orgId: org }, payload: { ids: ["ask_sample_org_1"] } },
        registry,
      );
      const asksAfterReopen = (yield* AtomRegistry.getResult(
        registry,
        asksAtom,
        {
          suspendOnWaiting: true,
        },
      )) as { readonly items: ReadonlyArray<Named> };
      assert.isTrue(asksAfterReopen.items.some((ask) => ask.state === "open"));
      yield* mutate("readAll", { params: { orgId: org } }, registry);
      yield* mutate(
        "unarchive",
        {
          params: { orgId: org },
          payload: { jamIds: [world.threads.bundler.id] },
        },
        registry,
      );
      yield* mutate(
        "restore",
        {
          params: { orgId: org },
          payload: { jamIds: [world.threads.bundler.id] },
        },
        registry,
      );
      const countsAfter = (yield* AtomRegistry.getResult(registry, countsAtom, {
        suspendOnWaiting: true,
      })) as { readonly total: number };
      assert.isTrue(countsAfter.total > 0);
    }),
  );
});
