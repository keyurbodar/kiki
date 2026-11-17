import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import {
  JamId,
  OrgId,
  ThreadFolderId,
  ThreadTagId,
} from "../../api/schemas/ids.ts";
import { ApiClient } from "../../client/ApiClient.ts";

const orgId = OrgId.make("org_sample_acme");
const keys = [`threadOrganization:${orgId}`];

describe("threadOrganization DELETE endpoints with a payload", () => {
  it.effect("unassign a tag and remove a thread from a folder", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const unassign = ApiClient.mutation("threadOrganization", "unassignTag");
      registry.set(unassign, {
        params: { orgId, tagId: ThreadTagId.make("tag_sample_urgent") },
        payload: { jamIds: [JamId.make("jam_sample_0001")] },
        reactivityKeys: keys,
      });
      const unassigned = yield* AtomRegistry.getResult(registry, unassign);
      assert.strictEqual(unassigned.outcomes[0]?.outcome, "ok");
      const tags = yield* AtomRegistry.getResult(
        registry,
        ApiClient.query("threadOrganization", "tagsForThread", {
          params: { orgId, jamId: JamId.make("jam_sample_0001") },
          reactivityKeys: keys,
        }),
      );
      assert.deepStrictEqual(
        tags.map((tag) => tag.name),
        ["frontend"],
      );
      const remove = ApiClient.mutation(
        "threadOrganization",
        "removeFromFolder",
      );
      registry.set(remove, {
        params: {
          orgId,
          folderId: ThreadFolderId.make("fld_sample_release"),
        },
        payload: { jamIds: [JamId.make("jam_sample_0002")] },
        reactivityKeys: keys,
      });
      const removed = yield* AtomRegistry.getResult(registry, remove);
      assert.notInclude(
        removed.items.map((item) => String(item.jamId)),
        "jam_sample_0002",
      );
    }),
  );
});
