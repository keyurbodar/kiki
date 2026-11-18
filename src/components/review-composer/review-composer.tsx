import { useAtomSet } from "@effect/atom-react";
import { type KeyboardEvent, useState, useSyncExternalStore } from "react";
import { CheckmarkGlyph, CrossMediumGlyph } from "@/components/review-mode";
import { isPullClosed, type ReviewPull } from "@/components/review-section";
import { ApiClient } from "@/data/client/ApiClient";
import { Button } from "@/primitives/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/primitives/drawer";
import { Popover, PopoverContent, PopoverTrigger } from "@/primitives/popover";
import { Textarea } from "@/primitives/textarea";
import { toast } from "@/primitives/toaster";

export type ReviewEvent = "comment" | "request_changes" | "approve";

export const submitReviewAtom = ApiClient.mutation("pulls", "submitReview");

const phoneQuery = "(width < 48rem)";

function subscribePhone(onChange: () => void) {
  const query = window.matchMedia(phoneQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

const usePhone = () =>
  useSyncExternalStore(
    subscribePhone,
    () => window.matchMedia(phoneQuery).matches,
    () => false,
  );

const drafts = new Map<string, string>();

export const draftKey = (pullId: string, headSha: string) =>
  `pull-review:${pullId}:${headSha}`;

/** Approve can go out empty; comment and request changes need a summary. */
export const canSubmit = (
  event: ReviewEvent,
  body: string,
  pending: ReviewEvent | null,
) => pending === null && (event === "approve" || body.trim() !== "");

export type ReviewButtonProps = {
  readonly pull: ReviewPull;
  readonly orgId: string | undefined;
  /** The viewer's connected GitHub login; `null` when GitHub isn't connected. */
  readonly viewerLogin: string | null;
  readonly guided?: boolean;
  readonly filesReviewed?: ReviewComposerProps["filesReviewed"];
  readonly onSubmitted?: (review: unknown) => void;
};

export function ReviewButton({
  pull,
  orgId,
  viewerLogin,
  guided = false,
  filesReviewed,
  onSubmitted,
}: ReviewButtonProps) {
  const phone = usePhone();
  const [open, setOpen] = useState(false);
  if (isPullClosed(pull) || viewerLogin === null || viewerLogin === pull.author)
    return null;
  const trigger = (
    <Button
      data-track-owner="shared/pull-view/review-composer.tsx#ReviewButton:Button[Review]"
      size="sm"
    >
      Review
    </Button>
  );
  const composer = (
    <ReviewComposer
      pull={pull}
      orgId={orgId}
      guided={guided}
      filesReviewed={filesReviewed}
      onSubmitted={onSubmitted}
      onClose={() => setOpen(false)}
    />
  );
  if (phone)
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger
          data-track-owner="shared/pull-view/review-composer.tsx#ReviewButton:DrawerTrigger.1"
          render={trigger}
        />
        <DrawerContent>{composer}</DrawerContent>
      </Drawer>
    );
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        data-track-owner="shared/pull-view/review-composer.tsx#ReviewButton:PopoverTrigger.1"
        render={trigger}
      />
      <PopoverContent align="end" sideOffset={6} className="w-130 p-0">
        {composer}
      </PopoverContent>
    </Popover>
  );
}

export type ReviewComposerProps = {
  readonly pull: ReviewPull;
  readonly orgId: string | undefined;
  readonly guided?: boolean;
  /** Viewed and total file counts for the "files reviewed" chip. */
  readonly filesReviewed?: { readonly viewed: number; readonly total: number };
  readonly onClose: () => void;
  readonly onSubmitted?: (review: unknown) => void;
};

export function ReviewComposer({
  pull,
  orgId,
  guided = false,
  filesReviewed,
  onClose,
  onSubmitted,
}: ReviewComposerProps) {
  const submitReview = useAtomSet(submitReviewAtom, { mode: "promise" });
  const key = draftKey(pull.id, pull.headSha);
  const [body, setBody] = useState(() => drafts.get(key) ?? "");
  const [pending, setPending] = useState<ReviewEvent | null>(null);
  if (orgId === undefined) return null;
  const text = body.trim();

  const send = (event: ReviewEvent) => {
    if (!canSubmit(event, text, pending)) return;
    setPending(event);
    submitReview({
      params: { orgId, pullId: pull.id },
      payload: {
        event,
        body: text === "" ? undefined : text,
        headSha: pull.headSha,
      },
    })
      .then((review) => {
        drafts.delete(key);
        onSubmitted?.(review);
        onClose();
      })
      .catch((error: unknown) => {
        toast.error(
          error instanceof Error ? error.message : "GitHub refused the review",
        );
      })
      .finally(() => setPending(null));
  };

  const onKeyDownCapture = (event: KeyboardEvent) => {
    if (
      event.key === "Enter" &&
      (event.metaKey || event.ctrlKey) &&
      event.shiftKey
    ) {
      event.preventDefault();
      event.stopPropagation();
      send("approve");
    }
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      send("comment");
    }
  };

  const blocked = text === "" || pending !== null;

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: keyboard shortcuts scope to the composer, as in Capy
    <div
      className="flex flex-col"
      onKeyDownCapture={onKeyDownCapture}
      onKeyDown={onKeyDown}
    >
      {filesReviewed !== undefined && (
        <div className="flex items-center px-3 pt-2.5">
          <span className="inline-flex h-(--h-control-xs) items-center gap-1 rounded bg-secondary px-1.5 text-xs text-muted-foreground-1 tabular-nums">
            <span className="font-medium text-foreground">
              {filesReviewed.viewed} / {filesReviewed.total}
            </span>
            files reviewed
          </span>
        </div>
      )}
      <div data-slot="composer" className="flex flex-col gap-2 p-3">
        <Textarea
          variant="blank"
          className="min-h-28 w-full resize-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground-3"
          placeholder="Add review summary"
          aria-label="Add review summary"
          autoFocus
          value={body}
          disabled={pending !== null}
          onChange={(event) => {
            setBody(event.target.value);
            drafts.set(key, event.target.value);
          }}
        />
        <div className="flex items-center justify-end gap-1.5">
          <Button
            data-track-owner="shared/pull-view/review-composer.tsx#ReviewComposer:Button[Comment]"
            size="sm"
            disabled={blocked}
            aria-busy={pending === "comment" || undefined}
            data-loading={pending === "comment" || undefined}
            onClick={() => send("comment")}
          >
            Comment
          </Button>
          <Button
            data-track-owner="shared/pull-view/review-composer.tsx#ReviewComposer:Button[Request changes]"
            size="sm"
            disabled={blocked}
            aria-busy={pending === "request_changes" || undefined}
            data-loading={pending === "request_changes" || undefined}
            onClick={() => send("request_changes")}
          >
            <CrossMediumGlyph className="text-destructive" />
            Request changes
          </Button>
          <Button
            size="sm"
            intent="accent"
            disabled={pending !== null}
            aria-busy={pending === "approve" || undefined}
            data-loading={pending === "approve" || undefined}
            data-track={guided ? "guided_review.approve" : undefined}
            onClick={() => send("approve")}
          >
            <CheckmarkGlyph />
            Approve
          </Button>
        </div>
      </div>
    </div>
  );
}
