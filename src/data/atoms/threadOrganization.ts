import { Atom } from "effect/reactivity";
import type { JamId, OrgId } from "../api/schemas/ids.ts";
import { ApiClient } from "../client/ApiClient.ts";
import { queryTimeToLive, reactivityKeys } from "./conventions.ts";

export const threadOrganizationKeys = (orgId: OrgId) => [
  reactivityKeys.threads(orgId),
  reactivityKeys.threadOrganization(orgId),
];

export const foldersAtom = Atom.family((orgId: OrgId) =>
  ApiClient.query("threadOrganization", "manifest", {
    params: { orgId },
    reactivityKeys: [reactivityKeys.threadOrganization(orgId)],
    timeToLive: queryTimeToLive,
  }),
);

export const folderBoardAtom = Atom.family((orgId: OrgId) =>
  ApiClient.query("threadOrganization", "board", {
    params: { orgId },
    reactivityKeys: threadOrganizationKeys(orgId),
    timeToLive: queryTimeToLive,
  }),
);

export const tagsAtom = Atom.family((orgId: OrgId) =>
  ApiClient.query("threadOrganization", "listTags", {
    params: { orgId },
    query: {},
    reactivityKeys: [reactivityKeys.threadOrganization(orgId)],
    timeToLive: queryTimeToLive,
  }),
);

export const threadTagsKey = (orgId: OrgId, jamId: JamId) =>
  `${orgId}/${jamId}`;

export const threadTagsAtom = Atom.family((key: string) => {
  const [orgId, jamId] = key.split("/") as [OrgId, JamId];
  return ApiClient.query("threadOrganization", "tagsForThread", {
    params: { orgId, jamId },
    reactivityKeys: threadOrganizationKeys(orgId),
    timeToLive: queryTimeToLive,
  });
});

export const pinThreadsAtom = ApiClient.mutation("threadOrganization", "pin");

export const unpinThreadsAtom = ApiClient.mutation(
  "threadOrganization",
  "unpin",
);

export const createFolderAtom = ApiClient.mutation(
  "threadOrganization",
  "createFolder",
);

export const renameFolderAtom = ApiClient.mutation(
  "threadOrganization",
  "renameFolder",
);

export const deleteFolderAtom = ApiClient.mutation(
  "threadOrganization",
  "deleteFolder",
);

export const addToFolderAtom = ApiClient.mutation(
  "threadOrganization",
  "addToFolder",
);

export const removeFromFolderAtom = ApiClient.mutation(
  "threadOrganization",
  "removeFromFolder",
);

export const createTagAtom = ApiClient.mutation(
  "threadOrganization",
  "createTag",
);

export const assignTagAtom = ApiClient.mutation(
  "threadOrganization",
  "assignTag",
);

export const unassignTagAtom = ApiClient.mutation(
  "threadOrganization",
  "unassignTag",
);
