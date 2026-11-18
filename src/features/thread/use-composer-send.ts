import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { Option } from "effect";
import { AsyncResult } from "effect/reactivity";
import { toast } from "sonner";
import type { ComposerPayload } from "@/components/composer";
import { jamEventKey, sendMessageAtom } from "@/data/atoms/events";
import {
  organizationsAtom,
  resolveActiveOrgId,
  selectedOrgIdAtom,
} from "@/data/atoms/session";
import type { OrgId } from "@/data/api/schemas/ids";
import type { EventId } from "@/data/events";
import {
  refreshNewestAtom,
  threadKey,
} from "@/features/thread/timeline/use-thread-timeline";

/**
 * The composer's submit for a thread screen: sends the typed text to `jamId`
 * and answers whether it was accepted. `editOf` names the sent message the text
 * replaces, so the send is an edit rather than a new message. Without a thread
 * to send to, the composer keeps its text.
 */
export function useComposerSend(jamId?: string, editOf?: EventId) {
  const organizations =
    Option.getOrUndefined(AsyncResult.value(useAtomValue(organizationsAtom))) ??
    [];
  const orgId = resolveActiveOrgId(
    organizations,
    useAtomValue(selectedOrgIdAtom),
  );
  const send = useAtomSet(sendMessageAtom, { mode: "promise" });
  const refresh = useAtomSet(
    refreshNewestAtom(
      jamId === undefined || orgId === undefined
        ? ""
        : threadKey(orgId as OrgId, jamId as never),
    ),
    { mode: "promise" },
  );
  return (payload: ComposerPayload) => {
    if (jamId === undefined || orgId === undefined) return false;
    send({
      params: { orgId, jamId },
      payload: {
        text: payload.text,
        ...(payload.files.length === 0 ? {} : { files: payload.files }),
        ...(editOf === undefined ? {} : { editOf }),
      },
      reactivityKeys: [jamEventKey(jamId)],
    })
      .then(() => refresh())
      .catch(() => toast.error("Could not send the message"));
    return true;
  };
}
