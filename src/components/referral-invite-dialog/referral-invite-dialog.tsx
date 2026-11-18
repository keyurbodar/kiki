import { type ComponentProps, useState } from "react";
import { Badge } from "@/primitives/badge";
import { Button } from "@/primitives/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
} from "@/primitives/dialog";
import { Icon } from "@/primitives/icon";
import { Label } from "@/primitives/label";
import { toast } from "@/primitives/toaster";
import {
  addEmails,
  inviteDailyLimit,
  invitedSummary,
  inviteLabel,
  isValidInviteEmail,
  splitEmails,
} from "./invite-emails";

export type ReferralInviteDialogProps = Omit<
  ComponentProps<"div">,
  "onSubmit"
> & {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  remaining?: number;
  onSend?: (emails: string[]) => Promise<number> | number;
};

export function ReferralInviteDialog({
  open = false,
  onOpenChange,
  remaining = inviteDailyLimit,
  onSend = (emails) => emails.length,
}: ReferralInviteDialogProps) {
  const [emails, setEmails] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const invalid = emails.filter((e) => !isValidInviteEmail(e));
  const over = Math.max(0, emails.length - remaining);
  const commit = (text: string) => {
    const incoming = splitEmails(text);
    if (incoming.length > 0) setEmails((prev) => addEmails(prev, incoming));
    setDraft("");
  };
  const close = (next: boolean) => {
    if (!next) {
      setEmails([]);
      setDraft("");
    }
    onOpenChange?.(next);
  };
  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogOverlay />
      <DialogContent>
        <form
          className="contents"
          onSubmit={async (e) => {
            e.preventDefault();
            setSending(true);
            const sent = await onSend(emails);
            setSending(false);
            toast.success(invitedSummary(sent, emails.length));
            close(false);
          }}
        >
          <DialogHeader>
            <DialogTitle>Invite friends to Capy</DialogTitle>
            <DialogDescription>
              Up to {inviteDailyLimit} invitations a day, you both get up to
              $500 in credits after their first full-price payment
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="flex flex-col gap-2">
            <Label htmlFor="referral-invite-emails">Email addresses</Label>
            {/* biome-ignore lint/a11y/noStaticElementInteractions: clicking the chip box focuses its input, as in Capy */}
            {/* biome-ignore lint/a11y/useKeyWithClickEvents: the input inside handles the keyboard */}
            <div
              className="flex min-h-24 flex-wrap content-start items-center gap-1.5 rounded border border-border-2 bg-input p-2 focus-within:outline-1 focus-within:outline-solid focus-within:outline-ring focus-within:-outline-offset-1"
              onClick={(e) => e.currentTarget.querySelector("input")?.focus()}
            >
              {emails.map((email) => {
                const valid = isValidInviteEmail(email);
                return (
                  <Badge
                    key={email}
                    color={valid ? "neutral" : "danger"}
                    className="max-w-full gap-1 pr-1"
                    aria-label={
                      valid
                        ? `${email}, valid`
                        : `${email}, not a valid email address`
                    }
                  >
                    <span className="truncate">{email}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${email}`}
                      className="grid size-4 cursor-pointer place-items-center rounded-full opacity-60 hover:opacity-100"
                      onClick={() =>
                        setEmails((prev) => prev.filter((e) => e !== email))
                      }
                    >
                      <Icon name="x" className="size-(--icon-xs)" />
                    </button>
                  </Badge>
                );
              })}
              <input
                id="referral-invite-emails"
                type="email"
                autoComplete="off"
                aria-describedby="referral-invite-help"
                placeholder={
                  emails.length === 0 ? "friend@example.com" : undefined
                }
                className="h-6 min-w-40 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground-3"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={() => commit(draft)}
                onPaste={(e) => {
                  e.preventDefault();
                  commit(`${draft} ${e.clipboardData.getData("text")}`);
                }}
                onKeyDown={(e) => {
                  if (["Enter", ",", " ", "Tab"].includes(e.key)) {
                    if (draft.length === 0 && e.key !== "Tab")
                      e.preventDefault();
                    if (draft.length > 0) {
                      if (e.key !== "Tab") e.preventDefault();
                      commit(draft);
                    }
                  } else if (e.key === "Backspace" && draft === "") {
                    setEmails((prev) => prev.slice(0, -1));
                  }
                }}
              />
            </div>
            <div
              id="referral-invite-help"
              className="text-sm text-muted-foreground-2"
            >
              Press Enter or paste a list to add addresses
            </div>
            {(over > 0 || invalid.length > 0) && (
              <div role="status" className="text-sm text-muted-foreground-1">
                {over > 0
                  ? `Remove ${over} to stay within ${remaining} invitations`
                  : `Fix or remove ${invalid.length === 1 ? "the invalid address" : "the invalid addresses"}`}
              </div>
            )}
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => close(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              intent="accent"
              aria-busy={sending || undefined}
              disabled={
                emails.length === 0 || invalid.length > 0 || over > 0 || sending
              }
            >
              {sending ? "Sending" : inviteLabel(emails.length)}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
