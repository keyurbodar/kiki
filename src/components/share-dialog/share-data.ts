import { useAtomValue } from "@effect/atom-react";
import { Option } from "effect";
import { AsyncResult, Atom } from "effect/reactivity";
import { useMemo } from "react";
import { JamId, OrgId } from "@/data/api/schemas/ids";
import { queryTimeToLive, reactivityKeys } from "@/data/atoms/conventions";
import { currentUserAtom, organizationsAtom } from "@/data/atoms/session";
import { ApiClient } from "@/data/client/ApiClient";

export type Visibility = "shared" | "private";

export type PersonState =
  | "owner"
  | "named"
  | "unsubscribed"
  | "adding"
  | "dropping";

export type OrgMember = {
  readonly userId: string;
  readonly firstName: string | null;
  readonly lastName: string | null;
  readonly email: string | null;
  readonly imageUrl: string | null;
};

export type ThreadMember = {
  readonly userId: string;
  readonly subscribed: boolean;
};

export type ThreadShare = {
  readonly id: string;
  readonly userId: string | undefined;
  readonly projectId: string | undefined;
  readonly personal: boolean;
  readonly crewCount: number | undefined;
  readonly captain:
    | { readonly jamId: string; readonly name: string }
    | undefined;
  readonly membership:
    | {
        readonly viewerRole: string;
        readonly members: ReadonlyArray<ThreadMember>;
      }
    | undefined;
};

export type FolderSection = {
  readonly id: string;
  readonly name: string | null;
  readonly visibility: Visibility;
  readonly ownerUserId: string | null;
  readonly members: ReadonlyArray<{ readonly userId: string }>;
};

export const resultValue = <A, E>(result: AsyncResult.AsyncResult<A, E>) =>
  Option.getOrUndefined(AsyncResult.value(result));

const idleAtom = Atom.make(AsyncResult.initial(true));

export function useQueryValue<A, E>(
  atom: Atom.Atom<AsyncResult.AsyncResult<A, E>> | undefined,
): A | undefined {
  const result = useAtomValue(atom ?? idleAtom) as AsyncResult.AsyncResult<
    A,
    E
  >;
  return resultValue(result);
}

export const threadKeys = (
  orgId: string,
  jamId: string,
  viewerId: string | undefined,
) => [
  `jam:${jamId}`,
  `jam:${orgId}`,
  `jam_participant:${jamId}`,
  `jam_participant:${orgId}`,
  `captain:${jamId}`,
  reactivityKeys.threads(orgId),
  ...(viewerId === undefined ? [] : [`jam_participant:${viewerId}`]),
];

export const folderKeys = (orgId: string, viewerId: string | undefined) => [
  `thread_folder:${orgId}`,
  ...(viewerId === undefined ? [] : [`thread_folder_user:${viewerId}`]),
];

export const folderItemKeys = (orgId: string) => [
  `thread_folder_item:${orgId}`,
];

export const threadAccessKeys = (
  orgId: string,
  jamId: string,
  viewerId: string | undefined,
) => [
  ...threadKeys(orgId, jamId, viewerId),
  ...folderKeys(orgId, viewerId),
  ...folderItemKeys(orgId),
];

export const accessRequestKeys = (jamId: string) => [
  `jam_access_request:${jamId}`,
];

export const inviteThreadMembersAtom = ApiClient.mutation(
  "jams",
  "inviteThreadMembers",
);
export const removeThreadMembersAtom = ApiClient.mutation(
  "jams",
  "removeThreadMembers",
);
export const setThreadAccessAtom = ApiClient.mutation(
  "jams",
  "setThreadAccess",
);
export const setThreadOwnerAtom = ApiClient.mutation("jams", "setThreadOwner");
export const declineThreadAccessRequestAtom = ApiClient.mutation(
  "jams",
  "declineThreadAccessRequest",
);
export const shareFolderAtom = ApiClient.mutation(
  "threadOrganization",
  "shareFolder",
);
export const unshareFolderAtom = ApiClient.mutation(
  "threadOrganization",
  "unshareFolder",
);
export const setFolderAccessAtom = ApiClient.mutation(
  "threadOrganization",
  "setFolderAccess",
);

const splitKey = (key: string) => key.split("/") as [string, string];

export const threadShareAtom = Atom.family((key: string) => {
  const [orgId, jamId] = splitKey(key);
  return ApiClient.query("jams", "get", {
    params: { orgId: OrgId.make(orgId), jamId: JamId.make(jamId) },
    reactivityKeys: [`jam:${jamId}`, `jam_participant:${jamId}`],
    timeToLive: queryTimeToLive,
  });
});

export const threadAccessRequestsAtom = Atom.family((key: string) => {
  const [orgId, jamId] = splitKey(key);
  return ApiClient.query("jams", "threadAccessRequests", {
    params: { orgId: OrgId.make(orgId), jamId: JamId.make(jamId) },
    reactivityKeys: accessRequestKeys(jamId),
    timeToLive: queryTimeToLive,
  });
});

export const orgMembersAtom = Atom.family((orgId: string) =>
  ApiClient.query("members", "listMembers", {
    params: { orgId: OrgId.make(orgId) },
    query: {},
    reactivityKeys: [`member:${orgId}`],
    timeToLive: queryTimeToLive,
  }),
);

export const foldersAtom = Atom.family((key: string) => {
  const [orgId, viewerId] = splitKey(key);
  return ApiClient.query("threadOrganization", "manifest", {
    params: { orgId: OrgId.make(orgId) },
    reactivityKeys: folderKeys(orgId, viewerId === "" ? undefined : viewerId),
    timeToLive: queryTimeToLive,
  });
});

type Json = Record<string, unknown>;

const isRecord = (value: unknown): value is Json =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const text = (value: unknown) => (typeof value === "string" ? value : null);

const listOf = (value: unknown) => (Array.isArray(value) ? value : []);

const idOf = (value: unknown) =>
  typeof value === "string"
    ? value
    : isRecord(value)
      ? (text(value.userId) ?? text(value.id))
      : null;

export const readOrgMembers = (value: unknown): ReadonlyArray<OrgMember> =>
  listOf(isRecord(value) ? value.members : value).flatMap((entry) => {
    const userId = idOf(entry);
    if (userId === null || !isRecord(entry)) return [];
    return [
      {
        userId,
        firstName: text(entry.firstName),
        lastName: text(entry.lastName),
        email: text(entry.email),
        imageUrl: text(entry.imageUrl),
      },
    ];
  });

export const readThreadShare = (value: unknown): ThreadShare | undefined => {
  if (!isRecord(value)) return undefined;
  const id = text(value.id);
  if (id === null) return undefined;
  const membership = isRecord(value.membership)
    ? {
        viewerRole: text(value.membership.viewerRole) ?? "member",
        members: listOf(value.membership.members).flatMap((entry) => {
          const userId = idOf(entry);
          return userId === null
            ? []
            : [
                {
                  userId,
                  subscribed: !isRecord(entry) || entry.subscribed !== false,
                },
              ];
        }),
      }
    : Array.isArray(value.memberIds)
      ? {
          viewerRole: text(value.viewerRole) ?? "member",
          members: value.memberIds.flatMap((entry) => {
            const userId = idOf(entry);
            return userId === null ? [] : [{ userId, subscribed: true }];
          }),
        }
      : undefined;
  const captain = isRecord(value.captain) ? value.captain : undefined;
  const captainJamId = captain === undefined ? null : text(captain.jamId);
  return {
    id,
    userId: text(value.userId) ?? text(value.ownerId) ?? undefined,
    projectId: text(value.projectId) ?? undefined,
    personal: value.personal === true,
    crewCount:
      typeof value.crewCount === "number" ? value.crewCount : undefined,
    captain:
      captain === undefined || captainJamId === null
        ? undefined
        : { jamId: captainJamId, name: text(captain.name) ?? "" },
    membership,
  };
};

export const readAccessRequests = (
  value: unknown,
): ReadonlyArray<{ readonly userId: string }> =>
  listOf(isRecord(value) ? value.requests : value).flatMap((entry) => {
    const userId = idOf(entry);
    return userId === null ? [] : [{ userId }];
  });

export const readFolders = (value: unknown): ReadonlyArray<FolderSection> =>
  listOf(isRecord(value) ? value.folders : value).flatMap((entry) => {
    if (!isRecord(entry)) return [];
    const id = text(entry.id);
    if (id === null) return [];
    const visibility = text(entry.visibility) ?? text(entry.access);
    return [
      {
        id,
        name: text(entry.name),
        visibility: visibility === "private" ? "private" : "shared",
        ownerUserId: text(entry.ownerUserId) ?? text(entry.ownerId),
        members: listOf(entry.members ?? entry.sharedWith).flatMap((member) => {
          const userId = idOf(member);
          return userId === null ? [] : [{ userId }];
        }),
      },
    ];
  });

export const displayName = (member: OrgMember) =>
  [member.firstName, member.lastName]
    .flatMap((part) =>
      part === null || part.trim() === "" ? [] : [part.trim()],
    )
    .join(" ") ||
  member.email ||
  undefined;

export function useActiveOrg() {
  return resultValue(useAtomValue(organizationsAtom))?.[0];
}

export function useViewer() {
  return resultValue(useAtomValue(currentUserAtom));
}

const noMembers: ReadonlyArray<OrgMember> = [];

export function usePeople() {
  const orgId = useActiveOrg()?.id;
  const raw = useQueryValue(
    orgId === undefined ? undefined : orgMembersAtom(orgId),
  );
  return useMemo(() => {
    const members = raw === undefined ? noMembers : readOrgMembers(raw);
    const find = (userId: string) =>
      members.find((member) => member.userId === userId);
    return {
      members,
      nameOf: (userId: string) => {
        const member = find(userId);
        return member === undefined ? userId : (displayName(member) ?? userId);
      },
      avatarOf: (userId: string) => find(userId)?.imageUrl ?? undefined,
    };
  }, [raw]);
}
