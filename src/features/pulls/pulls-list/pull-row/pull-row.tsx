import { Link } from "@tanstack/react-router";
import { memo } from "react";
import { type PullCard, repoName } from "@/features/pulls/pulls-page/data/pull";
import { pullCode, shortAge } from "@/features/pulls/pulls-page/model";
import { Badge } from "@/primitives/badge";
import { CheckGlyph, PullStateIcon, ThreadGlyph } from "./pull-icons";

/** Thread code for the row badge: `WEB-12`, or `#12` outside a project. */
export const threadCode = (thread: NonNullable<PullCard["thread"]>) =>
  thread.projectCode === null
    ? `#${thread.number}`
    : `${thread.projectCode}-${thread.number}`;

export function AuthorAvatar({ name, src }: { name: string; src: string }) {
  return src === "" ? (
    <span
      aria-hidden
      className="flex size-4 shrink-0 items-center justify-center rounded-full bg-secondary text-[0.5625rem] font-medium text-muted-foreground-1 uppercase"
    >
      {name.slice(0, 1)}
    </span>
  ) : (
    <img alt="" src={src} className="size-4 shrink-0 rounded-full" />
  );
}

export function DiffStat({
  additions,
  deletions,
}: {
  additions: number;
  deletions: number;
}) {
  return (
    <span className="flex items-center gap-1 tabular-nums">
      <span className="text-success">+{additions}</span>
      <span className="text-destructive">−{deletions}</span>
    </span>
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
}: {
  pull: PullCard;
  now: number;
  selected: boolean;
  checked: boolean;
  selectionMode: boolean;
  onCheck: () => void;
}) {
  const owner = pull.repo.slice(0, pull.repo.indexOf("/"));
  return (
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
          <span className="inline-block">{pullCode(pull)}</span>
        </span>
        <AuthorAvatar name={pull.author} src={pull.authorAvatarUrl} />
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
              className="@max-xl/list:hidden"
              aria-label={`Open thread ${threadCode(pull.thread)}`}
            >
              <ThreadGlyph className="size-3" />
              {threadCode(pull.thread)}
            </Badge>
          )}
          <span className="shrink-0 text-xs font-medium @max-2xl/list:hidden">
            <DiffStat additions={pull.additions} deletions={pull.deletions} />
          </span>
        </span>
        <span className="w-10 shrink-0 text-right text-xs font-normal text-muted-foreground-2 tabular-nums">
          {shortAge(pull.updatedAt, now)}
        </span>
      </Link>
    </div>
  );
});
