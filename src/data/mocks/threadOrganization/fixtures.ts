import { DateTime } from "effect";
import {
  JamId,
  ProjectId,
  ThreadFolderId,
  ThreadTagId,
  UserId,
} from "../../api/schemas/ids.ts";
import {
  ThreadFolder,
  ThreadFolderItem,
  ThreadFolderMember,
  ThreadTag,
  type ThreadTagColor,
} from "../../api/schemas/threadOrganization.ts";
import type { Row } from "../db/MockDb.ts";
import { viewer, world } from "../fixtures/world.ts";

const at = (iso: string) => DateTime.makeUnsafe(iso);

export const toFolder = (row: Row<"threadFolders">) =>
  new ThreadFolder({
    id: ThreadFolderId.make(row.id),
    systemKind: null,
    visibility: row.visibility === "shared" ? "shared" : "private",
    section: row.section === "captains" ? "captains" : "threads",
    ownerUserId: UserId.make(row.ownerUserId),
    name: row.name,
    position: row.position,
    hidden: row.hidden,
    viewerRole:
      row.ownerUserId === viewer.id
        ? "owner"
        : row.memberIds.includes(viewer.id)
          ? "member"
          : "none",
    members: row.memberIds.map(
      (userId) =>
        new ThreadFolderMember({
          userId: UserId.make(userId),
          createdAt: at(row.updatedAt),
        }),
    ),
    createdAt: at(row.createdAt),
    updatedAt: at(row.updatedAt),
  });

export const toFolderItem = (
  row: Row<"threadFolderItems">,
  folder: Row<"threadFolders">,
) => {
  const projectId = Object.values(world.threads).find(
    (thread) => thread.id === row.jamId,
  )?.projectId;
  return new ThreadFolderItem({
    folderId: ThreadFolderId.make(row.folderId),
    jamId: JamId.make(row.jamId),
    projectId: projectId ? ProjectId.make(projectId) : null,
    position: row.position,
    createdAt: at(folder.createdAt),
    updatedAt: at(folder.updatedAt),
  });
};

export const toTag = (row: Row<"threadTags">) =>
  new ThreadTag({
    id: ThreadTagId.make(row.id),
    name: row.name,
    color: row.color as ThreadTagColor,
    deleted: row.deleted,
    createdAt: at(row.createdAt),
    updatedAt: at(row.createdAt),
  });
