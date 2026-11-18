import { DateTime, Effect, Ref } from "effect";
import { ThreadOrganizationNotFound } from "../../api/schemas/errors.ts";
import type { JamId } from "../../api/schemas/ids.ts";
import { JamBatchResult, ThreadCard } from "../../api/schemas/thread.ts";
import {
  AssignedThreadTag,
  FolderBoardSection,
  FolderItemsResult,
  TagAssignResult,
} from "../../api/schemas/threadOrganization.ts";
import { MockDb, newId, type Row } from "../db/MockDb.ts";
import { fixtureNow } from "../fixtures/time.ts";
import { viewer, world } from "../fixtures/world.ts";
import { sampleThreads } from "../jams/fixtures.ts";
import { mockGroup } from "../mockGroup.ts";
import { toFolder, toFolderItem, toTag } from "./fixtures.ts";

const maxTagsPerThread = 10;

/** A Captain is a jam, so a pin may name one; the pin table holds both. */
const knownThread = (jamId: string) =>
  Object.values(world.threads).some((thread) => thread.id === jamId) ||
  world.captains.some((captain) => captain.id === jamId);

const now = () => DateTime.formatIso(fixtureNow);

/**
 * The pins a write leaves behind, so a reload reads them back: the mock's refs
 * are rebuilt on every page load, and a pin the sidebar forgets on reload reads
 * as a pin that never happened.
 */
const STORED_PINS_KEY = "kiki.mock.threadPins";

const storedPins = (): ReadonlyArray<string> => {
  const store = globalThis.localStorage;
  if (store === undefined) return [];
  try {
    const raw = store.getItem(STORED_PINS_KEY);
    const parsed: unknown = raw === null ? [] : JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return [];
  }
};

const rememberPins = (jamIds: ReadonlyArray<string>) => {
  const store = globalThis.localStorage;
  if (store === undefined) return;
  try {
    store.setItem(STORED_PINS_KEY, JSON.stringify(jamIds));
  } catch {
    // A full or blocked store only costs the reload, never the pin.
  }
};

export const ThreadOrganizationMock = mockGroup(
  "threadOrganization",
  (handlers) =>
    Effect.gen(function* () {
      const {
        threadFolders,
        threadFolderItems,
        threadTags,
        threadTagAssignments,
        threadPins,
      } = yield* MockDb;

      const kept = storedPins();
      if (kept.length > 0) {
        yield* Ref.update(threadPins, (rows) => [
          ...rows,
          ...kept
            .filter((jamId) => !rows.some((row) => row.jamId === jamId))
            .map((jamId) => ({ jamId })),
        ]);
      }

      const folderRow = (id: string) =>
        Effect.gen(function* () {
          const row = (yield* Ref.get(threadFolders)).find(
            (folder) => folder.id === id,
          );
          if (!row) return yield* new ThreadOrganizationNotFound();
          return row;
        });

      const tagRow = (id: string) =>
        Effect.gen(function* () {
          const row = (yield* Ref.get(threadTags)).find((tag) => tag.id === id);
          if (!row) return yield* new ThreadOrganizationNotFound();
          return row;
        });

      const updateFolder = (
        id: string,
        change: (row: Row<"threadFolders">) => Row<"threadFolders">,
      ) =>
        Effect.gen(function* () {
          const current = yield* folderRow(id);
          const updated = { ...change(current), updatedAt: now() };
          yield* Ref.update(threadFolders, (rows) =>
            rows.map((row) => (row.id === id ? updated : row)),
          );
          return toFolder(updated);
        });

      const updateTag = (
        id: string,
        change: (row: Row<"threadTags">) => Row<"threadTags">,
      ) =>
        Effect.gen(function* () {
          const current = yield* tagRow(id);
          const updated = change(current);
          yield* Ref.update(threadTags, (rows) =>
            rows.map((row) => (row.id === id ? updated : row)),
          );
          return toTag(updated);
        });

      const folderItems = (folder: Row<"threadFolders">) =>
        Effect.gen(function* () {
          return (yield* Ref.get(threadFolderItems))
            .filter((item) => item.folderId === folder.id)
            .toSorted((a, b) => a.position - b.position)
            .map((item) => toFolderItem(item, folder));
        });

      const outcomes = (jamIds: ReadonlyArray<JamId>) =>
        jamIds.map((jamId) => ({
          jamId,
          outcome: knownThread(jamId)
            ? ("ok" as const)
            : ("not_found" as const),
        }));

      const visibleFolders = Effect.gen(function* () {
        return (yield* Ref.get(threadFolders)).toSorted(
          (a, b) => a.position - b.position,
        );
      });

      return handlers
        .handle("manifest", () =>
          visibleFolders.pipe(Effect.map((rows) => rows.map(toFolder))),
        )
        .handle("createFolder", ({ payload }) =>
          Effect.gen(function* () {
            const rows = yield* Ref.get(threadFolders);
            const row: Row<"threadFolders"> = {
              id: newId("fld"),
              name: payload.name,
              position: rows.length,
              visibility: payload.visibility,
              section: payload.section ?? "threads",
              ownerUserId: viewer.id,
              hidden: false,
              memberIds: [],
              createdAt: now(),
              updatedAt: now(),
            };
            yield* Ref.set(threadFolders, [...rows, row]);
            return toFolder(row);
          }),
        )
        .handle("renameFolder", ({ params, payload }) =>
          updateFolder(params.folderId, (row) => ({
            ...row,
            name: payload.name,
          })),
        )
        .handle("reorderFolders", ({ payload }) =>
          Effect.gen(function* () {
            const order: ReadonlyArray<string> = payload.folderIds;
            const rank = (id: string) =>
              order.includes(id) ? order.indexOf(id) : order.length;
            const rows = (yield* visibleFolders)
              .toSorted((a, b) => rank(a.id) - rank(b.id))
              .map((row, position) => ({ ...row, position }));
            yield* Ref.set(threadFolders, rows);
            return rows.map(toFolder);
          }),
        )
        .handle("setFolderHidden", ({ params, payload }) =>
          updateFolder(params.folderId, (row) => ({
            ...row,
            hidden: payload.hidden,
          })),
        )
        .handle("shareFolder", ({ params, payload }) =>
          updateFolder(params.folderId, (row) => ({
            ...row,
            visibility: "shared",
            memberIds: [
              ...row.memberIds,
              ...payload.userIds.filter((id) => !row.memberIds.includes(id)),
            ],
          })),
        )
        .handle("unshareFolder", ({ params, payload }) =>
          updateFolder(params.folderId, (row) => ({
            ...row,
            memberIds: row.memberIds.filter(
              (id) => !(payload.userIds as ReadonlyArray<string>).includes(id),
            ),
          })),
        )
        .handle("leaveFolder", ({ params }) =>
          updateFolder(params.folderId, (row) => ({
            ...row,
            memberIds: row.memberIds.filter((id) => id !== viewer.id),
          })).pipe(Effect.asVoid),
        )
        .handle("setFolderAccess", ({ params, payload }) =>
          updateFolder(params.folderId, (row) => ({
            ...row,
            visibility: payload.visibility,
          })),
        )
        .handle("setFolderOwner", ({ params, payload }) =>
          updateFolder(params.folderId, (row) => ({
            ...row,
            ownerUserId: payload.userId,
          })),
        )
        .handle("deleteFolder", ({ params }) =>
          Effect.gen(function* () {
            yield* folderRow(params.folderId);
            yield* Ref.update(threadFolders, (rows) =>
              rows.filter((row) => row.id !== params.folderId),
            );
            yield* Ref.update(threadFolderItems, (rows) =>
              rows.filter((row) => row.folderId !== params.folderId),
            );
          }),
        )
        .handle("board", () =>
          Effect.gen(function* () {
            const items = yield* Ref.get(threadFolderItems);
            const pins = yield* Ref.get(threadPins);
            const tags = yield* Ref.get(threadTagAssignments);
            const card = (jamId: string) => {
              const found = sampleThreads.find((thread) => thread.id === jamId);
              if (!found) return [];
              return [
                new ThreadCard({
                  ...found,
                  pinned: pins.some((pin) => pin.jamId === jamId),
                  tagIds: found.tagIds.concat(
                    tags
                      .filter((tag) => tag.jamId === jamId)
                      .map((tag) => tag.tagId as (typeof found.tagIds)[number]),
                  ),
                }),
              ];
            };
            return (yield* visibleFolders)
              .filter((row) => !row.hidden)
              .map(
                (row) =>
                  new FolderBoardSection({
                    folder: toFolder(row),
                    items: items
                      .filter((item) => item.folderId === row.id)
                      .toSorted((a, b) => a.position - b.position)
                      .flatMap((item) => card(item.jamId)),
                  }),
              );
          }),
        )
        .handle("addToFolder", ({ params, payload }) =>
          Effect.gen(function* () {
            const folder = yield* folderRow(params.folderId);
            const results = outcomes(payload.jamIds);
            const rows = yield* Ref.get(threadFolderItems);
            const added = results
              .filter(
                (result) =>
                  result.outcome === "ok" &&
                  !rows.some(
                    (row) =>
                      row.folderId === folder.id && row.jamId === result.jamId,
                  ),
              )
              .map((result, index) => ({
                folderId: folder.id,
                jamId: result.jamId as string,
                position:
                  rows.filter((row) => row.folderId === folder.id).length +
                  index,
              }));
            yield* Ref.set(threadFolderItems, [...rows, ...added]);
            return new FolderItemsResult({
              items: yield* folderItems(folder),
              outcomes: results,
            });
          }),
        )
        .handle("removeFromFolder", ({ params, payload }) =>
          Effect.gen(function* () {
            const folder = yield* folderRow(params.folderId);
            const removed: ReadonlyArray<string> = payload.jamIds;
            yield* Ref.update(threadFolderItems, (rows) =>
              rows.filter(
                (row) =>
                  !(row.folderId === folder.id && removed.includes(row.jamId)),
              ),
            );
            return new FolderItemsResult({
              items: yield* folderItems(folder),
              outcomes: outcomes(payload.jamIds),
            });
          }),
        )
        .handle("reorderFolderItems", ({ params, payload }) =>
          Effect.gen(function* () {
            const folder = yield* folderRow(params.folderId);
            const order: ReadonlyArray<string> = payload.jamIds;
            const rank = (id: string) =>
              order.includes(id) ? order.indexOf(id) : order.length;
            const rows = yield* Ref.get(threadFolderItems);
            const reordered = rows
              .filter((row) => row.folderId === folder.id)
              .toSorted((a, b) => rank(a.jamId) - rank(b.jamId))
              .map((row, position) => ({ ...row, position }));
            yield* Ref.set(threadFolderItems, [
              ...rows.filter((row) => row.folderId !== folder.id),
              ...reordered,
            ]);
            return yield* folderItems(folder);
          }),
        )
        .handle("pin", ({ payload }) =>
          Effect.gen(function* () {
            const results = outcomes(payload.jamIds);
            yield* Ref.update(threadPins, (rows) => [
              ...rows,
              ...results
                .filter(
                  (result) =>
                    result.outcome === "ok" &&
                    !rows.some((row) => row.jamId === result.jamId),
                )
                .map((result) => ({ jamId: result.jamId as string })),
            ]);
            rememberPins((yield* Ref.get(threadPins)).map((row) => row.jamId));
            return new JamBatchResult({ outcomes: results });
          }),
        )
        .handle("unpin", ({ payload }) =>
          Effect.gen(function* () {
            const removed: ReadonlyArray<string> = payload.jamIds;
            yield* Ref.update(threadPins, (rows) =>
              rows.filter((row) => !removed.includes(row.jamId)),
            );
            rememberPins((yield* Ref.get(threadPins)).map((row) => row.jamId));
            return new JamBatchResult({ outcomes: outcomes(payload.jamIds) });
          }),
        )
        .handle("listTags", ({ query }) =>
          Effect.gen(function* () {
            const deleted = query.deleted === "true";
            return (yield* Ref.get(threadTags))
              .filter((row) => row.deleted === deleted)
              .map(toTag);
          }),
        )
        .handle("createTag", ({ payload }) =>
          Effect.gen(function* () {
            const row: Row<"threadTags"> = {
              id: newId("tag"),
              name: payload.name,
              color: payload.color,
              deleted: false,
              createdAt: now(),
            };
            yield* Ref.update(threadTags, (rows) => [...rows, row]);
            return toTag(row);
          }),
        )
        .handle("updateTag", ({ params, payload }) =>
          updateTag(params.tagId, (row) => ({
            ...row,
            name: payload.name ?? row.name,
            color: payload.color ?? row.color,
          })),
        )
        .handle("deleteTag", ({ params }) =>
          Effect.gen(function* () {
            yield* updateTag(params.tagId, (row) => ({
              ...row,
              deleted: true,
            }));
            yield* Ref.update(threadTagAssignments, (rows) =>
              rows.filter((row) => row.tagId !== params.tagId),
            );
          }),
        )
        .handle("restoreTag", ({ params }) =>
          updateTag(params.tagId, (row) => ({ ...row, deleted: false })),
        )
        .handle("tagsForThread", ({ params }) =>
          Effect.gen(function* () {
            if (!knownThread(params.jamId)) {
              return yield* new ThreadOrganizationNotFound();
            }
            const assigned = (yield* Ref.get(threadTagAssignments))
              .filter((row) => row.jamId === params.jamId)
              .map((row) => row.tagId);
            return (yield* Ref.get(threadTags))
              .filter((row) => !row.deleted && assigned.includes(row.id))
              .map((row) => {
                const tag = toTag(row);
                return new AssignedThreadTag({
                  id: tag.id,
                  name: tag.name,
                  color: tag.color,
                });
              });
          }),
        )
        .handle("assignTag", ({ params, payload }) =>
          Effect.gen(function* () {
            const tag = yield* tagRow(params.tagId);
            const rows = yield* Ref.get(threadTagAssignments);
            const results = payload.jamIds.map((jamId) => {
              if (!knownThread(jamId)) {
                return { jamId, outcome: "not_found" as const };
              }
              const count = rows.filter((row) => row.jamId === jamId).length;
              return {
                jamId,
                outcome:
                  count >= maxTagsPerThread
                    ? ("limit" as const)
                    : ("ok" as const),
              };
            });
            yield* Ref.set(threadTagAssignments, [
              ...rows,
              ...results
                .filter(
                  (result) =>
                    result.outcome === "ok" &&
                    !rows.some(
                      (row) =>
                        row.jamId === result.jamId && row.tagId === tag.id,
                    ),
                )
                .map((result) => ({
                  jamId: result.jamId as string,
                  tagId: tag.id,
                })),
            ]);
            return new TagAssignResult({ outcomes: results });
          }),
        )
        .handle("unassignTag", ({ params, payload }) =>
          Effect.gen(function* () {
            const tag = yield* tagRow(params.tagId);
            const removed: ReadonlyArray<string> = payload.jamIds;
            yield* Ref.update(threadTagAssignments, (rows) =>
              rows.filter(
                (row) => !(row.tagId === tag.id && removed.includes(row.jamId)),
              ),
            );
            return new JamBatchResult({ outcomes: outcomes(payload.jamIds) });
          }),
        );
    }),
);
