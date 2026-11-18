import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { InvalidRequest, JamNotFound } from "../../api/schemas/errors.ts";
import { JamId, OrgId } from "../../api/schemas/ids.ts";
import { ApiClient } from "../../client/ApiClient.ts";
import { captains, orgId, threads, world } from "../fixtures/world.ts";

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

describe("a Captain's jam id", () => {
  const detail = (jamId: string) =>
    ApiClient.query("jams", "get", {
      params: { orgId: org, jamId: JamId.make(jamId) },
      reactivityKeys: [key],
    });

  it.effect("opens through jams.get with its project and membership", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      for (const captain of captains) {
        const found = (yield* AtomRegistry.getResult(
          registry,
          detail(captain.id),
        )) as {
          id: string;
          title: string | null;
          projectId: string | null;
          membership: { members: ReadonlyArray<{ userId: string }> };
        };
        assert.equal(found.id, captain.id);
        assert.equal(found.title, captain.name);
        assert.equal(found.projectId, captain.projectId);
        assert.include(
          found.membership.members.map((member) => member.userId),
          captain.ownerId,
        );
      }
    }),
  );

  it.effect(
    "never appears in jams.list, which leaves Captains to the Captain list",
    () =>
      Effect.gen(function* () {
        const registry = AtomRegistry.make();
        const page = (yield* AtomRegistry.getResult(registry, listAtom)) as {
          items: ReadonlyArray<Thread>;
        };
        const captainIds = new Set(captains.map((captain) => captain.id));
        assert.deepStrictEqual(
          page.items
            .filter((thread) => captainIds.has(thread.id))
            .map((t) => t.id),
          [],
        );
        assert.strictEqual(page.items.length, 10);
      }),
  );
});

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
        [41, 48, 40, 47, 46, 39, 38, 45, 37, 36],
      );
      const counts = yield* AtomRegistry.getResult(registry, countsAtom);
      assert.strictEqual(counts.pinned, 2);
      assert.deepStrictEqual(
        counts.folders.map((folder) => [folder.folderId, folder.count]),
        [
          ["fld_sample_release", 2],
          ["fld_sample_research", 1],
        ],
      );
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
      assert.deepStrictEqual(
        (deleted as { readonly outcomes: unknown }).outcomes,
        [{ jamId: createdId, outcome: "ok" }],
      );
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
      const countsAfter = yield* AtomRegistry.getResult(registry, countsAtom, {
        suspendOnWaiting: true,
      });
      assert.isTrue(countsAfter.pinned > 0);
    }),
  );

  it.effect(
    "records the machineSize /new's footer menu sends on both creates",
    () =>
      Effect.gen(function* () {
        const recorded = (created: unknown) =>
          (created as { readonly machineSize?: string | null }).machineSize;
        const start = (
          endpoint: "create" | "createProjectless",
          params: object,
          payload: object,
        ) =>
          Effect.gen(function* () {
            const registry = AtomRegistry.make();
            const atom = ApiClient.mutation("jams", endpoint);
            registry.set(atom, {
              params,
              payload,
              reactivityKeys: [key],
            } as never);
            return yield* AtomRegistry.getResult(registry, atom, {
              suspendOnWaiting: true,
            });
          });
        const startProjectless = (payload: object) =>
          start("createProjectless", { orgId: org }, payload);
        const startInProject = (payload: object) =>
          start(
            "create",
            { orgId: org, projectId: world.projects.api.id },
            payload,
          );

        const projectlessLarge = yield* startProjectless({
          title: "Ship the footer on a large machine",
          machineSize: "large",
        });
        assert.strictEqual(recorded(projectlessLarge), "large");

        const projectLarge = yield* startInProject({
          title: "Ship the footer on a large machine",
          machineSize: "large",
        });
        assert.strictEqual(recorded(projectLarge), "large");

        const projectlessDefault = yield* startProjectless({
          title: "Ship the footer on the default machine",
        });
        assert.strictEqual(recorded(projectlessDefault), null);

        const projectDefault = yield* startInProject({
          title: "Ship the footer on the default machine",
        });
        assert.strictEqual(recorded(projectDefault), null);

        const projectlessUnknown = yield* startProjectless({
          title: "Ship the footer on an unknown machine",
          machineSize: 8,
        });
        assert.strictEqual(recorded(projectlessUnknown), null);
      }),
  );

  it.effect("answers JamNotFound for a jam the world does not have", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const missing = ApiClient.query("jams", "get", {
        params: { orgId: org, jamId: JamId.make("jam_nobody") },
        reactivityKeys: [key],
      });
      const error = yield* AtomRegistry.getResult(
        registry,
        missing as never,
      ).pipe(Effect.flip);
      assert.instanceOf(error, JamNotFound);
    }),
  );

  it.effect("opens a thread that has no seeded access row", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      // Only a handful of the world's threads carry a seeded access row; the
      // rest must still open rather than answer a server error.
      const unseeded = threads.bundler.id;
      const access = ApiClient.query("jams", "get", {
        params: { orgId: org, jamId: JamId.make(unseeded) },
        reactivityKeys: [key],
      });
      const result = yield* AtomRegistry.getResult(registry, access as never, {
        suspendOnWaiting: true,
      });
      assert.isNotNull(result);
    }),
  );

  it.effect("rejects an unknown access policy with the declared 400", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const setAccess = ApiClient.mutation("jams", "setThreadAccess");
      registry.set(setAccess as never, {
        params: { orgId: org, jamId: JamId.make(jamId) },
        payload: { policy: "nobody" },
      });
      const error = yield* AtomRegistry.getResult(
        registry,
        setAccess as never,
      ).pipe(Effect.flip);
      assert.instanceOf(error, InvalidRequest);
    }),
  );

  it.effect("gives a side thread the crew index Capy paints it with", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const createSide = ApiClient.mutation("jams", "createSideThread");
      registry.set(createSide as never, {
        params: { orgId: org, jamId: JamId.make(jamId) },
        payload: { title: "Crew index probe" },
      });
      const side = (yield* AtomRegistry.getResult(
        registry,
        createSide as never,
        { suspendOnWaiting: true },
      )) as { readonly localIndex?: number | null };
      assert.isNumber(side.localIndex);
      assert.isAtLeast(side.localIndex as number, 1);
    }),
  );
});
