import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { Option } from "effect";
import { AsyncResult } from "effect/reactivity";
import type { ComposerDelivery, ComposerPayload } from "@/components/composer";
import type { EventId, JamId, OrgId } from "@/data/api/schemas/ids";
import { reactivityKeys } from "@/data/atoms/conventions";
import { jamEventKey, sendMessageAtom } from "@/data/atoms/events";
import {
  currentUserAtom,
  organizationsAtom,
  resolveActiveOrgId,
  selectedOrgIdAtom,
} from "@/data/atoms/session";
import {
  appendPendingAtom,
  refreshNewestAtom,
  removePendingAtom,
  threadKey,
} from "@/features/thread/timeline";
import { toast } from "@/primitives/toaster";

/** The text a send could not submit, handed back so the composer can restore it. */
export type ComposerSendFailure = (payload: ComposerPayload) => void;

/**
 * The composer's submit for a thread screen: appends the message optimistically,
 * sends the typed text to `jamId`, and answers whether it was accepted. The
 * row the store appends replaces the pending one by client key. `editOf` names
 * the sent message the text replaces, so the send is an edit rather than a new
 * message. Without a thread to send to, the composer keeps its text.
 */
export function useComposerSend(
  jamId?: string,
  editOf?: EventId,
  onFailed?: ComposerSendFailure,
) {
  const organizations =
    Option.getOrUndefined(AsyncResult.value(useAtomValue(organizationsAtom))) ??
    [];
  const orgId = resolveActiveOrgId(
    organizations,
    useAtomValue(selectedOrgIdAtom),
  );
  const viewerId = Option.getOrUndefined(
    AsyncResult.value(useAtomValue(currentUserAtom)),
  )?.id;
  const key =
    jamId === undefined || orgId === undefined
      ? ""
      : threadKey(orgId as OrgId, jamId as JamId);
  const send = useAtomSet(sendMessageAtom, { mode: "promise" });
  const appendPending = useAtomSet(appendPendingAtom(key));
  const removePending = useAtomSet(removePendingAtom(key));
  const refresh = useAtomSet(refreshNewestAtom(key), { mode: "promise" });
  return (payload: ComposerPayload, delivery: ComposerDelivery = "steer") => {
    if (jamId === undefined || orgId === undefined) return false;
    const clientKey = crypto.randomUUID();
    if (viewerId !== undefined)
      appendPending({
        clientKey,
        text: payload.text,
        mentions: payload.mentions,
        delivery,
        userId: viewerId,
      });
    send({
      params: { orgId, jamId },
      payload: {
        text: payload.text,
        delivery,
        clientKey,
        ...(payload.mentions.length === 0
          ? {}
          : { mentions: payload.mentions }),
        ...(payload.files.length === 0 ? {} : { files: payload.files }),
        ...(editOf === undefined ? {} : { editOf }),
      },
      reactivityKeys: [jamEventKey(jamId), reactivityKeys.threads(orgId)],
    })
      .then(() => refresh())
      .catch(() => {
        removePending(clientKey);
        onFailed?.(payload);
        toast.error("Could not send the message");
      });
    return true;
  };
}
