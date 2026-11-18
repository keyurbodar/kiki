import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { JamNotFound } from "../../api/schemas/errors.ts";
import { ApiClient } from "../../client/ApiClient.ts";
import { orgId, threads } from "../fixtures/world.ts";

const key = `children:${orgId}`;

const listAtom = ApiClient.query("children", "list", {
  params: { orgId, jamId: threads.checkoutTest.id },
  reactivityKeys: [key],
});
const pageAtom = ApiClient.query("children", "page", {
  params: { orgId, jamId: threads.checkoutTest.id },
  query: {},
  reactivityKeys: [key],
});
const taskAtom = ApiClient.query("children", "taskThread", {
  params: { orgId, taskId: "task_sample_checkout" },
  reactivityKeys: [key],
});

describe("children mock", () => {
  it.effect("returns all GET endpoints", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const list = yield* AtomRegistry.getResult(registry, listAtom);
      const page = yield* AtomRegistry.getResult(registry, pageAtom);
      const task = yield* AtomRegistry.getResult(registry, taskAtom);
      assert.isAtLeast((list as ReadonlyArray<unknown>).length, 1);
      assert.isAtLeast(
        (page as { items: ReadonlyArray<unknown> }).items.length,
        1,
      );
      assert.strictEqual(
        (task as { threadId: string }).threadId,
        threads.checkoutTest.id,
      );
    }),
  );

  it.effect("answers JamNotFound for a task thread that is gone", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const atom = ApiClient.query("children", "taskThread", {
        params: { orgId, taskId: "task_nobody" },
        reactivityKeys: [key],
      });
      const error = yield* AtomRegistry.getResult(registry, atom as never).pipe(
        Effect.flip,
      );
      assert.instanceOf(error, JamNotFound);
    }),
  );
});
