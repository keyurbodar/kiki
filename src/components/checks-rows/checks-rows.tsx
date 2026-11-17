import { useState } from "react";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import {
  type CheckVerdict,
  checksSummary,
  checksVerdict,
  checkVerdict,
  checkVerdictWord,
  type PullCheck,
  sortChecks,
} from "./checks";
import { PullGlyph, Spinner } from "./pull-glyphs";

const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

const rowClass =
  "flex h-7 items-center gap-2 rounded px-2 transition-colors duration-100";

export function CheckVerdictIcon({ verdict }: { verdict: CheckVerdict }) {
  switch (verdict) {
    case "failure":
      return (
        <PullGlyph
          name="cross-medium"
          className="size-(--icon-xs) shrink-0 text-destructive"
        />
      );
    case "pending":
      return (
        <Spinner label="Running" className="size-(--icon-xs) text-warning-fg" />
      );
    case "neutral":
      return (
        <PullGlyph
          name="minus-small"
          className="size-(--icon-xs) shrink-0 text-muted-foreground-3"
        />
      );
    case "success":
      return (
        <Icon
          name="checkmark-1"
          className="size-(--icon-xs) shrink-0 text-success"
        />
      );
  }
}

/** The worst verdict of a set of checks, in the icon slot Capy's menus use. */
export function ChecksVerdictIcon({
  checks,
}: {
  checks: ReadonlyArray<PullCheck>;
}) {
  return (
    <span className="flex size-(--icon-xs) shrink-0 items-center justify-center">
      <CheckVerdictIcon verdict={checksVerdict(checks)} />
    </span>
  );
}

function CheckRow({ check }: { check: PullCheck }) {
  const content = (
    <>
      <CheckVerdictIcon verdict={checkVerdict(check)} />
      <span className="min-w-0 flex-1 truncate text-xs text-foreground">
        {check.name}
      </span>
      <span className="shrink-0 text-xs text-muted-foreground-2">
        {checkVerdictWord(check)}
      </span>
      {check.detailsUrl !== null && (
        <PullGlyph
          name="arrow-up-right"
          className="size-(--icon-xs) shrink-0 text-icon-muted"
        />
      )}
    </>
  );
  if (check.detailsUrl === null) {
    return <span className={rowClass}>{content}</span>;
  }
  return (
    <a
      href={check.detailsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cx(
        rowClass,
        "outline-none select-none hover:bg-secondary",
        "focus-visible:outline-ring-inset",
      )}
    >
      {content}
    </a>
  );
}

export type CheckRowsProps = {
  checks: ReadonlyArray<PullCheck>;
  className?: string;
};

/** Every check on the head, failures first, each linking to its details. */
export function CheckRows({ checks, className }: CheckRowsProps) {
  return (
    <div className={cx("flex flex-col", className)}>
      {sortChecks(checks).map((check) => (
        <CheckRow key={`${check.kind}:${check.name}`} check={check} />
      ))}
    </div>
  );
}

export type ChecksSectionProps = { checkRows: ReadonlyArray<PullCheck> };

/** The overview's collapsible Checks section; collapsed, it shows the summary. */
export function ChecksSection({ checkRows }: ChecksSectionProps) {
  const [open, setOpen] = useState(true);
  return (
    <div data-pull-section="checks" className="flex scroll-mt-3 flex-col gap-1">
      <div className="flex min-w-0 items-center gap-1.5">
        <Button
          variant="ghost"
          size="xs"
          className="-ml-2"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
        >
          <span className="text-muted-foreground-2">Checks</span>
          <PullGlyph
            name={open ? "chevron-down-small" : "chevron-right-small"}
            className="size-(--icon-sm) shrink-0 text-icon-muted"
          />
        </Button>
        {!open && (
          <span className="ml-auto min-w-0 truncate text-xs text-muted-foreground-3">
            {checksSummary(checkRows)}
          </span>
        )}
      </div>
      {open && <CheckRows checks={checkRows} className="-mx-2" />}
    </div>
  );
}
