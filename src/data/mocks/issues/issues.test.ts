import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { type AsyncResult, type Atom, AtomRegistry } from "effect/reactivity";
import { ApiClient } from "../../client/ApiClient.ts";
import { orgId, people, threads } from "../fixtures/world.ts";

interface Issue {
  readonly id: string;
  readonly number: number;
  readonly code: string;
  readonly title: string;
  readonly stateId: string;
}

const key = `issues:${orgId}`;
const listQuery = ApiClient.query("issues", "list", {
  params: { orgId },
  query: {},
  reactivityKeys: [key],
});
const create = ApiClient.mutation("issues", "create");
const update = ApiClient.mutation("issues", "update");
const setPrefix = ApiClient.mutation("issues", "setPrefix");

const codes = (value: unknown) =>
  (value as ReadonlyArray<Issue>).map((issue) => issue.code);

const titles = (value: unknown) =>
  (value as ReadonlyArray<Issue>).map((issue) => issue.title);

describe("issues mock", () => {
  it.effect("every read endpoint returns sensible data", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const read = <A, E>(
        atom: Atom.Atom<AsyncResult.AsyncResult<A, E>>,
      ): Effect.Effect<A, E> => AtomRegistry.getResult(registry, atom);

      const list = yield* read(listQuery);
      assert.isAbove((list as ReadonlyArray<Issue>).length, 0);
      assert.isTrue(codes(list).includes("ACME-1"));

      const issue = (list as ReadonlyArray<Issue>)[0];
      assert.isDefined(issue);
      const detail = yield* read(
        ApiClient.query("issues", "get", {
          params: { orgId, code: issue?.code ?? "ACME-1" },
        }),
      );
      assert.equal((detail as Issue).code, issue?.code);

      const prefix = yield* read(
        ApiClient.query("issues", "prefix", { params: { orgId } }),
      );
      assert.equal((prefix as { prefix: string }).prefix, "ACME");

      const states = yield* read(
        ApiClient.query("issues", "states", { params: { orgId } }),
      );
      assert.isAbove((states as ReadonlyArray<unknown>).length, 0);

      const counts = yield* read(
        ApiClient.query("issues", "stateCounts", { params: { orgId } }),
      );
      assert.isAbove(Object.keys(counts as object).length, 0);

      const summaries = yield* read(
        ApiClient.query("issues", "summariesByCode", {
          params: { orgId },
          query: { search: "checkout" },
        }),
      );
      assert.isAbove((summaries as ReadonlyArray<unknown>).length, 0);

      const summary = yield* read(
        ApiClient.query("issues", "summary", {
          params: { orgId, issueId: issue?.id ?? "iss_sample_1" },
        }),
      );
      assert.equal((summary as { code: string }).code, issue?.code);

      const relations = yield* read(
        ApiClient.query("issues", "relations", {
          params: { orgId, code: "ACME-2" },
          query: {},
        }),
      );
      assert.isAbove((relations as ReadonlyArray<unknown>).length, 0);

      const fileUrl = yield* read(
        ApiClient.query("issues", "fileUrl", {
          params: {
            orgId,
            code: issue?.code ?? "ACME-1",
            fileId: "file_sample_spec",
          },
          query: {},
        }),
      );
      assert.include((fileUrl as { url: string }).url, "files.example.com");

      const assignedCount = yield* read(
        ApiClient.query("issues", "assignedCount", {
          params: { orgId },
          query: { userId: people.alex.id },
        }),
      );
      assert.isAbove(assignedCount as number, 0);

      const mentionCount = yield* read(
        ApiClient.query("issues", "mentionCount", {
          params: { orgId },
          query: { userId: people.alex.id },
        }),
      );
      assert.isAtLeast(mentionCount as number, 0);

      const activity = yield* read(
        ApiClient.query("issues", "captainActivity", {
          params: { orgId, jamId: "jam_sample_cap1" },
        }),
      );
      assert.isAbove(
        (activity as { items: ReadonlyArray<Issue> }).items.length,
        0,
      );

      const cursorPage = yield* read(
        ApiClient.query("issues", "list", {
          params: { orgId },
          query: { cursor: "first" },
        }),
      );
      assert.isAbove(
        (cursorPage as { items: ReadonlyArray<Issue> }).items.length,
        0,
      );

      const byPull = yield* read(
        ApiClient.query("issues", "byPull", {
          params: { orgId, pullId: "pr_sample_119" },
        }),
      );
      assert.isAbove((byPull as ReadonlyArray<Issue>).length, 0);
    }),
  );

  it.effect("create, update and state mutations refresh the list", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      registry.mount(listQuery);
      yield* AtomRegistry.getResult(registry, listQuery);

      registry.set(create, {
        params: { orgId },
        payload: { title: "Audit checkout retries", priority: "high" },
        reactivityKeys: [key],
      });
      const created = yield* AtomRegistry.getResult(registry, create);
      const afterCreate = yield* AtomRegistry.getResult(registry, listQuery, {
        suspendOnWaiting: true,
      });
      assert.include(codes(afterCreate), (created as Issue).code);
      assert.include(titles(afterCreate), "Audit checkout retries");

      registry.set(update, {
        params: { orgId, code: (created as Issue).code },
        payload: { title: "Audit checkout timeouts" },
        reactivityKeys: [key],
      });
      yield* AtomRegistry.getResult(registry, update);
      const afterUpdate = yield* AtomRegistry.getResult(registry, listQuery, {
        suspendOnWaiting: true,
      });
      assert.include(titles(afterUpdate), "Audit checkout timeouts");

      registry.set(setPrefix, {
        params: { orgId },
        payload: { prefix: "QA" },
        reactivityKeys: [key],
      });
      const prefix = yield* AtomRegistry.getResult(registry, setPrefix);
      assert.deepStrictEqual(prefix, { prefix: "QA" });
    }),
  );

  it.effect("issue comment, link, relation and state mutations work", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const mutate = <A, E, Args>(
        endpoint:
          | "comment"
          | "createState"
          | "updateState"
          | "reorderStates"
          | "link"
          | "unlink"
          | "relate"
          | "unrelate"
          | "markSeen"
          | "markUnread"
          | "setSubscription",
        args: Args,
      ) => {
        const atom = ApiClient.mutation("issues", endpoint);
        registry.set(atom, args as never);
        return AtomRegistry.getResult(registry, atom) as Effect.Effect<A, E>;
      };

      const posted = yield* mutate<{ id: string }, never, unknown>("comment", {
        params: { orgId, code: "ACME-2" },
        payload: { body: "Added a regression test." },
      });
      assert.isString(posted.id);

      const state = yield* mutate<{ id: string }, never, unknown>(
        "createState",
        {
          params: { orgId },
          payload: { name: "Blocked", category: "started", color: "warning" },
        },
      );
      const stateId = state.id;

      const renamed = yield* mutate<{ name: string }, never, unknown>(
        "updateState",
        {
          params: { orgId, stateId },
          payload: { name: "Blocked on review" },
        },
      );
      assert.equal(renamed.name, "Blocked on review");

      const reordered = yield* mutate<
        ReadonlyArray<{ id: string }>,
        never,
        unknown
      >("reorderStates", {
        params: { orgId },
        payload: { stateIds: [stateId] },
      });
      assert.equal(reordered[0]?.id, stateId);

      const link = yield* mutate<{ id: string }, never, unknown>("link", {
        params: { orgId, code: "ACME-2" },
        payload: { url: "https://example.com/spec", title: "Spec" },
      });
      const unlinked = yield* mutate<{ ok: boolean }, never, unknown>(
        "unlink",
        {
          params: { orgId, code: "ACME-2" },
          query: { linkId: link.id },
        },
      );
      assert.isTrue(unlinked.ok);

      const relation = yield* mutate<{ id: string }, never, unknown>("relate", {
        params: { orgId, code: "ACME-2" },
        payload: { relatedCode: "ACME-3", kind: "related" },
      });
      const unrelate = yield* mutate<{ ok: boolean }, never, unknown>(
        "unrelate",
        {
          params: { orgId, code: "ACME-2" },
          query: { relationId: relation.id },
        },
      );
      assert.isTrue(unrelate.ok);

      const seen = yield* mutate<{ ok: boolean }, never, unknown>("markSeen", {
        params: { orgId, code: "ACME-2" },
      });
      assert.isTrue(seen.ok);
      const unread = yield* mutate<{ ok: boolean }, never, unknown>(
        "markUnread",
        {
          params: { orgId, code: "ACME-2" },
        },
      );
      assert.isTrue(unread.ok);
      const subscription = yield* mutate<
        { subscribed: boolean },
        never,
        unknown
      >("setSubscription", {
        params: { orgId, code: "ACME-2" },
        payload: { subscribed: true },
      });
      assert.isTrue(subscription.subscribed);

      assert.equal(threads.checkoutTest.number, 41);
    }),
  );
});
