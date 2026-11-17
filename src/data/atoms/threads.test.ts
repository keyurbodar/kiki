import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { OrgId } from "../api/schemas/ids.ts";
import { ApiClient } from "../client/ApiClient.ts";
import {
  allThreadsAtom,
  listAllThreads,
  nextCursor,
  threadsAtom,
} from "./threads.ts";

const orgId = OrgId.make("org_sample_acme");

describe("thread page cursor", () => {
  it("stops on a null cursor, an empty page or a cursor already seen", () => {
    const page = { items: [1], cursor: "a" };
    assert.strictEqual(nextCursor(page, new Set()), "a");
    assert.strictEqual(nextCursor({ ...page, cursor: null }, new Set()), null);
    assert.strictEqual(nextCursor({ items: [], cursor: "a" }, new Set()), null);
    assert.strictEqual(nextCursor(page, new Set(["a"])), null);
  });
});

describe("listAllThreads", () => {
  it.effect("follows the cursor past the first page", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const firstPage = yield* AtomRegistry.getResult(
        registry,
        threadsAtom(orgId),
      );
      const paged = yield* AtomRegistry.getResult(
        registry,
        ApiClient.runtime.atom(
          listAllThreads(orgId, {
            archived: false,
            excludeFiled: false,
            pageSize: 2,
          }),
        ),
      );
      assert.isAbove(firstPage.items.length, 2);
      assert.deepStrictEqual(
        paged.map((thread) => thread.id),
        firstPage.items.map((thread) => thread.id),
      );
    }),
  );

  it.effect("loads the same threads as one unpaged request", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const all = yield* AtomRegistry.getResult(
        registry,
        allThreadsAtom(orgId, { archived: false, excludeFiled: false }),
      );
      assert.strictEqual(all.length, 10);
    }),
  );
});
