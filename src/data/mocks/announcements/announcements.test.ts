import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { ApiClient } from "../../client/ApiClient.ts";
import { orgId } from "../fixtures/world.ts";

interface Announcement {
  readonly id: string;
  readonly key: string;
  readonly seenAt: string | null;
}

const key = `announcements:${orgId}`;
const listAtom = ApiClient.query("announcements", "list", {
  query: {},
  reactivityKeys: [key],
});
const record = ApiClient.mutation("announcements", "record");

const keys = (value: unknown) =>
  (value as ReadonlyArray<Announcement>).map((row) => row.key);

describe("announcements mock", () => {
  it.effect("lists announcements", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const list = yield* AtomRegistry.getResult(registry, listAtom);
      assert.include(keys(list), "dark-mode-in-settings");
    }),
  );

  it.effect("records a seen announcement", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      registry.mount(listAtom);
      yield* AtomRegistry.getResult(registry, listAtom);
      registry.set(record, {
        params: { key: "release-notes" },
        payload: { title: "Release notes", body: "Version 2.4 is out." },
        reactivityKeys: [key],
      });
      yield* AtomRegistry.getResult(registry, record);
      const after = yield* AtomRegistry.getResult(registry, listAtom, {
        suspendOnWaiting: true,
      });
      assert.include(keys(after), "release-notes");
      assert.isString(
        (after as ReadonlyArray<Announcement>).find(
          (row) => row.key === "release-notes",
        )?.seenAt,
      );
    }),
  );
});
