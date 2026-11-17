import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { ApiClient } from "../../client/ApiClient.ts";
import { orgId, people, threads, world } from "../fixtures/world.ts";

interface Folder {
  readonly id: string;
  readonly name: string;
  readonly hidden?: boolean;
}
interface Tag {
  readonly id: string;
  readonly name: string;
  readonly deletedAt?: string | null;
}

const key = `threadOrganization:${orgId}`;
const folderId = world.threadFolders[0].id;
const tagId = world.threadTags[0].id;
const jamId = threads.checkoutTest.id;

const manifestAtom = ApiClient.query("threadOrganization", "manifest", {
  params: { orgId },
  reactivityKeys: [key],
});
const boardAtom = ApiClient.query("threadOrganization", "board", {
  params: { orgId },
  reactivityKeys: [key],
});
const tagsAtom = ApiClient.query("threadOrganization", "listTags", {
  params: { orgId },
  query: {},
  reactivityKeys: [key],
});
const tagsForThreadAtom = ApiClient.query(
  "threadOrganization",
  "tagsForThread",
  {
    params: { orgId, jamId },
    reactivityKeys: [key],
  },
);

const createFolder = ApiClient.mutation("threadOrganization", "createFolder");
const deleteFolder = ApiClient.mutation("threadOrganization", "deleteFolder");
const createTag = ApiClient.mutation("threadOrganization", "createTag");
const deleteTag = ApiClient.mutation("threadOrganization", "deleteTag");

describe("threadOrganization mock", () => {
  it.effect("returns every GET endpoint", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const manifest = yield* AtomRegistry.getResult(registry, manifestAtom);
      const board = yield* AtomRegistry.getResult(registry, boardAtom);
      const tags = yield* AtomRegistry.getResult(registry, tagsAtom);
      const forThread = yield* AtomRegistry.getResult(
        registry,
        tagsForThreadAtom,
      );
      assert.isAtLeast((manifest as ReadonlyArray<Folder>).length, 1);
      assert.isAtLeast((board as ReadonlyArray<unknown>).length, 1);
      assert.isAtLeast((tags as ReadonlyArray<Tag>).length, 1);
      assert.isAtLeast((forThread as ReadonlyArray<Tag>).length, 1);
    }),
  );

  it.effect("refreshes the manifest after folder create and delete", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      registry.mount(manifestAtom);
      yield* AtomRegistry.getResult(registry, manifestAtom);

      registry.set(createFolder, {
        params: { orgId },
        payload: { name: "Launch checklist", ownerId: people.sam.id },
        reactivityKeys: [key],
      });
      const created = yield* AtomRegistry.getResult(registry, createFolder);
      const afterCreate = yield* AtomRegistry.getResult(
        registry,
        manifestAtom,
        {
          suspendOnWaiting: true,
        },
      );
      assert.include(
        (afterCreate as ReadonlyArray<Folder>).map((folder) => folder.name),
        "Launch checklist",
      );

      registry.set(deleteFolder, {
        params: { orgId, folderId: (created as Folder).id },
        reactivityKeys: [key],
      });
      yield* AtomRegistry.getResult(registry, deleteFolder);
      const afterDelete = yield* AtomRegistry.getResult(
        registry,
        manifestAtom,
        {
          suspendOnWaiting: true,
        },
      );
      assert.notInclude(
        (afterDelete as ReadonlyArray<Folder>).map((folder) => folder.name),
        "Launch checklist",
      );
    }),
  );

  it.effect("calls the remaining folder and tag mutations", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const fire = (
        endpoint: string,
        params: Record<string, string>,
        payload?: Record<string, unknown>,
        query?: Record<string, string>,
      ) => {
        const atom = ApiClient.mutation(
          "threadOrganization",
          endpoint as never,
        );
        registry.set(atom, {
          params: { orgId, ...params },
          ...(payload ? { payload } : {}),
          ...(query ? { query } : {}),
          reactivityKeys: [key],
        } as never);
        return AtomRegistry.getResult(registry, atom);
      };
      const target = threads.bundler.id;
      assert.strictEqual(
        (
          (yield* fire(
            "renameFolder",
            { folderId },
            { name: "Shipping" },
          )) as Folder
        ).name,
        "Shipping",
      );
      yield* fire("setFolderAccess", { folderId }, { access: "private" });
      yield* fire("setFolderHidden", { folderId }, { hidden: true });
      yield* fire("setFolderHidden", { folderId }, { hidden: false });
      yield* fire("addToFolder", { folderId }, { threadId: target });
      yield* fire("removeFromFolder", { folderId }, undefined, {
        threadId: target,
      });
      yield* fire("reorderFolderItems", { folderId }, { itemIds: [] });
      yield* fire("leaveFolder", { folderId });
      yield* fire("shareFolder", { folderId }, { memberId: people.casey.id });
      yield* fire("unshareFolder", { folderId }, undefined, {
        memberId: people.casey.id,
      });
      yield* fire("setFolderOwner", { folderId }, { ownerId: people.alex.id });
      yield* fire("reorderFolders", {}, { folderIds: [folderId] });
      yield* fire("pin", {}, { jamId });
      yield* fire("assignTag", { tagId }, { jamId });
      yield* fire("unassignTag", { tagId }, undefined, { jamId });
      yield* fire("unpin", {}, { jamId });
      yield* fire("updateTag", { tagId }, { name: "frontend" });
      yield* fire("restoreTag", { tagId });

      registry.set(createTag, {
        params: { orgId },
        payload: { name: "security", color: "danger" },
        reactivityKeys: [key],
      });
      const tag = (yield* AtomRegistry.getResult(registry, createTag)) as Tag;
      assert.strictEqual(tag.name, "security");

      registry.mount(tagsAtom);
      yield* AtomRegistry.getResult(registry, tagsAtom);
      registry.set(deleteTag, {
        params: { orgId, tagId: tag.id },
        reactivityKeys: [key],
      });
      yield* AtomRegistry.getResult(registry, deleteTag);
      const afterDelete = yield* AtomRegistry.getResult(registry, tagsAtom, {
        suspendOnWaiting: true,
      });
      assert.notInclude(
        (afterDelete as ReadonlyArray<Tag>).map((row) => row.name),
        "security",
      );
    }),
  );
});
