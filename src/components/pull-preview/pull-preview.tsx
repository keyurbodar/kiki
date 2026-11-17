import { Link } from "@tanstack/react-router";
import { cx } from "class-variance-authority";
import type { ComponentProps, MouseEvent } from "react";
import { useState } from "react";
import { IssuePullStateIcon } from "@/components/issue-pulls";
import type { PullRequestChip } from "@/data/api/schemas/thread";

export type PreviewPull = Pick<
  PullRequestChip,
  | "id"
  | "repo"
  | "number"
  | "title"
  | "state"
  | "additions"
  | "deletions"
  | "author"
  | "authorAvatarUrl"
  | "url"
>;

export type PullTarget = { repo: string; number: number; url: string };

export const isModifiedClick = (event: MouseEvent) =>
  event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;

export const openUnlessModified =
  <T,>(open: ((target: T) => void) | undefined, target: T) =>
  (event: MouseEvent) => {
    if (open === undefined || isModifiedClick(event)) return;
    event.preventDefault();
    open(target);
  };

export const pullRouteParams = (repo: string, number: number) => {
  const [owner = "", name = repo] = repo.split("/");
  return { owner, repo: name, prNumber: String(number) };
};

export const pullLabel = (
  pull: Pick<PreviewPull, "repo" | "number">,
  multirepo: boolean,
) =>
  multirepo
    ? `${pull.repo.split("/")[1] ?? pull.repo}#${pull.number}`
    : `#${pull.number}`;

export const avatarInitials = (name: string) => {
  const words = name
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0);
  const first = words[0]?.[0] ?? "";
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? "") : "";
  return `${first}${last}`.toUpperCase();
};

export type PreviewAvatarProps = {
  name: string;
  src?: string | null;
  className?: string;
};

export function PreviewAvatar({ name, src, className }: PreviewAvatarProps) {
  const [failed, setFailed] = useState(false);
  if (src != null && src !== "" && !failed) {
    return (
      <span
        className={cx(
          "relative flex size-4 shrink-0 items-center justify-center overflow-hidden rounded bg-secondary text-[0.5rem]",
          className,
        )}
      >
        <img
          src={src}
          alt={name}
          className="absolute inset-0 size-full object-cover"
          onError={() => setFailed(true)}
        />
      </span>
    );
  }
  return (
    <span
      role="img"
      aria-label={name}
      className={cx(
        "flex size-4 shrink-0 items-center justify-center rounded bg-muted text-[0.5rem] font-medium text-foreground",
        className,
      )}
    >
      {avatarInitials(name)}
    </span>
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
    <span className="shrink-0 tabular-nums">
      <span className="text-diff-add">+{additions}</span>{" "}
      <span className="text-diff-del">-{deletions}</span>
    </span>
  );
}

export type PullPreviewProps = Omit<ComponentProps<"div">, "children"> & {
  prs: readonly PreviewPull[];
  multirepo?: boolean;
  onOpen?: (target: PullTarget) => void;
};

export function PullPreview({
  prs,
  multirepo = false,
  onOpen,
  className,
  ...props
}: PullPreviewProps) {
  return (
    <div
      data-slot="pull-preview"
      className={cx("-m-1.5 flex flex-col gap-0.5 p-0.5", className)}
      {...props}
    >
      {prs.map((pr) => (
        <Link
          key={pr.id}
          to="/pull/$owner/$repo/$prNumber"
          params={pullRouteParams(pr.repo, pr.number)}
          onClick={openUnlessModified(onOpen, {
            repo: pr.repo,
            number: pr.number,
            url: pr.url,
          })}
          className={cx(
            "flex items-center gap-2 rounded px-1.5 py-1 outline-none select-none",
            "transition-colors duration-100 hover:bg-popover-hover",
            "focus-visible:outline-ring-inset",
          )}
        >
          <IssuePullStateIcon state={pr.state} />
          <span className="shrink-0 text-xs font-normal text-muted-foreground-2 tabular-nums">
            {pullLabel(pr, multirepo)}
          </span>
          <span className="mask-fade-r min-w-0 flex-1 overflow-hidden text-sm font-medium whitespace-nowrap text-foreground">
            {pr.title}
          </span>
          <span className="shrink-0 text-xs font-medium">
            <DiffStat additions={pr.additions} deletions={pr.deletions} />
          </span>
          <PreviewAvatar name={pr.author} src={pr.authorAvatarUrl} />
        </Link>
      ))}
    </div>
  );
}
