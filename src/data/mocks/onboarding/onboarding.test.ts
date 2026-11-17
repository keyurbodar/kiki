import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { ApiClient } from "../../client/ApiClient.ts";
import { orgId } from "../fixtures/world.ts";

interface Step {
  readonly id: string;
  readonly completed: boolean;
  readonly skipped: boolean;
}
interface Status {
  readonly dismissed: boolean;
  readonly steps: ReadonlyArray<Step>;
}

const run = (
  registry: Parameters<typeof AtomRegistry.getResult>[0],
  atom: unknown,
  input: object,
) => {
  const writable = atom as { set: (value: object) => void };
  registry.set(writable as never, { ...input, reactivityKeys: [key] });
  return AtomRegistry.getResult(registry, writable as never);
};

const key = `onboarding:${orgId}`;
const statusAtom = ApiClient.query("onboarding", "status", {
  params: { orgId },
  reactivityKeys: [key],
});
const dismiss = ApiClient.mutation("onboarding", "dismiss");
const restore = ApiClient.mutation("onboarding", "restore");
const skip = ApiClient.mutation("onboarding", "skip");
const unskip = ApiClient.mutation("onboarding", "unskip");

describe("onboarding mock", () => {
  it.effect("returns non-empty status", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const status = (yield* AtomRegistry.getResult(
        registry,
        statusAtom,
      )) as Status;
      assert.isAbove(status.steps.length, 0);
      assert.isFalse(status.dismissed);
    }),
  );

  it.effect("dismisses, skips, unskips and restores onboarding", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      registry.mount(statusAtom);
      yield* AtomRegistry.getResult(registry, statusAtom);
      const status = () =>
        AtomRegistry.getResult(registry, statusAtom, {
          suspendOnWaiting: true,
        }) as Effect.Effect<Status>;

      const dismissed = (yield* run(registry, dismiss, {
        params: { orgId },
      })) as Status;
      assert.isTrue(dismissed.dismissed);
      assert.isTrue((yield* status()).dismissed);

      const skipped = (yield* run(registry, skip, {
        params: { orgId, step: "connect-github" },
      })) as Status;
      assert.isTrue(
        skipped.steps.find((step) => step.id === "connect-github")?.skipped,
      );

      const unskipped = (yield* run(registry, unskip, {
        params: { orgId, step: "connect-github" },
      })) as Status;
      assert.isFalse(
        unskipped.steps.find((step) => step.id === "connect-github")?.skipped,
      );

      const restored = (yield* run(registry, restore, {
        params: { orgId },
      })) as Status;
      assert.isFalse(restored.dismissed);
      assert.isFalse((yield* status()).dismissed);
    }),
  );
});
