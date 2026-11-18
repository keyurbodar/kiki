import { type FormEvent, useState } from "react";
import { Button } from "@/primitives/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/primitives/dialog";
import { Textarea } from "@/primitives/textarea";
import { toast } from "@/primitives/toaster";

export type FeedbackPayload = {
  message: string;
  orgId: string | undefined;
  page: string;
  buildId: string;
};

export type FeedbackDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId?: string;
  submitFeedback: (payload: FeedbackPayload) => Promise<unknown>;
};

export const feedbackBuildId: string = import.meta.env.VITE_BUILD_ID ?? "dev";

export function feedbackPayload(
  message: string,
  orgId: string | undefined,
  location: Pick<Location, "origin" | "pathname">,
): FeedbackPayload | undefined {
  const trimmed = message.trim();
  if (trimmed === "") return undefined;
  return {
    message: trimmed,
    orgId,
    page: `${location.origin}${location.pathname}`,
    buildId: feedbackBuildId,
  };
}

export function FeedbackDialog({
  open,
  onOpenChange,
  orgId,
  submitFeedback,
}: FeedbackDialogProps) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = feedbackPayload(message, orgId, window.location);
    if (payload === undefined) return;
    setSending(true);
    submitFeedback(payload)
      .then(() => {
        toast.success("Feedback sent");
        setMessage("");
        onOpenChange(false);
      })
      .catch(() => toast.error("Could not send feedback"))
      .finally(() => setSending(false));
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (sending) return;
        if (!next) setMessage("");
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Send feedback</DialogTitle>
            <DialogDescription>
              What can we do to improve Capy?
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Share your feedback"
              aria-label="Feedback"
              rows={4}
              maxLength={3000}
              disabled={sending}
              autoFocus
            />
          </DialogBody>
          <DialogFooter>
            <Button
              data-track-owner="shared/feedback-dialog.tsx#FeedbackDialog:Button[Cancel]"
              type="button"
              variant="ghost"
              disabled={sending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              data-track-owner="shared/feedback-dialog.tsx#FeedbackDialog:Button[Send feedback]"
              type="submit"
              intent="accent"
              disabled={sending || message.trim() === ""}
              aria-busy={sending || undefined}
            >
              Send feedback
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
