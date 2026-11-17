import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { AsyncResult, Atom } from "effect/reactivity";
import { useState } from "react";
import { toast } from "sonner";
import { PullGlyph, Spinner } from "@/components/checks-rows";
import {
  menuEmptyRow,
  menuSearchInput,
  pullFieldTrigger,
} from "@/components/labels-menu";
import type { OrgId } from "@/data/api/schemas/ids";
import {
  pullControlKey,
  pullControlKeys,
  pullReviewerOptionsAtom,
  setPullReviewerAtom,
} from "@/data/atoms/pull-controls";
import { organizationsAtom } from "@/data/atoms/session";
import {
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuGroup,
  MenuItem,
  MenuLabel,
  MenuTrigger,
} from "@/primitives/menu";
import {
  type PullReview,
  type RequestedReviewer,
  type ReviewerOptions,
  type ReviewerRow,
  readReviewerOptions,
  reviewerGroupLabels,
  reviewerGroups,
  reviewerMatches,
  reviewerSummary,
} from "./reviewers";

const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

const idleOptionsAtom = Atom.make(
  AsyncResult.success<ReviewerOptions, unknown>({
    requested: [],
    suggested: [],
    collaborators: [],
  }),
);

function ReviewerRowContent({ row }: { row: ReviewerRow }) {
  return (
    <>
      <span className="flex min-w-0 items-center gap-1.5">
        {row.reviewer.avatarUrl ? (
          <img
            src={row.reviewer.avatarUrl}
            alt=""
            className="size-(--icon-sm) shrink-0 rounded bg-secondary"
          />
        ) : (
          <span className="flex size-(--icon-sm) shrink-0 items-center justify-center rounded bg-secondary text-2xs text-muted-foreground-2">
            {row.reviewer.login.slice(0, 1).toUpperCase()}
          </span>
        )}
        <span className="mask-fade-r min-w-0 flex-1 overflow-hidden whitespace-nowrap">
          {row.reviewer.name === null ? (
            row.reviewer.login
          ) : (
            <>
              {row.reviewer.name}
              <span className="ml-1.5 text-muted-foreground-2">
                {row.reviewer.login}
              </span>
            </>
          )}
        </span>
      </span>
      {(row.word !== null || row.rerequest) && (
        <span className="ml-auto flex shrink-0 items-center gap-1.5 text-sm font-normal text-muted-foreground-1">
          {row.word}
          {row.rerequest && (
            <PullGlyph
              name="arrow-rotate-clockwise"
              className="size-(--icon-sm)"
            />
          )}
        </span>
      )}
    </>
  );
}

export type ReviewersMenuProps = {
  requested: ReadonlyArray<RequestedReviewer>;
  reviews: ReadonlyArray<PullReview>;
  author: string;
  options: ReviewerOptions | null;
  pending: string | null;
  onToggle: (login: string, requested: boolean) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultQuery?: string;
  footer?: React.ReactNode;
};

/** The pull's Reviewers field and its searchable, grouped reviewer menu. */
export function ReviewersMenu({
  requested,
  reviews,
  author,
  options,
  pending,
  onToggle,
  open,
  onOpenChange,
  defaultQuery,
  footer,
}: ReviewersMenuProps) {
  const [query, setQuery] = useState(defaultQuery ?? "");
  const latest = new Map<string, PullReview>();
  for (const review of reviews) {
    const seen = latest.get(review.reviewer);
    if (
      seen === undefined ||
      seen.submittedAt.getTime() < review.submittedAt.getTime()
    ) {
      latest.set(review.reviewer, review);
    }
  }
  const groups = reviewerGroups(
    requested.map((reviewer) => ({
      login: reviewer.login,
      name: null,
      avatarUrl: reviewer.avatarUrl,
    })),
    options,
    latest,
    author,
  ).map((group) => ({
    ...group,
    items: group.items.filter((row) => reviewerMatches(row, query)),
  }));
  const shown = reviewerSummary(requested, null, latest);
  return (
    <Menu open={open} onOpenChange={onOpenChange}>
      <MenuTrigger
        render={
          <button
            type="button"
            className={cx(pullFieldTrigger, "max-w-full min-w-0")}
          />
        }
      >
        {shown.length === 0 ? (
          <span className="flex items-center gap-1">
            <span className="flex size-(--icon-xs) shrink-0 items-center justify-center">
              <PullGlyph name="plus-large" className="size-3" />
            </span>
            Add reviewers
          </span>
        ) : (
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="flex shrink-0 -space-x-1">
              {shown.map((reviewer) => (
                <span
                  key={reviewer.login}
                  title={reviewer.login}
                  className="flex size-(--icon-sm) shrink-0 items-center justify-center overflow-hidden rounded bg-secondary text-2xs text-muted-foreground-2"
                >
                  {reviewer.avatarUrl ? (
                    <img
                      src={reviewer.avatarUrl}
                      alt=""
                      className="size-full"
                    />
                  ) : (
                    reviewer.login.slice(0, 1).toUpperCase()
                  )}
                </span>
              ))}
            </span>
            <span className="min-w-0 flex-1 truncate">
              {shown.map((reviewer) => reviewer.login).join(", ")}
            </span>
          </span>
        )}
      </MenuTrigger>
      <MenuContent align="start" className="w-72">
        <input
          className={menuSearchInput}
          placeholder="Search reviewers"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Escape") event.stopPropagation();
          }}
        />
        <div className="-mx-1 my-1 h-px shrink-0 bg-border-1" />
        {footer}
        {options === null && (
          <span className={cx(menuEmptyRow, "gap-2")}>
            <Spinner />
            Loading reviewers
          </span>
        )}
        {groups.map((group) => (
          <MenuGroup key={group.value}>
            <MenuLabel>{reviewerGroupLabels[group.value]}</MenuLabel>
            {group.items.map((row) =>
              group.value === "current" ? (
                <MenuCheckboxItem
                  key={row.reviewer.login}
                  checked={!row.rerequest}
                  disabled={pending === row.reviewer.login}
                  onCheckedChange={() => {
                    if (pending === null)
                      onToggle(row.reviewer.login, row.rerequest);
                  }}
                >
                  <ReviewerRowContent row={row} />
                </MenuCheckboxItem>
              ) : (
                <MenuItem
                  key={row.reviewer.login}
                  closeOnClick={false}
                  disabled={pending === row.reviewer.login}
                  onClick={() => onToggle(row.reviewer.login, true)}
                >
                  <ReviewerRowContent row={row} />
                </MenuItem>
              ),
            )}
          </MenuGroup>
        ))}
        {options !== null &&
          groups.every((group) => group.items.length === 0) && (
            <span className={menuEmptyRow}>No matching reviewers</span>
          )}
      </MenuContent>
    </Menu>
  );
}

const noOrg = "" as OrgId;

export type ReviewersControlProps = {
  pull: {
    id: string;
    author: string;
    requestedReviewers: ReadonlyArray<RequestedReviewer>;
  };
  reviews: ReadonlyArray<PullReview>;
  defaultOpen?: boolean;
  defaultQuery?: string;
};

/** Capy's ReviewersControl: loads reviewer options and writes through the API. */
export function ReviewersControl({
  pull,
  reviews,
  defaultOpen = false,
  defaultQuery,
}: ReviewersControlProps) {
  const organizations = useAtomValue(organizationsAtom);
  const orgId = AsyncResult.isSuccess(organizations)
    ? organizations.value[0]?.id
    : undefined;
  const [open, setOpen] = useState(defaultOpen);
  const options = useAtomValue<AsyncResult.AsyncResult<unknown, unknown>>(
    open
      ? pullReviewerOptionsAtom(pullControlKey(orgId ?? noOrg, pull.id))
      : idleOptionsAtom,
  ) as AsyncResult.AsyncResult<unknown, unknown>;
  const setReviewer = useAtomSet(setPullReviewerAtom, { mode: "promise" });
  const [pending, setPending] = useState<string | null>(null);
  if (orgId === undefined) return null;
  const requested = [...pull.requestedReviewers];
  const loaded = AsyncResult.isSuccess(options)
    ? readReviewerOptions(options.value)
    : null;

  const toggle = (login: string, wantsRequest: boolean) => {
    setPending(login);
    setReviewer({
      params: { orgId, pullId: pull.id },
      payload: { login, requested: wantsRequest },
      reactivityKeys: pullControlKeys(orgId, pull.id),
    })
      .then(() => undefined)
      .catch((error: unknown) =>
        toast.error(
          error instanceof Error ? error.message : "GitHub refused this action",
        ),
      )
      .finally(() => setPending(null));
  };

  return (
    <ReviewersMenu
      requested={requested}
      reviews={reviews}
      author={pull.author}
      options={loaded}
      pending={pending}
      onToggle={toggle}
      open={open}
      onOpenChange={setOpen}
      defaultQuery={defaultQuery}
    />
  );
}
