import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { JamId, OrgId } from "../api/schemas/ids.ts";
import { captainsAtom } from "./captains.ts";
import {
  archivedThreadsAtom,
  archiveThreadsAtom,
  threadAtom,
  threadCountsAtom,
  threadKey,
} from "./jams.ts";
import {
  foldersAtom,
  pinThreadsAtom,
  tagsAtom,
  threadOrganizationKeys,
  threadTagsAtom,
  threadTagsKey,
} from "./threadOrganization.ts";

const orgId = OrgId.make("org_sample_acme");
const jamId = JamId.make("jam_sample_0001");
const rateLimit = JamId.make("jam_sample_0004");

describe("shell atoms over MockServices", () => {
  it.effect("read a thread, its tags, folders and captains", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const thread = yield* AtomRegistry.getResult(
        registry,
        threadAtom(threadKey(orgId, jamId)),
      );
      assert.strictEqual(thread.title, "Fix flaky checkout test");
      assert.strictEqual(thread.membership.viewerRole, "owner");
      const tags = yield* AtomRegistry.getResult(
        registry,
        threadTagsAtom(threadTagsKey(orgId, jamId)),
      );
      assert.deepStrictEqual(
        tags.map((tag) => tag.name),
        ["frontend", "urgent"],
      );
      const folders = yield* AtomRegistry.getResult(
        registry,
        foldersAtom(orgId),
      );
      assert.strictEqual(folders.length, 2);
      const allTags = yield* AtomRegistry.getResult(registry, tagsAtom(orgId));
      assert.strictEqual(allTags.length, 3);
      const captains = yield* AtomRegistry.getResult(
        registry,
        captainsAtom(orgId),
      );
      assert.deepStrictEqual(
        captains.map((captain) => captain.face.name),
        ["Release captain", "Docs captain"],
      );
    }),
  );

  it.effect("refresh counts and the archive after pin and archive", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const counts = threadCountsAtom(orgId);
      registry.mount(counts);
      registry.mount(archivedThreadsAtom(orgId));
      assert.strictEqual(
        (yield* AtomRegistry.getResult(registry, counts)).pinned,
        2,
      );
      registry.set(pinThreadsAtom, {
        params: { orgId },
        payload: { jamIds: [rateLimit] },
        reactivityKeys: threadOrganizationKeys(orgId),
      });
      yield* AtomRegistry.getResult(registry, pinThreadsAtom);
      assert.strictEqual(
        (yield* AtomRegistry.getResult(registry, counts, {
          suspendOnWaiting: true,
        })).pinned,
        3,
      );
      registry.set(archiveThreadsAtom, {
        params: { orgId },
        payload: { jamIds: [rateLimit] },
        reactivityKeys: threadOrganizationKeys(orgId),
      });
      yield* AtomRegistry.getResult(registry, archiveThreadsAtom);
      const archived = yield* AtomRegistry.getResult(
        registry,
        archivedThreadsAtom(orgId),
        { suspendOnWaiting: true },
      );
      assert.include(
        archived.items.map((thread) => thread.id),
        rateLimit,
      );
    }),
  );
});
