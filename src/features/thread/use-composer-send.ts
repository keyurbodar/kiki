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

/**
 * The composer's submit for a thread screen: sends the typed text to `jamId`
 * and answers whether it was accepted. Without a thread to send to, the
 * composer keeps its text.
 */
export function useComposerSend(jamId?: string) {
  const organizations =
    Option.getOrUndefined(AsyncResult.value(useAtomValue(organizationsAtom))) ??
    [];
  const orgId = resolveActiveOrgId(
    organizations,
    useAtomValue(selectedOrgIdAtom),
  );
  const send = useAtomSet(sendMessageAtom, { mode: "promise" });
  return (payload: ComposerPayload) => {
    if (jamId === undefined || orgId === undefined) return false;
    send({
      params: { orgId, jamId },
      payload: {
        text: payload.text,
        ...(payload.files.length === 0 ? {} : { files: payload.files }),
      },
      reactivityKeys: [jamEventKey(jamId)],
    }).catch(() => toast.error("Could not send the message"));
    return true;
  };
}
