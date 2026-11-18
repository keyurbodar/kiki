import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import { type ReactNode, useCallback, useMemo } from "react";
import type { JamId, OrgId } from "@/data/api/schemas/ids";
import { orgMembersAtom } from "@/data/atoms/activity";
import { currentUserAtom } from "@/data/atoms/session";
import type { Actor, EventId, MessageVersion } from "@/data/events";
import {
  type EditTarget,
  type MessageActions,
  MessageActionsProvider,
  type MessageActor,
  type ReplyTarget,
} from "@/features/thread/message-footer";
import { threadKey, viewedVersionAtom } from "@/features/thread/timeline";

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
 *
 * `reply`, `editMessage` and `editedRowIds` come from the thread screen and its
 * timeline: the first quotes a sent message into the composer, the second opens
 * the composer on one, and the third names the messages that replaced an
 * earlier version.
 */
export function ThreadMessageActions({
  orgId,
  jamId,
  reply,
  editMessage,
  editedRowIds,
  jumpToSection,
  children,
}: {
  orgId: string | undefined;
  /** The thread the rows belong to: the version switcher reads its versions there. */
  jamId?: string;
  reply?: (target: ReplyTarget) => void;
  editMessage?: (target: EditTarget) => void;
  editedRowIds?: ReadonlySet<string>;
  /** Scrolls the timeline to the row and section a quote points at. */
  jumpToSection?: (rowId: string, section: number) => void;
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
  const setViewedVersion = useAtomSet(
    viewedVersionAtom(
      threadKey((orgId ?? "") as OrgId, (jamId ?? "") as JamId),
    ),
  );
  const viewVersion = useCallback(
    (version: MessageVersion, root: EventId) =>
      setViewedVersion({ version, root }),
    [setViewedVersion],
  );
  const actions = useMemo<MessageActions>(
    () => ({
      now: Date.now(),
      orgId,
      jamId,
      viewerUserId,
      reply,
      editMessage,
      editedRowIds,
      jumpToSection,
      viewVersion:
        orgId === undefined || jamId === undefined ? undefined : viewVersion,
      resolveActor: (actor: Actor): MessageActor | undefined => {
        if (actor.type !== "user") return undefined;
        const member = byId.get(actor.userId);
        return member === undefined
          ? undefined
          : { name: member.name, imageUrl: member.imageUrl };
      },
    }),
    [
      byId,
      editedRowIds,
      editMessage,
      jamId,
      jumpToSection,
      orgId,
      reply,
      viewVersion,
      viewerUserId,
    ],
  );
  return (
    <MessageActionsProvider value={actions}>{children}</MessageActionsProvider>
  );
}
