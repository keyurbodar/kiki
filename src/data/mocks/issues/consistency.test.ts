import { assert, describe, it } from "@effect/vitest";
import { DateTime, Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import type { OrgId } from "../../api/schemas/ids.ts";
import { issueAtom } from "../../atoms/issues.ts";
import { ApiClient } from "../../client/ApiClient.ts";
import { fixtureNow } from "../fixtures/time.ts";
import { people, orgId as worldOrgId } from "../fixtures/world.ts";

const orgId = worldOrgId as OrgId;

const run = <A>(
  registry: AtomRegistry.AtomRegistry,
  endpoint: string,
  args: unknown,
) => {
  const atom = ApiClient.mutation("issues", endpoint as "update");
  registry.set(atom, args as never);
  return AtomRegistry.getResult(registry, atom, {
    suspendOnWaiting: true,
  }) as unknown as Effect.Effect<A>;
};

const query = <A>(
  registry: AtomRegistry.AtomRegistry,
  endpoint: string,
  args: unknown,
) =>
  AtomRegistry.getResult(
    registry,
    ApiClient.query("issues", endpoint as "list", args as never),
  ) as unknown as Effect.Effect<A>;

describe("issues mock: filters and consistency", () => {
  it.effect("list filters by state, assignee and search", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const codes = (value: { issues: ReadonlyArray<{ code: string }> }) =>
        value.issues.map((issue) => issue.code);
      const searched = yield* query<{
        issues: ReadonlyArray<{ code: string }>;
      }>(registry, "list", {
        params: { orgId },
        query: { search: "checkout" },
      });
      assert.deepStrictEqual(codes(searched), ["ACME-2"]);
      const byState = yield* query<{ issues: ReadonlyArray<{ code: string }> }>(
        registry,
        "list",
        { params: { orgId }, query: { stateId: "ist_sample_in_progress" } },
      );
      assert.deepStrictEqual(codes(byState), ["ACME-1", "ACME-2"]);
      const byAssignee = yield* query<{
        issues: ReadonlyArray<{ code: string }>;
      }>(registry, "list", {
        params: { orgId },
        query: { assigneeId: people.sam.id, search: "dark" },
      });
      assert.deepStrictEqual(codes(byAssignee), ["ACME-3"]);
    }),
  );

  it.effect("a saved prefix applies to new codes and the list", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      yield* run(registry, "setPrefix", {
        params: { orgId },
        payload: { prefix: "QA" },
      });
      const created = yield* run<{ issue: { code: string } }>(
        registry,
        "create",
        {
          params: { orgId },
          payload: { projectId: "proj_sample_web", title: "Audit retries" },
        },
      );
      assert.strictEqual(created.issue.code, "QA-10");
      const list = yield* query<{ prefix: string }>(registry, "list", {
        params: { orgId },
        query: {},
      });
      assert.strictEqual(list.prefix, "QA");
    }),
  );

  it.effect("byPull falls back to issues on the pull's thread", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const issues = yield* query<ReadonlyArray<{ code: string }>>(
        registry,
        "byPull",
        { params: { orgId, pullId: "pr_sample_131" } },
      );
      assert.deepStrictEqual(
        issues.map((issue) => issue.code),
        ["ACME-2"],
      );
    }),
  );

  it.effect("relate replaces a relation stored on the other issue", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const related = yield* run<{
        relations: ReadonlyArray<{ relation: string; issue: { code: string } }>;
      }>(registry, "relate", {
        params: { orgId, code: "ACME-1" },
        payload: { relation: "related", issue: "ACME-2" },
      });
      assert.deepStrictEqual(
        related.relations
          .filter((relation) => relation.issue.code === "ACME-2")
          .map((relation) => relation.relation),
        ["related"],
      );
    }),
  );

  it.effect("posted comments keep their own date", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const comment = yield* run<{ createdAt: DateTime.Utc }>(
        registry,
        "comment",
        {
          params: { orgId, code: "ACME-9" },
          payload: { body: "Archived the old domain." },
        },
      );
      assert.isTrue(DateTime.Equivalence(comment.createdAt, fixtureNow));
      yield* run(registry, "update", {
        params: { orgId, code: "ACME-9" },
        payload: { title: "Retire the old site" },
      });
      const detail = yield* AtomRegistry.getResult(
        registry,
        issueAtom(orgId, "ACME-9"),
      );
      assert.isTrue(
        DateTime.Equivalence(
          detail.comments.at(-1)?.createdAt ?? fixtureNow,
          fixtureNow,
        ),
      );
    }),
  );

  it.effect("a built-in state moved to completed closes its issues", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      yield* run(registry, "updateState", {
        params: { orgId, stateId: "ist_sample_in_review" },
        payload: { category: "completed" },
      });
      const detail = yield* AtomRegistry.getResult(
        registry,
        issueAtom(orgId, "ACME-3"),
      );
      assert.strictEqual(detail.issue.status, "done");
    }),
  );

  it.effect("mentionCount counts the requested user", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const forAlex = yield* query<number>(registry, "mentionCount", {
        params: { orgId },
        query: { userId: people.alex.id },
      });
      const forCasey = yield* query<number>(registry, "mentionCount", {
        params: { orgId },
        query: { userId: people.casey.id },
      });
      assert.notStrictEqual(forAlex, forCasey);
    }),
  );
});
