import { AsyncResult, Atom } from "effect/reactivity";
import { ApiClient } from "../client/ApiClient.ts";
import { queryTimeToLive } from "./conventions.ts";
import { idleAtom } from "./idle.ts";

/**
 * The org's member directory, read only for the face each thread row paints:
 * Capy's rows resolve a thread's author to their image from this list.
 */
export const membersAtom = Atom.family((orgId: string) =>
  ApiClient.query("members", "listMembers", {
    params: { orgId },
    query: {},
    reactivityKeys: [`member:${orgId}`],
    timeToLive: queryTimeToLive,
  }),
);

/** userId → image URL, from the undecoded member list Capy serves. */
export const memberAvatars = (value: unknown): ReadonlyMap<string, string> => {
  const rows = Array.isArray(value)
    ? value
    : typeof value === "object" && value !== null
      ? ((value as { members?: unknown }).members ?? [])
      : [];
  const avatars = new Map<string, string>();
  if (!Array.isArray(rows)) return avatars;
  for (const row of rows) {
    if (typeof row !== "object" || row === null) continue;
    const entry = row as { id?: unknown; userId?: unknown; imageUrl?: unknown };
    const id = typeof entry.userId === "string" ? entry.userId : entry.id;
    if (typeof id !== "string" || typeof entry.imageUrl !== "string") continue;
    if (entry.imageUrl === "") continue;
    avatars.set(id, entry.imageUrl);
  }
  return avatars;
};

export type MemberFace = {
  readonly id: string;
  readonly name: string;
};

/**
 * userId → the display name a filter prints, from the undecoded member list.
 * Rows the directory carries without a name are skipped.
 */
export const memberNames = (value: unknown): ReadonlyMap<string, string> => {
  const rows = Array.isArray(value)
    ? value
    : typeof value === "object" && value !== null
      ? ((value as { members?: unknown }).members ?? [])
      : [];
  const names = new Map<string, string>();
  if (!Array.isArray(rows)) return names;
  for (const row of rows) {
    if (typeof row !== "object" || row === null) continue;
    const entry = row as {
      id?: unknown;
      userId?: unknown;
      firstName?: unknown;
      lastName?: unknown;
      name?: unknown;
    };
    const id = typeof entry.userId === "string" ? entry.userId : entry.id;
    if (typeof id !== "string") continue;
    const name =
      typeof entry.name === "string"
        ? entry.name
        : [entry.firstName, entry.lastName]
            .filter((part): part is string => typeof part === "string")
            .join(" ")
            .trim();
    if (name !== "") names.set(id, name);
  }
  return names;
};

/** The member list a surface reads while its org is still resolving. */
export const idleMembersAtom: ReturnType<typeof membersAtom> = Atom.make(
  AsyncResult.initial(false),
) as ReturnType<typeof membersAtom>;

export const idleMemberNames = idleAtom<ReadonlyMap<string, string>>();

/** The member avatars while the org is unknown, so nothing requests a placeholder org. */
export const idleMemberAvatars = idleAtom<ReadonlyMap<string, string>>();
