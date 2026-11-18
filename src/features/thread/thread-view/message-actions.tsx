import { useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import { type ReactNode, useMemo } from "react";
import { orgMembersAtom } from "@/data/atoms/activity";
import { currentUserAtom } from "@/data/atoms/session";
import type { Actor } from "@/data/events";
import {
  type MessageActions,
  MessageActionsProvider,
  type MessageActor,
} from "@/features/thread/message-footer";

type MemberRecord = { name: string; imageUrl: string | null };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const text = (value: unknown) =>
  typeof value === "string" && value !== "" ? value : undefined;

/** Maps the undecoded member rows to the name and avatar a message row needs. */
const toMembers = (response: unknown): ReadonlyMap<string, MemberRecord> => {
  const list = Array.isArray(response)
    ? response
    : isRecord(response)
      ? (Object.values(response).find(Array.isArray) ?? [])
      : [];
  const members = new Map<string, MemberRecord>();
  for (const item of list) {
    if (!isRecord(item)) continue;
    const user = isRecord(item.user) ? item.user : item;
    const id = text(user.id);
    if (id === undefined) continue;
    const name =
      text(user.name) ??
      [text(user.firstName), text(user.lastName)].filter(Boolean).join(" ");
    members.set(id, {
      name: name === "" ? id : name,
      imageUrl: text(user.imageUrl) ?? null,
    });
  }
  return members;
};

/**
 * Tells the chat list who is reading it: the viewer's own id (so their messages
 * align and can offer edit), the member names and avatars behind each actor, and
 * the clock the relative stamps read. Without it a message row renders read-only
 * and a user message shows its raw id instead of the sender's name.
 */
export function ThreadMessageActions({
  orgId,
  children,
}: {
  orgId: string | undefined;
  children: ReactNode;
}) {
  const user = useAtomValue(currentUserAtom);
  const viewerUserId = AsyncResult.isSuccess(user) ? user.value.id : undefined;
  const memberResult = useAtomValue(orgMembersAtom(orgId ?? ""));
  const byId = useMemo(
    () =>
      toMembers(
        AsyncResult.isSuccess(memberResult) ? memberResult.value : undefined,
      ),
    [memberResult],
  );
  const actions = useMemo<MessageActions>(
    () => ({
      now: Date.now(),
      viewerUserId,
      resolveActor: (actor: Actor): MessageActor | undefined => {
        if (actor.type !== "user") return undefined;
        const member = byId.get(actor.userId);
        return member === undefined
          ? undefined
          : { name: member.name, imageUrl: member.imageUrl };
      },
    }),
    [byId, viewerUserId],
  );
  return (
    <MessageActionsProvider value={actions}>{children}</MessageActionsProvider>
  );
}
