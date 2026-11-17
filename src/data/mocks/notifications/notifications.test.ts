import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { ApiClient } from "../../client/ApiClient.ts";
import { orgId, people, projects } from "../fixtures/world.ts";

interface Notification {
  readonly id: string;
  readonly actorId: string;
  readonly projectId: string;
  readonly read: boolean;
}

const key = `notifications:${orgId}`;
const listAtom = ApiClient.query("notifications", "list", {
  reactivityKeys: [key],
});
const countAtom = ApiClient.query("notifications", "unreadCount", {
  reactivityKeys: [key],
});

describe("notifications mock", () => {
  it.effect("lists notifications and counts the unread ones", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const [list, count] = yield* Effect.all([
        AtomRegistry.getResult(registry, listAtom),
        AtomRegistry.getResult(registry, countAtom),
      ]);
      const rows = list as ReadonlyArray<Notification>;
      assert.isAbove(rows.length, 0);
      for (const row of rows) {
        assert.include(
          Object.values(people).map((person) => person.id),
          row.actorId,
        );
        assert.include(
          Object.values(projects).map((project) => project.id),
          row.projectId,
        );
      }
      assert.strictEqual(count, rows.filter((row) => !row.read).length);
    }),
  );
});
