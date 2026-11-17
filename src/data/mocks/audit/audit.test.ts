import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { ApiClient } from "../../client/ApiClient.ts";
import { org } from "../fixtures/world.ts";

interface AuditRow {
  readonly id: string;
  readonly action: string;
  readonly targetName: string;
}

const key = `audit:${org.id}`;
const params = { orgId: org.id };
const listAtom = ApiClient.query("audit", "list", {
  params,
  query: {},
  reactivityKeys: [key],
});
const filteredAtom = ApiClient.query("audit", "list", {
  params,
  query: { action: "pull.merged" },
  reactivityKeys: [key],
});

const events = (value: unknown) =>
  (value as { events: ReadonlyArray<AuditRow> }).events;

describe("audit mock", () => {
  it.effect("lists and filters audit events", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const all = yield* AtomRegistry.getResult(registry, listAtom);
      assert.isAbove(events(all).length, 2);
      assert.isNull((all as { cursor: string | null }).cursor);
      assert.isAbove(
        (all as { actors: ReadonlyArray<unknown> }).actors.length,
        0,
      );
      const filtered = yield* AtomRegistry.getResult(registry, filteredAtom);
      assert.deepStrictEqual(
        events(filtered).map((row) => row.action),
        ["pull.merged"],
      );
    }),
  );

  it.effect("paginates with a cursor", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const page = yield* AtomRegistry.getResult(
        registry,
        ApiClient.query("audit", "list", {
          params,
          query: { limit: "2" },
          reactivityKeys: [key],
        }),
      );
      assert.equal(events(page).length, 2);
      const cursor = (page as { cursor: string }).cursor;
      assert.isString(cursor);
      const second = yield* AtomRegistry.getResult(
        registry,
        ApiClient.query("audit", "list", {
          params,
          query: { limit: "2", cursor },
          reactivityKeys: [key],
        }),
      );
      assert.notInclude(
        events(second).map((row) => row.id),
        events(page)[0]?.id,
      );
    }),
  );
});
