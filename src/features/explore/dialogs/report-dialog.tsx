import { useAtomSet } from "@effect/atom-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import {
  type ExploreCard,
  type ReportReason,
  reportTextMaxLength,
} from "@/data/api/schemas/explore";
import { reportListingAtom } from "@/data/atoms/explore";
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
import {
  MenuSelect,
  MenuSelectContent,
  MenuSelectItem,
  MenuSelectTrigger,
  MenuSelectValue,
} from "@/primitives/menu-select";
import { Textarea } from "@/primitives/textarea";
import { useOrgId, useSignedIn } from "../listing-detail/explore-session";
import { FlagGlyph } from "../listing-detail/glyphs";
import { SignInLink } from "../listing-detail/sign-in-link";

export const reportReasons: Record<ReportReason, string> = {
  broken: "It does not work",
  unsafe: "It looks unsafe",
  misleading: "It does not do what it says",
  outdated: "It is out of date",
  other: "Something else",
};

const reasonOrder: ReadonlyArray<ReportReason> = [
  "broken",
  "unsafe",
  "misleading",
  "outdated",
  "other",
];

export const reportPayload = (
  card: ExploreCard,
  reason: ReportReason,
  text: string,
) => {
  const trimmed = text.trim();
  return {
    kind: card.kind,
    slug: card.slug,
    reason,
    text: trimmed === "" ? undefined : trimmed,
  };
};

export type ReportDialogProps = {
  card: ExploreCard;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ReportDialog({ card, open, onOpenChange }: ReportDialogProps) {
  const orgId = useOrgId();
  const report = useAtomSet(reportListingAtom, { mode: "promise" });
  const [reason, setReason] = useState<ReportReason>("broken");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (orgId === undefined) return;
    setSending(true);
    report({ params: { orgId }, payload: reportPayload(card, reason, text) })
      .then(() => {
        toast.success("Report sent to Capy");
        setText("");
        onOpenChange(false);
      })
      .catch(() => toast.error("Could not send the report"))
      .finally(() => setSending(false));
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !sending && onOpenChange(next)}>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Report {card.displayName}</DialogTitle>
            <DialogDescription>Only Capy sees reports</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-foreground">
                Reason
              </span>
              <MenuSelect
                items={reportReasons}
                value={reason}
                onValueChange={(value) =>
                  value !== null && setReason(value as ReportReason)
                }
              >
                <MenuSelectTrigger className="w-full" aria-label="Reason">
                  <MenuSelectValue />
                </MenuSelectTrigger>
                <MenuSelectContent>
                  {reasonOrder.map((value) => (
                    <MenuSelectItem key={value} value={value}>
                      {reportReasons[value]}
                    </MenuSelectItem>
                  ))}
                </MenuSelectContent>
              </MenuSelect>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-foreground">
                Details, optional
              </span>
              <Textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="What happened"
                aria-label="Details"
                rows={4}
                maxLength={reportTextMaxLength}
                disabled={sending}
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              disabled={sending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              intent="accent"
              disabled={sending}
              aria-busy={sending || undefined}
            >
              Send report
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ReportAction({ card }: { card: ExploreCard }) {
  const signedIn = useSignedIn();
  const [open, setOpen] = useState(false);
  if (!signedIn)
    return (
      <SignInLink variant="ghost" size="xs" className="-ml-2 w-fit">
        <FlagGlyph size="xs" />
        Report
      </SignInLink>
    );
  return (
    <>
      <Button
        variant="ghost"
        size="xs"
        className="-ml-2 w-fit"
        onClick={() => setOpen(true)}
      >
        <FlagGlyph size="xs" />
        Report
      </Button>
      <ReportDialog card={card} open={open} onOpenChange={setOpen} />
    </>
  );
}
