import { assert, describe, it } from "@effect/vitest";
import { Duration, Effect } from "effect";
import { type AsyncResult, AtomRegistry } from "effect/reactivity";
import { OrgId } from "../api/schemas/ids.ts";
import { revalidateOnMount } from "./revalidate.ts";
import { threadsAtom } from "./threads.ts";

const orgId = OrgId.make("org_sample_acme");
const wait = (ms: number) =>
  Effect.promise(() => new Promise((resolve) => setTimeout(resolve, ms)));

const stampOf = (result: AsyncResult.AsyncResult<unknown, unknown>) =>
  result._tag === "Success" ? result.timestamp : -1;

/**
 * The behaviour a reader gets: come back to a screen and it is re-read, so the
 * list is the server's rather than the snapshot from when they left. A remount
 * inside the stale window must not re-read, or every tab switch refetches.
 *
 * A subscription stands in for a mounted surface: a one-shot read unsubscribes
 * straight away, which the wrapper reads as "nothing is looking at this" and
 * correctly declines to refresh.
 */
describe("revalidateOnMount", () => {
  it.effect("re-reads on a mount once the cached value is stale", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const stale = threadsAtom(orgId).pipe(revalidateOnMount(Duration.zero));

      const unmount = registry.subscribe(stale, () => {});
      yield* AtomRegistry.getResult(registry, stale);
      const first = registry.get(stale);
      unmount();

      // Leave the screen and come back: the wrapper rebuilds over the cache.
      yield* wait(40);
      const remount = registry.subscribe(stale, () => {});
      yield* wait(40);
      const second = registry.get(stale);
      remount();

      assert.strictEqual(first._tag, "Success");
      assert.strictEqual(second._tag, "Success");
      assert.isAbove(stampOf(second), stampOf(first));
    }),
  );

  it.effect("does not re-read inside the stale window", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const fresh = threadsAtom(orgId).pipe(
        revalidateOnMount(Duration.minutes(5)),
      );

      const unmount = registry.subscribe(fresh, () => {});
      yield* AtomRegistry.getResult(registry, fresh);
      const first = registry.get(fresh);
      yield* wait(40);
      const second = registry.get(fresh);
      unmount();

      assert.strictEqual(stampOf(second), stampOf(first));
    }),
  );

  it.effect("keeps the value readable while it refreshes", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const stale = threadsAtom(orgId).pipe(revalidateOnMount(Duration.zero));
      const unmount = registry.subscribe(stale, () => {});
      yield* wait(40);
      const during = registry.get(stale);
      unmount();
      assert.strictEqual(during._tag, "Success");
    }),
  );
});
