import { RequestTakeoverView } from "@/features/thread/request-takeover";
import { Button } from "@/primitives/button";

export type FeedbackRequestAction = "send" | "decline";

export type FeedbackRequestTakeoverViewProps = {
  busy?: FeedbackRequestAction;
  failed?: boolean;
  onSend?: () => void;
  onDecline?: () => void;
  onLater: () => void;
};

export function FeedbackRequestTakeoverView({
  busy,
  failed = false,
  onSend,
  onDecline,
  onLater,
}: FeedbackRequestTakeoverViewProps) {
  return (
    <RequestTakeoverView
      label="Feedback"
      heading="Send this feedback to the Capy team?"
      reason="Includes your name and a link to this thread"
      status={failed ? "Couldn't send, try again" : undefined}
      onLater={onLater}
      actions={
        <>
          <Button
            size="xs"
            variant="ghost"
            disabled={busy !== undefined || onDecline === undefined}
            aria-busy={busy === "decline" || undefined}
            onClick={onDecline}
          >
            {busy === "decline" ? "Declining" : "Decline"}
          </Button>
          <Button
            size="xs"
            intent="accent"
            disabled={busy !== undefined || onSend === undefined}
            aria-busy={busy === "send" || undefined}
            onClick={onSend}
          >
            {busy === "send" ? "Sending" : "Send"}
          </Button>
        </>
      }
    />
  );
}
