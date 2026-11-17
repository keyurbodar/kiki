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

describe("announcement seen state", () => {
  it.effect("nests seen state the way Capy's client reads it", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const list = ApiClient.query("announcements", "list", {
        query: {},
        reactivityKeys: ["announcements"],
      });
      const rows = (yield* AtomRegistry.getResult(
        registry,
        list,
      )) as ReadonlyArray<{
        key: string;
        seenAt: string | null;
        state: { seenAt: string | null; dismissedAt: string | null };
      }>;
      assert.isAbove(rows.length, 0);
      for (const row of rows) {
        assert.strictEqual(row.state.seenAt, row.seenAt);
        assert.isNull(row.state.dismissedAt);
      }

      const record = ApiClient.mutation("announcements", "record");
      registry.set(record, {
        params: { key: rows[0]?.key ?? "" },
        payload: {},
        reactivityKeys: ["announcements"],
      } as never);
      const recorded = (yield* AtomRegistry.getResult(registry, record)) as {
        ok: boolean;
      };
      assert.isTrue(recorded.ok);
      const after = (yield* AtomRegistry.getResult(registry, list, {
        suspendOnWaiting: true,
      })) as ReadonlyArray<{ state: { seenAt: string | null } }>;
      assert.isNotNull(after[0]?.state.seenAt ?? null);
    }),
  );
});
