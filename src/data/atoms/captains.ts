import { Atom } from "effect/reactivity";
import type { OrgId } from "../api/schemas/ids.ts";
import { ApiClient } from "../client/ApiClient.ts";
import { queryTimeToLive } from "./conventions.ts";

export const captainReactivityKeys = {
  library: (orgId: string) => `captain_library_image:${orgId}`,
  captain: (id: string) => `captain:${id}`,
  jam: (id: string) => `jam:${id}`,
  jamRelation: (orgId: string) => `jam_relation:${orgId}`,
  jamParticipant: (orgId: string) => `jam_participant:${orgId}`,
  jamEvent: (id: string) => `jam_event:${id}`,
  threadFolder: (orgId: string) => `thread_folder:${orgId}`,
  threadFolderItem: (orgId: string) => `thread_folder_item:${orgId}`,
} as const;

export const captainsAtom = Atom.family((orgId: OrgId) =>
  ApiClient.query("captains", "list", {
    params: { orgId },
    query: {},
    reactivityKeys: [captainReactivityKeys.captain(orgId)],
    timeToLive: queryTimeToLive,
  }),
);

export const captainLibraryAtom = Atom.family((orgId: OrgId) =>
  ApiClient.query("captains", "listLibrary", {
    params: { orgId },
    reactivityKeys: [
      captainReactivityKeys.library(orgId),
      captainReactivityKeys.captain(orgId),
    ],
    timeToLive: queryTimeToLive,
  }),
);

export const createCaptainAtom = ApiClient.mutation("captains", "create");
export const updateCaptainAtom = ApiClient.mutation("captains", "update");
export const deleteCaptainAtom = ApiClient.mutation("captains", "delete");
export const demoteCaptainAtom = ApiClient.mutation("captains", "demote");
export const promoteThreadAtom = ApiClient.mutation(
  "captains",
  "promoteThread",
);
export const promoteFolderAtom = ApiClient.mutation(
  "captains",
  "promoteFolder",
);
export const uploadCaptainImageAtom = ApiClient.mutation(
  "captains",
  "uploadImage",
);
export const uploadCaptainLibraryImageAtom = ApiClient.mutation(
  "captains",
  "uploadLibraryImage",
);
export const removeCaptainLibraryImageAtom = ApiClient.mutation(
  "captains",
  "removeLibraryImage",
);
export const joinCaptainCrewAtom = ApiClient.mutation("captains", "joinCrew");
export const archiveJamsAtom = ApiClient.mutation("jams", "archive");
export const unarchiveJamsAtom = ApiClient.mutation("jams", "unarchive");
