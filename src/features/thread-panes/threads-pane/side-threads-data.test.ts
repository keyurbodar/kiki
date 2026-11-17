import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { orgId, threads } from "@/data/mocks/fixtures/world";
import { sideThreadsAtom, toSideThreadEntries } from "./side-threads-data";

describe("toSideThreadEntries", () => {
  it("labels rows by title and skips malformed rows", () => {
    assert.deepStrictEqual(
      toSideThreadEntries([
        { id: "jam_a", title: "Stub the gateway" },
        { id: "jam_b", title: null },
        { id: "jam_c", title: "" },
        { title: "no id" },
        "junk",
      ]),
      [
        { id: "jam_a", label: "Stub the gateway" },
        { id: "jam_b", label: "Untitled thread" },
        { id: "jam_c", label: "Untitled thread" },
      ],
    );
  });

  it("returns nothing for a non-list", () => {
    assert.deepStrictEqual(toSideThreadEntries(undefined), []);
  });
});

describe("sideThreadsAtom", () => {
  it.effect("reads the thread's children through the mock client", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const rows = yield* AtomRegistry.getResult(
        registry,
        sideThreadsAtom(`${orgId}/${threads.checkoutTest.id}`),
      );
      const entries = toSideThreadEntries(rows);
      assert.isAtLeast(entries.length, 1);
      assert.include(
        entries.map((entry) => entry.label),
        "Stub the payment gateway in CI",
      );
    }),
  );
});
