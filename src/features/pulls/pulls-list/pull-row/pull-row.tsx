import { Link, useNavigate } from "@tanstack/react-router";
import { memo } from "react";
import { PersonAvatar } from "@/components/share-dialog/person-avatar";
import {
  diffCategories,
  diffCategoryLabel,
  type PullCard,
  repoName,
} from "@/features/pulls/pulls-page/data/pull";
import { pullCode, shortAge } from "@/features/pulls/pulls-page/model";
import { Badge } from "@/primitives/badge";
import { Icon } from "@/primitives/icon";
import {
  PreviewCard,
  PreviewCardContent,
  PreviewCardTrigger,
} from "@/primitives/preview-card";
import { CheckGlyph, PullStateIcon, ThreadGlyph } from "./pull-icons";
import { PullRowMenu } from "./pull-row-menu";

/** Thread code for the row badge: `WEB-12`, or `#12` outside a project. */
export const threadCode = (thread: NonNullable<PullCard["thread"]>) =>
  thread.projectCode === null
    ? `#${thread.number}`
    : `${thread.projectCode}-${thread.number}`;

export function DiffStat({
  additions,
  deletions,
}: {
  additions: number;
  deletions: number;
}) {
  return (
    <span className="flex items-center gap-1 tabular-nums">
      <span className="text-diff-add">+{additions}</span>
      <span className="text-diff-del">-{deletions}</span>
    </span>
  );
}

/** The thread chip's state glyph: an archive box for an archived thread. */
function ThreadStateGlyph({
  thread,
}: {
  thread: NonNullable<PullCard["thread"]>;
}) {
  if (!thread.archived) return <ThreadGlyph />;
  return (
    <Icon
      name="archive"
      size="sm"
      aria-label="Archived"
      aria-hidden
      className="size-(--icon-sm) shrink-0 text-muted-foreground-2"
    />
  );
}

/** What the diff stat reveals on hover: per-category counts and hidden files. */
function DiffBreakdownCard({ pull }: { pull: PullCard }) {
  const breakdown = pull.diffBreakdown;
  return (
    <div className="flex w-56 flex-col gap-1.5">
      <span className="flex items-center gap-1.5 text-xs font-medium">
        <DiffStat additions={pull.additions} deletions={pull.deletions} />
      </span>
      {breakdown === null ? (
        <span className="text-xs text-muted-foreground-2">
          Diff counts and hidden file categories
        </span>
      ) : (
        <ul className="flex flex-col gap-1">
          {diffCategories.map((category) => {
            const counts = breakdown[category];
            if (counts.files === 0) return null;
            return (
              <li
                key={category}
                className="flex items-center gap-2 text-xs text-muted-foreground-2"
              >
                <span className="min-w-0 flex-1 truncate">
                  {diffCategoryLabel[category]}
                </span>
                <span className="shrink-0 tabular-nums">
                  {counts.files} files
                </span>
                <DiffStat
                  additions={counts.additions}
                  deletions={counts.deletions}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** The row's selection checkbox, shown on hover or once a row is checked. */
function RowCheckbox({
  checked,
  visible,
  onCheck,
}: {
  checked: boolean;
  visible: boolean;
  onCheck: () => void;
}) {
  return (
    <span
      className={[
        "flex w-4 shrink-0 items-center justify-center",
        "opacity-0 transition-opacity duration-100 group-hover/row:opacity-100 focus-within:opacity-100",
        "pointer-coarse:hidden",
        checked || visible ? "opacity-100" : "",
      ].join(" ")}
    >
      <button
        type="button"
        aria-label={checked ? "Deselect pull request" : "Select pull request"}
        aria-pressed={checked}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onCheck();
        }}
        className="flex cursor-pointer items-center justify-center outline-none focus-visible:outline-ring-inset"
      >
        <span
          data-checked={checked ? "" : undefined}
          className="flex size-4 shrink-0 items-center justify-center rounded-(--radius-sm) border-hairline border-border-3 text-primary-foreground transition-colors duration-100 data-[checked]:border-transparent data-[checked]:bg-primary"
        >
          {checked ? <CheckGlyph className="size-3" /> : null}
        </span>
      </button>
    </span>
  );
}

/** One pull request row (Capy's pulls-list row). */
export const PullRow = memo(function PullRow({
  pull,
  now,
  selected,
  checked,
  selectionMode,
  onCheck,
  pinned,
  onTogglePin,
}: {
  pull: PullCard;
  now: number;
  selected: boolean;
  checked: boolean;
  selectionMode: boolean;
  onCheck: () => void;
  pinned?: boolean;
  onTogglePin?: (id: string) => void;
}) {
  const owner = pull.repo.slice(0, pull.repo.indexOf("/"));
  const navigate = useNavigate();
  return (
    <PullRowMenu
      pull={pull}
      pinned={pinned ?? false}
      onTogglePin={onTogglePin ?? (() => undefined)}
    >
      <div className="group/row relative block">
        <Link
          to="/pull/$owner/$repo/$prNumber"
          params={{
            owner,
            repo: repoName(pull.repo),
            prNumber: String(pull.number),
          }}
          data-pull-row={pull.id}
          data-pull-url={pull.url}
          data-selected={selected ? "" : undefined}
          className="flex h-11 items-center gap-2 rounded px-2 outline-none select-none transition-colors duration-hover hover:bg-section focus-visible:outline-ring-inset data-[selected]:bg-section"
        >
          <RowCheckbox
            checked={checked}
            visible={selectionMode}
            onCheck={onCheck}
          />
          <span className="flex w-4 shrink-0 items-center justify-center">
            <PullStateIcon state={pull.state} />
          </span>
          <span className="w-(--pull-code-width) shrink-0 text-sm font-normal whitespace-nowrap text-muted-foreground-2 tabular-nums @max-lg/list:hidden">
            <span className="inline-block" data-pull-code-measure>
              {pullCode(pull)}
            </span>
          </span>
          <PersonAvatar
            size="xs"
            name={pull.author}
            src={pull.authorAvatarUrl}
          />
          <span
            className="mask-fade-r min-w-0 flex-1 overflow-hidden text-sm font-medium whitespace-nowrap text-foreground"
            title={pull.title}
          >
            {pull.title}
          </span>
          <span className="hidden shrink-0 items-center gap-1.5 @lg/list:flex">
            {pull.thread === null ? null : (
              <Badge
                size="base"
                className="inline-flex h-(--h-badge-base) w-fit shrink-0 cursor-pointer items-center justify-center gap-1 rounded-full border-hairline border-border-2 bg-secondary px-2 text-xs font-normal whitespace-nowrap text-foreground outline-none transition-colors duration-100 hover:bg-button-hover focus-visible:outline-ring-inset [&_svg]:size-(--icon-sm) [&_svg]:shrink-0 [&_svg:first-of-type]:-ml-0.5 @max-lg/list:hidden"
                aria-label={`Open thread ${threadCode(pull.thread)}`}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  if (pull.thread === null) return;
                  void navigate({
                    to: "/thread/$threadId",
                    params: { threadId: pull.thread.id },
                  });
                }}
              >
                <ThreadStateGlyph thread={pull.thread} />
                {threadCode(pull.thread)}
              </Badge>
            )}
            <span className="shrink-0 text-xs font-medium @max-2xl/list:hidden">
              <PreviewCard>
                <PreviewCardTrigger
                  render={
                    <button
                      type="button"
                      aria-label="Diff counts and hidden file categories"
                      className="relative shrink-0 cursor-default rounded text-xs font-medium tabular-nums outline-none focus-visible:outline-ring-inset"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                      }}
                    />
                  }
                >
                  <DiffStat
                    additions={pull.additions}
                    deletions={pull.deletions}
                  />
                </PreviewCardTrigger>
                <PreviewCardContent side="bottom" align="end">
                  <DiffBreakdownCard pull={pull} />
                </PreviewCardContent>
              </PreviewCard>
            </span>
          </span>
          <span className="w-10 shrink-0 text-right text-xs font-normal text-muted-foreground-2 tabular-nums">
            {shortAge(pull.updatedAt, now)}
          </span>
        </Link>
      </div>
    </PullRowMenu>
  );
});
