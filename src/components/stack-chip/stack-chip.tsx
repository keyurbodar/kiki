import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { PullGlyph, type PullGlyphName } from "@/components/checks-rows";
import type {
  PullStack,
  PullState,
} from "@/components/merge-controls/merge-gate";
import { Badge } from "@/primitives/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/primitives/popover";

const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

const pullStateIcons: Record<
  PullState,
  { name: PullGlyphName; className: string }
> = {
  ready: { name: "pull-request", className: "text-success" },
  pending: { name: "pull-request", className: "text-warning-fg" },
  draft: { name: "draft", className: "text-muted-foreground-2" },
  merged: { name: "merged", className: "text-complete" },
  failed: { name: "shield-crossed", className: "text-destructive" },
  closed: { name: "request-closed", className: "text-destructive" },
};

/** A pull's state glyph in its state colour. */
export function PullStateIcon({
  state,
  className,
}: {
  state: PullState;
  className?: string;
}) {
  const icon = pullStateIcons[state];
  return (
    <PullGlyph
      name={icon.name}
      className={cx("size-3 shrink-0", icon.className, className)}
    />
  );
}

/** The thin rail that joins one stack row's glyph to the next. */
export function StackLine({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cx(
        "absolute left-[0.4375rem] w-px bg-muted-foreground-3 opacity-60",
        className,
      )}
    />
  );
}

export type StackChipPull = { repo: string };

export type OpenPull = (pull: { repo: string; number: number }) => void;

const byPositionDescending = (
  a: { position: number },
  b: { position: number },
) => b.position - a.position;

export type StackRowsProps = {
  pull: StackChipPull;
  stack: PullStack;
  onNavigate: () => void;
  onOpenPull?: OpenPull;
};

/** The stack's pulls top first, then the branch it lands on. */
export function StackRows({
  pull,
  stack,
  onNavigate,
  onOpenPull,
}: StackRowsProps) {
  const [owner = "", repo = ""] = pull.repo.split("/");
  return (
    <div className="flex flex-col pt-0.5">
      {stack.members.toSorted(byPositionDescending).map((member) => {
        const current = member.position === stack.position;
        return (
          <Link
            key={member.id}
            to="/pull/$owner/$repo/$prNumber"
            params={{ owner, repo, prNumber: String(member.number) }}
            aria-current={current ? "page" : undefined}
            onClick={(event) => {
              if (event.metaKey || event.ctrlKey || event.shiftKey) return;
              if (event.altKey) return;
              onNavigate();
              if (onOpenPull === undefined) return;
              event.preventDefault();
              onOpenPull({ repo: pull.repo, number: member.number });
            }}
            className={cx(
              "relative flex w-full flex-col gap-0.5 rounded-(--radius) px-2 py-1.5 text-left text-sm outline-none transition-colors duration-100 focus-visible:outline-ring-inset",
              current
                ? "text-foreground"
                : "text-muted-foreground hover:bg-popover-hover",
            )}
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className="relative flex size-4 shrink-0 items-center justify-center">
                <StackLine className="top-[1.125rem] h-6" />
                <PullStateIcon state={member.state} />
              </span>
              <span className="mask-fade-r min-w-0 flex-1 overflow-hidden font-medium whitespace-nowrap">
                {member.title}
              </span>
            </span>
            <span
              className={cx(
                "flex min-w-0 items-center gap-1.5 pl-6 text-xs",
                current ? "text-muted-foreground" : "text-muted-foreground-2",
              )}
            >
              <span className="shrink-0 tabular-nums">#{member.number}</span>
              <span aria-hidden>·</span>
              <span className="min-w-0 truncate">{member.headRef}</span>
              <span className="ml-auto shrink-0 text-muted-foreground-3 tabular-nums">
                {member.position}/{stack.size}
              </span>
            </span>
          </Link>
        );
      })}
      <span className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground-2">
        <span className="flex size-4 shrink-0 items-center justify-center">
          <span
            aria-hidden
            className="size-2.5 rounded-full border-[0.09375rem] border-muted-foreground-3 bg-popover"
          />
        </span>
        <span>{stack.baseRef}</span>
      </span>
    </div>
  );
}

export const stackChipLabel = (
  stack: Pick<PullStack, "number" | "position" | "size">,
) =>
  `${stack.number === null ? "Stack" : `Stack #${stack.number}`}, position ${stack.position} of ${stack.size}`;

export type StackChipProps = {
  pull: StackChipPull;
  stack: PullStack;
  onOpenPull?: OpenPull;
};

/** The pull header's position-in-stack chip; it opens the stack's pulls. */
export function StackChip({ pull, stack, onOpenPull }: StackChipProps) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Badge size="sm" interactive aria-label={stackChipLabel(stack)} />
        }
      >
        <PullGlyph name="layers-three" className="size-3 shrink-0" />
        <span className="tabular-nums">
          {stack.position}/{stack.size}
        </span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-1">
        <div className="flex flex-col">
          <div className="flex min-h-[1.375rem] items-center px-2 pt-0.5 text-xs font-medium text-muted-foreground-2">
            {stack.number === null ? "Stack" : <>Stack #{stack.number}</>}
          </div>
          <StackRows
            pull={pull}
            stack={stack}
            onNavigate={() => setOpen(false)}
            onOpenPull={onOpenPull}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
