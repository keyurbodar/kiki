import {
  type CaptainAvatarValue,
  defaultCaptainName,
  sameAvatar,
} from "./avatar";
import type { CrewDevice } from "./crew-device-select";

export type CaptainRole = "owner" | "member" | "none";

export type CaptainProfile = {
  readonly name: string;
  readonly alias: string | null;
  readonly description: string | null;
  readonly avatar: CaptainAvatarValue;
  readonly projectId: string | null;
  readonly projectName?: string;
  readonly ownerUserId: string;
  readonly ownerName?: string;
  readonly archived: boolean;
  readonly crew: ReadonlyArray<string>;
  readonly crewDevice: { readonly id: string; readonly name: string } | null;
  readonly viewerRole: CaptainRole;
};

export type CaptainDialogPage = "profile" | "description" | "demote" | "delete";

export type CaptainVisibility = "private" | "shared";

export type CaptainDialogRequest =
  | { readonly kind: "create" }
  | {
      readonly kind: "promote-thread";
      readonly thread: {
        readonly id: string;
        readonly title: string | null;
        readonly projectId: string | null;
        readonly personal: boolean;
        readonly memberIds?: ReadonlyArray<string>;
      };
    }
  | {
      readonly kind: "promote-folder";
      readonly folder: {
        readonly id: string;
        readonly name: string | null;
        readonly visibility: CaptainVisibility;
        readonly memberIds?: ReadonlyArray<string>;
      };
    }
  | {
      readonly kind: "edit";
      readonly jamId: string;
      readonly entry?: CaptainDialogPage;
      readonly profile: CaptainProfile;
      readonly devices?: ReadonlyArray<CrewDevice>;
    };

export const captainInviteLimit = 200;

export const dialogTitle = (request: CaptainDialogRequest) =>
  request.kind === "create"
    ? "New Captain"
    : request.kind === "promote-thread"
      ? "Promote to Captain"
      : request.kind === "promote-folder"
        ? "Promote folder to Captain"
        : request.profile.name;

export const initialName = (request: CaptainDialogRequest) =>
  request.kind === "promote-thread"
    ? (request.thread.title ?? "")
    : request.kind === "promote-folder"
      ? (request.folder.name ?? "")
      : request.kind === "edit"
        ? request.profile.name
        : "";

export const initialVisibility = (
  request: CaptainDialogRequest,
): CaptainVisibility =>
  request.kind === "promote-thread"
    ? request.thread.personal
      ? "private"
      : "shared"
    : request.kind === "promote-folder"
      ? request.folder.visibility
      : "shared";

export const displayName = (name: string) =>
  name.trim() === "" ? defaultCaptainName : name;

export const submitLabel = (kind: CaptainDialogRequest["kind"]) =>
  kind === "create" ? "Create Captain" : kind === "edit" ? "Save" : "Promote";

export const submitLoadingLabel = (kind: CaptainDialogRequest["kind"]) =>
  kind === "create" ? "Creating" : kind === "edit" ? "Saving" : "Promoting";

export type ProfileDraft = {
  readonly name: string;
  readonly alias: string;
  readonly description: string;
  readonly avatar: CaptainAvatarValue;
  readonly crewDeviceId: string | null;
};

/** The fields an edit changes, as Capy's update payload, or undefined when nothing changed. */
export function profileChanges(profile: CaptainProfile, draft: ProfileDraft) {
  const alias = draft.alias.trim();
  const description = draft.description.trim();
  const aliasChanged = alias !== (profile.alias ?? "");
  const descriptionChanged = description !== (profile.description ?? "");
  const deviceChanged = draft.crewDeviceId !== (profile.crewDevice?.id ?? null);
  const changed =
    draft.name.trim() !== profile.name ||
    aliasChanged ||
    descriptionChanged ||
    !sameAvatar(draft.avatar, profile.avatar) ||
    deviceChanged;
  if (!changed) return undefined;
  return {
    name: draft.name.trim() || defaultCaptainName,
    avatar: draft.avatar,
    alias: aliasChanged ? (alias === "" ? null : alias) : undefined,
    description: descriptionChanged
      ? description === ""
        ? null
        : description
      : undefined,
    crewDeviceId: deviceChanged ? draft.crewDeviceId : undefined,
  };
}

export const singleLine = (value: string) => value.replace(/\s*\n\s*/g, " ");

export const demoteLines = (profile: CaptainProfile) => [
  `${profile.name} becomes an ordinary thread and keeps its history, pull requests, machine, and Drive`,
  profile.crew.length === 0
    ? "It has no crew threads"
    : `Its ${profile.crew.length === 1 ? "crew thread returns" : `${profile.crew.length} crew threads return`} to the ordinary list with their reports and pull requests`,
  "Its avatar and alias are removed, and Slack stops resolving its name",
];

export const deleteLines = (profile: CaptainProfile) => [
  `${profile.name} is deleted and its ${profile.crew.length === 1 ? "thread returns" : `${profile.crew.length} threads return`} to the ordinary list`,
  "Pending reports from the crew are dropped with it",
  profile.archived
    ? "Archived, it keeps its history and crew until deleted"
    : "Archive instead keeps the history and the crew",
];

export const crewCountLabel = (count: number) =>
  `${count} ${count === 1 ? "thread" : "threads"}`;

export const demotedTitle = (name: string) => `${name} is a thread again`;

export const demotedReleased = (released: number) =>
  released === 0
    ? "It had no crew threads"
    : `${released === 1 ? "Its crew thread is" : `Its ${released} crew threads are`} back in the ordinary list`;

export const errorDescription = (error: unknown, fallback: string) =>
  error instanceof Error && error.message !== "" ? error.message : fallback;

/** The new Captain's id from an undecoded create or promote response. */
export function createdCaptain(result: unknown, fallbackName: string) {
  const record =
    typeof result === "object" && result !== null
      ? (result as Record<string, unknown>)
      : {};
  const id = record.jamId ?? record.id;
  return {
    jamId: typeof id === "string" ? id : undefined,
    name: typeof record.name === "string" ? record.name : fallbackName,
  };
}
