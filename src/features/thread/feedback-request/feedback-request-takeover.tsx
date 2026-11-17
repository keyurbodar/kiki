import { useAtomSet } from "@effect/atom-react";
import { useState } from "react";
import type { FeedbackRequestRow } from "@/data/events";
import {
  feedbackRequestDeclineMutation,
  feedbackRequestSendMutation,
  jamEventKey,
} from "@/features/thread/request-takeover";
import {
  type FeedbackRequestAction,
  FeedbackRequestTakeoverView,
} from "./feedback-request-takeover-view";

export type FeedbackRequestTakeoverProps = {
  orgId: string | undefined;
  jamId: string;
  row: typeof FeedbackRequestRow.Type;
  onLater: () => void;
};

export function FeedbackRequestTakeover({
  orgId,
  jamId,
  row,
  onLater,
}: FeedbackRequestTakeoverProps) {
  const send = useAtomSet(feedbackRequestSendMutation, { mode: "promise" });
  const decline = useAtomSet(feedbackRequestDeclineMutation, {
    mode: "promise",
  });
  const [busy, setBusy] = useState<FeedbackRequestAction>();
  const [failed, setFailed] = useState(false);
  const run = (action: FeedbackRequestAction) => {
    if (orgId === undefined || busy !== undefined) return;
    setBusy(action);
    setFailed(false);
    (action === "send" ? send : decline)({
      params: { orgId, jamId, toolCallId: row.toolCallId },
      reactivityKeys: [jamEventKey(jamId)],
    }).then(
      () => setBusy(undefined),
      () => {
        setFailed(true);
        setBusy(undefined);
      },
    );
  };

  return (
    <FeedbackRequestTakeoverView
      busy={busy}
      failed={failed}
      onSend={orgId === undefined ? undefined : () => run("send")}
      onDecline={orgId === undefined ? undefined : () => run("decline")}
      onLater={onLater}
    />
  );
}
