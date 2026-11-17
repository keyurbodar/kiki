import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import type { OrgId } from "../../api/schemas/ids.ts";
import {
  issueAtom,
  issueReactivityKeys,
  issueStatesAtom,
  linkIssueAtom,
  relateIssueAtom,
  unrelateIssueAtom,
  updateIssueAtom,
} from "../../atoms/issues.ts";
import { orgId as worldOrgId } from "../fixtures/world.ts";

const orgId = worldOrgId as OrgId;
const keys = (code: string) => [issueReactivityKeys.issue(orgId, code)];

describe("issues mock", () => {
  it.effect(
    "decodes an issue's detail with parent, relations and threads",
    () =>
      Effect.gen(function* () {
        const registry = AtomRegistry.make();
        const detail = yield* AtomRegistry.getResult(
          registry,
          issueAtom(orgId, "ACME-2"),
        );
        assert.strictEqual(detail.issue.title, "Checkout test times out on CI");
        assert.strictEqual(detail.issue.status, "in_progress");
        assert.strictEqual(detail.parent?.code, "ACME-1");
        assert.deepStrictEqual(
          (detail.relations ?? []).map((r) => [r.relation, r.issue.code]),
          [
            ["blocks", "ACME-1"],
            ["related", "ACME-5"],
          ],
        );
        assert.strictEqual(detail.threads.length, 1);
        assert.strictEqual(detail.issue.dueAt, "2026-03-03");
      }),
  );

  it.effect("projects the org's states onto Capy's status icons", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const { states } = yield* AtomRegistry.getResult(
        registry,
        issueStatesAtom(orgId),
      );
      const review = states.find((state) => state.name === "In review");
      assert.deepStrictEqual(
        [review?.icon, review?.color],
        ["progress", "green"],
      );
      assert.strictEqual(
        states.find((state) => state.name === "Done")?.type,
        "closed",
      );
    }),
  );

  it.effect("updates status by status key, due date and description", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const atom = issueAtom(orgId, "ACME-4");
      registry.mount(atom);
      yield* AtomRegistry.getResult(registry, atom);
      registry.set(updateIssueAtom, {
        params: { orgId, code: "ACME-4" },
        payload: { status: "done", dueAt: "2026-04-01", description: "New" },
        reactivityKeys: keys("ACME-4"),
      });
      yield* AtomRegistry.getResult(registry, updateIssueAtom);
      const after = yield* AtomRegistry.getResult(registry, atom, {
        suspendOnWaiting: true,
      });
      assert.strictEqual(after.issue.status, "done");
      assert.strictEqual(after.issue.dueAt, "2026-04-01");
      assert.strictEqual(after.description, "New");

      registry.set(updateIssueAtom, {
        params: { orgId, code: "ACME-4" },
        payload: { dueAt: null },
        reactivityKeys: keys("ACME-4"),
      });
      const cleared = yield* AtomRegistry.getResult(registry, updateIssueAtom, {
        suspendOnWaiting: true,
      });
      assert.isUndefined(cleared.issue.dueAt);
    }),
  );

  it.effect("links a pull request by repo and number", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      registry.set(linkIssueAtom, {
        params: { orgId, code: "ACME-2" },
        payload: { ref: "acme/web#131" },
        reactivityKeys: keys("ACME-2"),
      });
      const linked = yield* AtomRegistry.getResult(registry, linkIssueAtom, {
        suspendOnWaiting: true,
      });
      assert.deepStrictEqual(
        linked.pulls.map((pull) => pull.prNumber),
        [131],
      );
      assert.strictEqual(linked.pulls[0]?.state, "draft");
    }),
  );

  it.effect("relates and unrelates issues on both sides", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      registry.set(relateIssueAtom, {
        params: { orgId, code: "ACME-6" },
        payload: { relation: "blocked_by", issue: "ACME-7" },
        reactivityKeys: keys("ACME-6"),
      });
      const related = yield* AtomRegistry.getResult(registry, relateIssueAtom, {
        suspendOnWaiting: true,
      });
      assert.deepStrictEqual(
        related.issue.blockedBy?.map((ref) => ref.code),
        ["ACME-7"],
      );
      const other = yield* AtomRegistry.getResult(
        registry,
        issueAtom(orgId, "ACME-7"),
      );
      assert.deepStrictEqual(
        other.issue.blocking?.map((ref) => ref.code),
        ["ACME-6"],
      );

      registry.set(unrelateIssueAtom, {
        params: { orgId, code: "ACME-7" },
        payload: { issue: "ACME-6" },
        reactivityKeys: keys("ACME-7"),
      });
      const unrelated = yield* AtomRegistry.getResult(
        registry,
        unrelateIssueAtom,
        { suspendOnWaiting: true },
      );
      assert.strictEqual(unrelated.relations?.length, 0);
    }),
  );
});
