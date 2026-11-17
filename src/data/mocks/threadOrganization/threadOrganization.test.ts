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
import { orgId, threads, world } from "../fixtures/world.ts";

const org = OrgId.make(orgId);
const keys = [`threads:${orgId}`, `threadOrganization:${orgId}`];
const release = ThreadFolderId.make(world.threadFolders[0].id);
const frontend = ThreadTagId.make(world.threadTags[0].id);
const checkout = JamId.make(threads.checkoutTest.id);
const rateLimit = JamId.make(threads.rateLimit.id);

describe("threadOrganization mock", () => {
  it.effect("decodes folders, tags and the board", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const folders = yield* AtomRegistry.getResult(
        registry,
        ApiClient.query("threadOrganization", "manifest", {
          params: { orgId: org },
          reactivityKeys: keys,
        }),
      );
      assert.deepStrictEqual(
        folders.map((folder) => [
          folder.name,
          folder.visibility,
          folder.viewerRole,
        ]),
        [
          ["Release", "shared", "owner"],
          ["Research", "private", "owner"],
        ],
      );
      const tags = yield* AtomRegistry.getResult(
        registry,
        ApiClient.query("threadOrganization", "listTags", {
          params: { orgId: org },
          query: {},
          reactivityKeys: keys,
        }),
      );
      assert.deepStrictEqual(
        tags.map((tag) => tag.color),
        ["primary", "blue", "destructive"],
      );
      const assigned = yield* AtomRegistry.getResult(
        registry,
        ApiClient.query("threadOrganization", "tagsForThread", {
          params: { orgId: org, jamId: checkout },
          reactivityKeys: keys,
        }),
      );
      assert.deepStrictEqual(
        assigned.map((tag) => tag.name),
        ["frontend", "urgent"],
      );
      const board = yield* AtomRegistry.getResult(
        registry,
        ApiClient.query("threadOrganization", "board", {
          params: { orgId: org },
          reactivityKeys: keys,
        }),
      );
      assert.strictEqual(board[0]?.items.length, 3);
      assert.isTrue(board[0]?.items[0]?.pinned);
    }),
  );

  it.effect("pins, files and tags threads the jams list reads", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const list = ApiClient.query("jams", "list", {
        params: { orgId: org },
        query: {},
        reactivityKeys: keys,
      });
      const counts = ApiClient.query("jams", "counts", {
        params: { orgId: org },
        query: {},
        reactivityKeys: keys,
      });
      const before = yield* AtomRegistry.getResult(registry, counts);
      assert.strictEqual(before.pinned, 2);

      const pin = ApiClient.mutation("threadOrganization", "pin");
      registry.set(pin, {
        params: { orgId: org },
        payload: { jamIds: [rateLimit, JamId.make("jam_missing")] },
        reactivityKeys: keys,
      });
      const pinned = yield* AtomRegistry.getResult(registry, pin);
      assert.deepStrictEqual(
        pinned.outcomes.map((outcome) => outcome.outcome),
        ["ok", "not_found"],
      );

      const add = ApiClient.mutation("threadOrganization", "addToFolder");
      registry.set(add, {
        params: { orgId: org, folderId: release },
        payload: { jamIds: [rateLimit] },
        reactivityKeys: keys,
      });
      const added = yield* AtomRegistry.getResult(registry, add);
      assert.strictEqual(added.items.at(-1)?.jamId, rateLimit);

      const assign = ApiClient.mutation("threadOrganization", "assignTag");
      registry.set(assign, {
        params: { orgId: org, tagId: frontend },
        payload: { jamIds: [rateLimit] },
        reactivityKeys: keys,
      });
      yield* AtomRegistry.getResult(registry, assign);

      const after = yield* AtomRegistry.getResult(registry, counts, {
        suspendOnWaiting: true,
      });
      assert.strictEqual(after.pinned, 3);
      const page = yield* AtomRegistry.getResult(registry, list, {
        suspendOnWaiting: true,
      });
      const card = page.items.find((thread) => thread.id === rateLimit);
      assert.isTrue(card?.pinned);
      assert.deepStrictEqual(card?.tagIds, [frontend]);
    }),
  );

  it.effect("creates, renames and deletes folders and tags", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const create = ApiClient.mutation("threadOrganization", "createFolder");
      registry.set(create, {
        params: { orgId: org },
        payload: { name: "Ops", visibility: "private" },
        reactivityKeys: keys,
      });
      const folder = yield* AtomRegistry.getResult(registry, create);
      assert.strictEqual(folder.section, "threads");

      const rename = ApiClient.mutation("threadOrganization", "renameFolder");
      registry.set(rename, {
        params: { orgId: org, folderId: folder.id },
        payload: { name: "Operations" },
        reactivityKeys: keys,
      });
      assert.strictEqual(
        (yield* AtomRegistry.getResult(registry, rename)).name,
        "Operations",
      );

      const remove = ApiClient.mutation("threadOrganization", "deleteFolder");
      registry.set(remove, {
        params: { orgId: org, folderId: folder.id },
        reactivityKeys: keys,
      });
      yield* AtomRegistry.getResult(registry, remove);

      const createTag = ApiClient.mutation("threadOrganization", "createTag");
      registry.set(createTag, {
        params: { orgId: org },
        payload: { name: "infra", color: "lime" },
        reactivityKeys: keys,
      });
      const tag = yield* AtomRegistry.getResult(registry, createTag);
      const deleteTag = ApiClient.mutation("threadOrganization", "deleteTag");
      registry.set(deleteTag, {
        params: { orgId: org, tagId: tag.id },
        reactivityKeys: keys,
      });
      yield* AtomRegistry.getResult(registry, deleteTag);
      const deleted = yield* AtomRegistry.getResult(
        registry,
        ApiClient.query("threadOrganization", "listTags", {
          params: { orgId: org },
          query: { deleted: "true" },
          reactivityKeys: keys,
        }),
      );
      assert.deepStrictEqual(
        deleted.map((row) => row.name),
        ["infra"],
      );

      const manifest = yield* AtomRegistry.getResult(
        registry,
        ApiClient.query("threadOrganization", "manifest", {
          params: { orgId: org },
          reactivityKeys: keys,
        }),
      );
      assert.notInclude(
        manifest.map((row) => row.id),
        folder.id,
      );
    }),
  );
});
