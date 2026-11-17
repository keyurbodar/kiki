import { Effect, Ref } from "effect";
import { fields, MockDb, missing, newId } from "../db/MockDb.ts";
import { threads as worldThreads } from "../fixtures/world.ts";
import { mockGroup } from "../mockGroup.ts";
import {
  boardColumns,
  type FolderDetail,
  folderDetails,
  pinnedThreads,
  type TagAssignment,
  type TagDetail,
  tagDetails,
  threadTagAssignments,
} from "./fixtures.ts";

const updateFolder = (
  folders: ReadonlyArray<FolderDetail>,
  id: string,
  change: (folder: FolderDetail) => FolderDetail,
) => folders.map((folder) => (folder.id === id ? change(folder) : folder));

export const ThreadOrganizationMock = mockGroup(
  "threadOrganization",
  (handlers) =>
    Effect.gen(function* () {
      const { members } = yield* MockDb;
      const folders = yield* Ref.make<ReadonlyArray<FolderDetail>>(
        structuredClone(folderDetails),
      );
      const tags = yield* Ref.make<ReadonlyArray<TagDetail>>(
        structuredClone(tagDetails),
      );
      const assignments = yield* Ref.make<ReadonlyArray<TagAssignment>>(
        structuredClone(threadTagAssignments),
      );
      const pinned = yield* Ref.make<ReadonlyArray<string>>(
        structuredClone(pinnedThreads),
      );

      const folderOrMissing = (id: string) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(folders);
          const folder = rows.find((row) => row.id === id);
          if (!folder) return yield* missing("threadFolders", id);
          return folder;
        });

      const tagOrMissing = (id: string) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(tags);
          const tag = rows.find((row) => row.id === id);
          if (!tag) return yield* missing("threadTags", id);
          return tag;
        });

      const memberOrMissing = (id: string) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(members);
          if (!rows.some((row) => row.id === id)) {
            return yield* missing("members", id);
          }
          return id;
        });

      return handlers
        .handle("manifest", () =>
          Effect.gen(function* () {
            const rows = yield* Ref.get(folders);
            return rows
              .filter((folder) => !folder.hidden)
              .map((folder) => ({
                id: folder.id,
                name: folder.name,
                position: folder.position,
                access: folder.access,
                ownerId: folder.ownerId,
                itemCount: folder.itemIds.length,
              }));
          }),
        )
        .handle("createFolder", ({ payload }) =>
          Effect.gen(function* () {
            const input = fields(payload);
            const firstMember = (yield* Ref.get(members))[0];
            const ownerId = String(input.ownerId ?? firstMember?.id ?? "");
            if (ownerId) yield* memberOrMissing(ownerId);
            const folder: FolderDetail = {
              id: newId("fld"),
              name: String(input.name ?? "New folder"),
              position: (yield* Ref.get(folders)).length,
              access: String(input.access ?? "members"),
              hidden: false,
              ownerId,
              sharedWith: [],
              itemIds: [],
              createdAt: folderDetails[0]?.createdAt ?? "",
            };
            yield* Ref.update(folders, (rows) => [...rows, folder]);
            return folder;
          }),
        )
        .handle("renameFolder", ({ params, payload }) =>
          Effect.gen(function* () {
            const current = yield* folderOrMissing(params.folderId);
            const input = fields(payload);
            const updated = {
              ...current,
              name: String(input.name ?? current.name),
            };
            yield* Ref.update(folders, (rows) =>
              updateFolder(rows, current.id, () => updated),
            );
            return updated;
          }),
        )
        .handle("deleteFolder", ({ params }) =>
          Effect.gen(function* () {
            yield* folderOrMissing(params.folderId);
            yield* Ref.update(folders, (rows) =>
              rows.filter((folder) => folder.id !== params.folderId),
            );
            return { ok: true };
          }),
        )
        .handle("setFolderAccess", ({ params, payload }) =>
          Effect.gen(function* () {
            const current = yield* folderOrMissing(params.folderId);
            const input = fields(payload);
            const updated = {
              ...current,
              access: String(input.access ?? current.access),
            };
            yield* Ref.update(folders, (rows) =>
              updateFolder(rows, current.id, () => updated),
            );
            return updated;
          }),
        )
        .handle("setFolderHidden", ({ params, payload }) =>
          Effect.gen(function* () {
            const current = yield* folderOrMissing(params.folderId);
            const input = fields(payload);
            const updated = {
              ...current,
              hidden: typeof input.hidden === "boolean" ? input.hidden : true,
            };
            yield* Ref.update(folders, (rows) =>
              updateFolder(rows, current.id, () => updated),
            );
            return updated;
          }),
        )
        .handle("addToFolder", ({ params, payload }) =>
          Effect.gen(function* () {
            const current = yield* folderOrMissing(params.folderId);
            const input = fields(payload);
            const id = String(input.threadId ?? input.id ?? "");
            if (!id) {
              return yield* Effect.die(
                new Error("threadOrganization.addToFolder: missing threadId"),
              );
            }
            const updated = {
              ...current,
              itemIds: current.itemIds.includes(id)
                ? current.itemIds
                : [...current.itemIds, id],
            };
            yield* Ref.update(folders, (rows) =>
              updateFolder(rows, current.id, () => updated),
            );
            return updated;
          }),
        )
        .handle("removeFromFolder", ({ params, query }) =>
          Effect.gen(function* () {
            const current = yield* folderOrMissing(params.folderId);
            const id = String(query.threadId ?? query.id ?? "");
            const updated = {
              ...current,
              itemIds: current.itemIds.filter((item) => item !== id),
            };
            yield* Ref.update(folders, (rows) =>
              updateFolder(rows, current.id, () => updated),
            );
            return updated;
          }),
        )
        .handle("reorderFolderItems", ({ params, payload }) =>
          Effect.gen(function* () {
            const current = yield* folderOrMissing(params.folderId);
            const input = fields(payload);
            const ids = Array.isArray(input.itemIds)
              ? input.itemIds.map(String)
              : current.itemIds;
            const updated = { ...current, itemIds: ids };
            yield* Ref.update(folders, (rows) =>
              updateFolder(rows, current.id, () => updated),
            );
            return updated;
          }),
        )
        .handle("leaveFolder", ({ params }) =>
          Effect.gen(function* () {
            const current = yield* folderOrMissing(params.folderId);
            return { ok: true, folderId: current.id, left: true };
          }),
        )
        .handle("shareFolder", ({ params, payload }) =>
          Effect.gen(function* () {
            const current = yield* folderOrMissing(params.folderId);
            const input = fields(payload);
            const memberId = String(input.memberId ?? input.userId ?? "");
            yield* memberOrMissing(memberId);
            const updated = {
              ...current,
              sharedWith: current.sharedWith.includes(memberId)
                ? current.sharedWith
                : [...current.sharedWith, memberId],
            };
            yield* Ref.update(folders, (rows) =>
              updateFolder(rows, current.id, () => updated),
            );
            return updated;
          }),
        )
        .handle("unshareFolder", ({ params, query }) =>
          Effect.gen(function* () {
            const current = yield* folderOrMissing(params.folderId);
            const memberId = String(query.memberId ?? query.userId ?? "");
            const updated = {
              ...current,
              sharedWith: current.sharedWith.filter((id) => id !== memberId),
            };
            yield* Ref.update(folders, (rows) =>
              updateFolder(rows, current.id, () => updated),
            );
            return updated;
          }),
        )
        .handle("setFolderOwner", ({ params, payload }) =>
          Effect.gen(function* () {
            const current = yield* folderOrMissing(params.folderId);
            const input = fields(payload);
            const ownerId = String(input.ownerId ?? "");
            yield* memberOrMissing(ownerId);
            const updated = { ...current, ownerId };
            yield* Ref.update(folders, (rows) =>
              updateFolder(rows, current.id, () => updated),
            );
            return updated;
          }),
        )
        .handle("board", () =>
          Effect.gen(function* () {
            const rows = yield* Ref.get(folders);
            return boardColumns.map((column) => ({
              ...column,
              folders: rows
                .filter((folder) => column.folderIds.includes(folder.id))
                .map((folder) => ({
                  id: folder.id,
                  name: folder.name,
                  itemCount: folder.itemIds.length,
                })),
            }));
          }),
        )
        .handle("reorderFolders", ({ payload }) =>
          Effect.gen(function* () {
            const input = fields(payload);
            const order = Array.isArray(input.folderIds)
              ? input.folderIds.map(String)
              : [];
            const rows = yield* Ref.get(folders);
            const reordered = rows
              .toSorted(
                (a, b) =>
                  (order.indexOf(a.id) === -1
                    ? rows.indexOf(a)
                    : order.indexOf(a.id)) -
                  (order.indexOf(b.id) === -1
                    ? rows.indexOf(b)
                    : order.indexOf(b.id)),
              )
              .map((folder, index) => ({ ...folder, position: index }));
            yield* Ref.set(folders, reordered);
            return reordered.map((folder) => ({
              id: folder.id,
              name: folder.name,
              position: folder.position,
            }));
          }),
        )
        .handle("tagsForThread", ({ params }) =>
          Effect.gen(function* () {
            const allTags = yield* Ref.get(tags);
            const rows = yield* Ref.get(assignments);
            const tagIds = rows
              .filter((row) => row.jamId === params.jamId)
              .map((row) => row.tagId);
            const result = tagIds.flatMap((id) => {
              const tag = allTags.find((row) => row.id === id);
              return tag ? [tag] : [];
            });
            if (result.length === 0) {
              const known = Object.values(worldThreads).some(
                (thread) => thread.id === params.jamId,
              );
              if (!known)
                return yield* Effect.die(
                  new Error(`threadOrganization: no thread ${params.jamId}`),
                );
            }
            return result;
          }),
        )
        .handle("pin", ({ payload }) =>
          Effect.gen(function* () {
            const input = fields(payload);
            const id = String(input.jamId ?? input.threadId ?? "");
            if (!id)
              return yield* Effect.die(
                new Error("threadOrganization.pin: missing jamId"),
              );
            yield* Ref.update(pinned, (rows) =>
              rows.includes(id) ? rows : [...rows, id],
            );
            return { ok: true, pinned: yield* Ref.get(pinned) };
          }),
        )
        .handle("unpin", ({ payload }) =>
          Effect.gen(function* () {
            const input = fields(payload);
            const id = String(input.jamId ?? input.threadId ?? "");
            yield* Ref.update(pinned, (rows) =>
              rows.filter((row) => row !== id),
            );
            return { ok: true, pinned: yield* Ref.get(pinned) };
          }),
        )
        .handle("assignTag", ({ params, payload }) =>
          Effect.gen(function* () {
            const current = yield* tagOrMissing(params.tagId);
            const input = fields(payload);
            const jamId = String(
              input.jamId ?? input.threadId ?? worldThreads.checkoutTest.id,
            );
            const rows = yield* Ref.get(assignments);
            if (
              !rows.some(
                (row) => row.jamId === jamId && row.tagId === current.id,
              )
            ) {
              yield* Ref.set(assignments, [
                ...rows,
                { jamId, tagId: current.id },
              ]);
            }
            return { ok: true, jamId, tag: current };
          }),
        )
        .handle("unassignTag", ({ params, query }) =>
          Effect.gen(function* () {
            const current = yield* tagOrMissing(params.tagId);
            const jamId = String(
              query.jamId ?? query.threadId ?? worldThreads.checkoutTest.id,
            );
            yield* Ref.update(assignments, (rows) =>
              rows.filter(
                (row) => !(row.jamId === jamId && row.tagId === current.id),
              ),
            );
            return { ok: true, jamId, tag: current };
          }),
        )
        .handle("listTags", () =>
          Effect.gen(function* () {
            const rows = yield* Ref.get(tags);
            return rows.filter((tag) => tag.deletedAt === null);
          }),
        )
        .handle("createTag", ({ payload }) =>
          Effect.gen(function* () {
            const input = fields(payload);
            const tag: TagDetail = {
              id: newId("tag"),
              name: String(input.name ?? "New tag"),
              color: String(input.color ?? "default"),
              deletedAt: null,
              usageCount: 0,
            };
            yield* Ref.update(tags, (rows) => [...rows, tag]);
            return tag;
          }),
        )
        .handle("updateTag", ({ params, payload }) =>
          Effect.gen(function* () {
            const current = yield* tagOrMissing(params.tagId);
            const input = fields(payload);
            const updated: TagDetail = {
              ...current,
              name: typeof input.name === "string" ? input.name : current.name,
              color:
                typeof input.color === "string" ? input.color : current.color,
            };
            yield* Ref.update(tags, (rows) =>
              rows.map((tag) => (tag.id === current.id ? updated : tag)),
            );
            return updated;
          }),
        )
        .handle("deleteTag", ({ params }) =>
          Effect.gen(function* () {
            const current = yield* tagOrMissing(params.tagId);
            const deletedAt = folderDetails[0]?.createdAt ?? "";
            const updated: TagDetail = { ...current, deletedAt };
            yield* Ref.update(tags, (rows) =>
              rows.map((tag) => (tag.id === current.id ? updated : tag)),
            );
            yield* Ref.update(assignments, (rows) =>
              rows.filter((row) => row.tagId !== current.id),
            );
            return { ok: true };
          }),
        )
        .handle("restoreTag", ({ params }) =>
          Effect.gen(function* () {
            const current = yield* tagOrMissing(params.tagId);
            const updated: TagDetail = { ...current, deletedAt: null };
            yield* Ref.update(tags, (rows) =>
              rows.map((tag) => (tag.id === current.id ? updated : tag)),
            );
            return updated;
          }),
        );
    }),
);
