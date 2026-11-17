import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import type { OrgId } from "../../api/schemas/ids.ts";
import {
  createPullAtom,
  installationReposAtom,
  type PullListRequest,
  pullBranchesAtom,
  pullsAtom,
} from "../../atoms/pulls.ts";
import { orgId as sampleOrgId } from "../fixtures/world.ts";

const orgId = sampleOrgId as OrgId;

const request = (overrides: Partial<PullListRequest> = {}): PullListRequest => ({
  projectIds: [],
  excludedProjectIds: [],
  states: [],
  excludedStates: [],
  authors: [],
  repos: [],
  labels: [],
  captainIds: [],
  updatedAfter: null,
  search: "",
  limit: 100,
  ...overrides,
});

describe("pulls mock", () => {
  it.effect("lists every pull newest first", () =>
    Effect.gen(function* () {
      const page = yield* AtomRegistry.getResult(
        AtomRegistry.make(),
        pullsAtom(orgId, request()),
      );
      assert.isAbove(page.items.length, 20);
      const times = page.items.map((pull) => pull.updatedAt.epochMilliseconds);
      assert.deepStrictEqual(times, [...times].sort((a, b) => b - a));
      assert.isNull(page.cursor);
    }),
  );

  it.effect("filters by one state, several states and an excluded state", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const ready = yield* AtomRegistry.getResult(
        registry,
        pullsAtom(orgId, request({ states: ["ready"] })),
      );
      assert.isTrue(ready.items.every((pull) => pull.state === "ready"));
      const open = yield* AtomRegistry.getResult(
        registry,
        pullsAtom(orgId, request({ states: ["ready", "failed"] })),
      );
      assert.includeMembers(
        [...new Set(open.items.map((pull) => pull.state))],
        ["ready", "failed"],
      );
      const notMerged = yield* AtomRegistry.getResult(
        registry,
        pullsAtom(orgId, request({ excludedStates: ["merged"] })),
      );
      assert.isFalse(notMerged.items.some((pull) => pull.state === "merged"));
    }),
  );

  it.effect("pages with a cursor and searches titles", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const first = yield* AtomRegistry.getResult(
        registry,
        pullsAtom(orgId, request({ limit: 5 })),
      );
      assert.lengthOf(first.items, 5);
      assert.isNotNull(first.cursor);
      const found = yield* AtomRegistry.getResult(
        registry,
        pullsAtom(orgId, request({ search: "dark mode" })),
      );
      assert.isTrue(
        found.items.every((pull) => pull.title.toLowerCase().includes("dark mode")),
      );
    }),
  );

  it.effect("serves repos and branches for the new pull dialog", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const repos = yield* AtomRegistry.getResult(
        registry,
        installationReposAtom(orgId),
      );
      assert.strictEqual(repos.state, "ok");
      assert.include(
        repos.repos.map((repo) => repo.repoFullName),
        "acme/web",
      );
      const branches = yield* AtomRegistry.getResult(
        registry,
        pullBranchesAtom(orgId, "acme/web"),
      );
      assert.include(branches, "main");
    }),
  );

  it.effect("creates a draft pull that the list then shows", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const list = pullsAtom(orgId, request());
      registry.mount(list);
      yield* AtomRegistry.getResult(registry, list);
      registry.set(createPullAtom, {
        params: { orgId },
        payload: {
          repo: "acme/web",
          base: "main",
          head: "feat/saved-items",
          title: "Saved items in the header",
          draft: true,
        },
        reactivityKeys: [`pull:${orgId}`],
      });
      const created = yield* AtomRegistry.getResult(registry, createPullAtom);
      assert.strictEqual(created.state, "draft");
      assert.strictEqual(created.repo, "acme/web");
      const after = yield* AtomRegistry.getResult(registry, list, {
        suspendOnWaiting: true,
      });
      assert.include(
        after.items.map((pull) => pull.title),
        "Saved items in the header",
      );
    }),
  );
});
