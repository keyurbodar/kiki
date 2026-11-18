import { useAtomRefresh, useAtomSet } from "@effect/atom-react";
import { type KeyboardEvent, useState } from "react";
import { toast } from "sonner";
import { pullReviewersAtom } from "@/components/pull-view/atoms";
import { goneOr } from "@/components/pull-view/gone";
import {
  DotsHorizontalGlyph,
  RotateClockwiseGlyph,
} from "@/components/review-mode";
import { isPullClosed, type ReviewPull } from "@/components/review-section";
import { ApiClient } from "@/data/client/ApiClient";
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
import { Icon } from "@/primitives/icon";

import {
  ResponsiveMenu,
  ResponsiveMenuContent,
  ResponsiveMenuItem,
  ResponsiveMenuTrigger,
} from "@/primitives/responsive-menu";
import { Textarea } from "@/primitives/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";

export interface SubmittedReview {
  readonly githubReviewId: string;
  readonly reviewer: string;
  readonly state: string;
}

export const dismissReviewAtom = ApiClient.mutation("pulls", "dismissReview");
export const setReviewerAtom = ApiClient.mutation("pulls", "setReviewer");

export const isDismissable = (review: Pick<SubmittedReview, "state">) =>
  review.state === "approved" || review.state === "changes_requested";

export const dismissDescription = (review: SubmittedReview) =>
  `Dismisses ${review.reviewer}'s ${review.state === "approved" ? "approval" : "change request"} with a reason GitHub keeps`;

export const githubRefused = (error: unknown) =>
  toast.error("GitHub refused", {
    description:
      error instanceof Error ? error.message : "GitHub refused this action",
  });

const menuIcon =
  "flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted in-data-[intent=danger]:text-destructive";

export type ReviewRowMenuProps = {
  readonly pull: Pick<ReviewPull, "id" | "state" | "author">;
  readonly review: SubmittedReview;
  /** Without an org nothing renders, as in Capy. */
  readonly orgId: string | undefined;
  readonly defaultOpen?: boolean;
  readonly onDismissed?: (review: unknown) => void;
};

export function ReviewRowMenu({
  pull,
  review,
  orgId,
  defaultOpen,
  onDismissed,
}: ReviewRowMenuProps) {
  const setReviewer = useAtomSet(setReviewerAtom, { mode: "promise" });
  const refreshReviewers = useAtomRefresh(
    pullReviewersAtom(orgId ?? "", pull.id),
  );
  const [dismissing, setDismissing] = useState(false);
  const [busy, setBusy] = useState(false);
  if (orgId === undefined || isPullClosed(pull)) return null;
  const canRerequest = review.reviewer !== pull.author;
  const canDismiss = isDismissable(review);
  if (!canRerequest && !canDismiss) return null;

  const rerequest = () => {
    setBusy(true);
    setReviewer({
      params: { orgId, pullId: pull.id },
      payload: { login: review.reviewer, requested: true },
    })
      .then(() =>
        toast.success("Review re-requested", { description: review.reviewer }),
      )
      .catch((error: unknown) => {
        if (goneOr(error, "This review", refreshReviewers)) return;
        githubRefused(error);
      })
      .finally(() => setBusy(false));
  };

  return (
    <>
      <ResponsiveMenu defaultOpen={defaultOpen}>
        <Tooltip>
          <TooltipTrigger
            data-track-owner="shared/pull-view/review-row-menu.tsx#ReviewRowMenu:TooltipTrigger.1"
            render={
              <ResponsiveMenuTrigger
                data-track-owner="shared/pull-view/review-row-menu.tsx#ReviewRowMenu:ResponsiveMenuTrigger.1"
                render={
                  <Button
                    data-track-owner="shared/pull-view/review-row-menu.tsx#ReviewRowMenu:Button[Review actions]"
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Review actions"
                    disabled={busy}
                  />
                }
              >
                <DotsHorizontalGlyph />
              </ResponsiveMenuTrigger>
            }
          />
          <TooltipContent side="top">Review actions</TooltipContent>
        </Tooltip>
        <ResponsiveMenuContent align="end" className="w-52">
          {canRerequest && (
            <ResponsiveMenuItem
              data-track-owner="shared/pull-view/review-row-menu.tsx#ReviewRowMenu:ResponsiveMenuItem[Re request review]"
              onClick={rerequest}
            >
              <span className={menuIcon}>
                <RotateClockwiseGlyph />
              </span>
              Re-request review
            </ResponsiveMenuItem>
          )}
          {canDismiss && (
            <ResponsiveMenuItem
              data-track-owner="shared/pull-view/review-row-menu.tsx#ReviewRowMenu:ResponsiveMenuItem[Dismiss review]"
              data-intent="danger"
              onClick={() => setDismissing(true)}
            >
              <span className={menuIcon}>
                <Icon name="circle-x" size="sm" />
              </span>
              Dismiss review
            </ResponsiveMenuItem>
          )}
        </ResponsiveMenuContent>
      </ResponsiveMenu>
      <DismissReviewDialog
        pullId={pull.id}
        review={review}
        orgId={orgId}
        open={dismissing}
        onOpenChange={setDismissing}
        onDismissed={onDismissed}
      />
    </>
  );
}

export type DismissReviewDialogProps = {
  readonly pullId: string;
  readonly review: SubmittedReview;
  readonly orgId: string;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onDismissed?: (review: unknown) => void;
};

export function DismissReviewDialog({
  pullId,
  review,
  orgId,
  open,
  onOpenChange,
  onDismissed,
}: DismissReviewDialogProps) {
  const dismiss = useAtomSet(dismissReviewAtom, { mode: "promise" });
  const refreshReviewers = useAtomRefresh(
    pullReviewersAtom(orgId ?? "", pullId),
  );
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const message = reason.trim();

  const submit = () => {
    if (message === "" || pending) return;
    setPending(true);
    dismiss({
      params: { orgId, pullId, githubReviewId: review.githubReviewId },
      payload: { message },
    })
      .then((result) => {
        onDismissed?.(result);
        toast.success("Review dismissed", { description: review.reviewer });
        setReason("");
        onOpenChange(false);
      })
      .catch((error: unknown) => {
        if (!goneOr(error, "This review", refreshReviewers)) {
          githubRefused(error);
          return;
        }
        setReason("");
        onOpenChange(false);
      })
      .finally(() => setPending(false));
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      submit();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onKeyDown={onKeyDown}>
        <DialogHeader>
          <DialogTitle>Dismiss review</DialogTitle>
          <DialogDescription>{dismissDescription(review)}</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Reason for dismissing"
            aria-label="Reason for dismissing"
            rows={3}
            disabled={pending}
            autoFocus
          />
        </DialogBody>
        <DialogFooter>
          <Button
            data-track-owner="shared/pull-view/review-row-menu.tsx#DismissReviewDialog:Button[Cancel]"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            data-track-owner="shared/pull-view/review-row-menu.tsx#DismissReviewDialog:Button[Dismiss review]"
            intent="danger"
            aria-busy={pending || undefined}
            data-loading={pending || undefined}
            disabled={message === "" || pending}
            onClick={submit}
          >
            Dismiss review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
