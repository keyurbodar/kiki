import { type ReactNode, useId, useRef, useState } from "react";
import { PullGlyph } from "@/components/checks-rows";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { menuRowVariants } from "@/primitives/menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/primitives/popover";
import { ScrollArea, ScrollAreaViewport } from "@/primitives/scroll-area";
import {
  type CommitScope,
  commitSubject,
  onRangeGridKeyDown,
  type RangeCommit,
  type RangePull,
  radioCell,
  rangeRows,
  scopeForCommit,
  scopeForRange,
  scopeLabel,
  shortSha,
} from "./commit-range-logic";

const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

const groupLabel =
  "mt-1 flex min-h-[1.375rem] items-center px-2 text-xs font-medium text-muted-foreground-2 first:mt-0";
const separator = "-mx-1 my-1 h-px bg-border-1";
const fadeText = "mask-fade-r min-w-0 flex-1 overflow-hidden whitespace-nowrap";
const cellClass =
  "relative flex w-6 shrink-0 items-center justify-center self-stretch";
const inRangeClass = "bg-[color-mix(in_oklch,var(--diff-add)_14%,transparent)]";

type Side = "from" | "to";

function RadioDot({
  side,
  on,
  dim,
}: {
  side: Side;
  on: boolean;
  dim: boolean;
}) {
  return (
    <span
      className={cx(
        "relative flex size-3.5 items-center justify-center rounded-full border-[0.03125rem]",
        on
          ? side === "from"
            ? "border-transparent bg-diff-del"
            : "border-transparent bg-diff-add"
          : "border-border-3 bg-input",
        dim && "opacity-40",
      )}
    >
      {on && <span className="size-1.5 rounded-full bg-primary-foreground" />}
    </span>
  );
}

type GridProps = {
  ids: string;
  row: number;
  count: number;
  from: number;
  to: number;
  label: string;
};

function RadioCell({
  ids,
  side,
  row,
  count,
  from,
  to,
  label,
  onPick,
}: GridProps & { side: Side; onPick: (row: number) => void }) {
  const cell = radioCell(side, row, count, from, to);
  return (
    <span
      className={cx(
        cellClass,
        cell.inRange && inRangeClass,
        cell.inRange && row === from + 1 && "rounded-t-full",
        cell.inRange && row === to && "rounded-b-full",
      )}
    >
      {cell.shown && (
        // biome-ignore lint/a11y/useSemanticElements: Capy's range grid needs a focusable button per cell, not a native radio
        <button
          id={`${ids}-${side}-${row}`}
          type="button"
          role="radio"
          aria-checked={cell.on}
          aria-label={`${side === "from" ? "Compare from" : "Compare to"} ${label}`}
          disabled={cell.dim}
          tabIndex={cell.on ? 0 : -1}
          data-col={side}
          data-row={row}
          onClick={() => onPick(row)}
          className="flex size-5 items-center justify-center rounded-full outline-none focus-visible:outline-ring-inset"
        >
          <RadioDot side={side} on={cell.on} dim={cell.dim} />
        </button>
      )}
    </span>
  );
}

function RangeRow({
  onFrom,
  onTo,
  onBody,
  children,
  ...grid
}: GridProps & {
  onFrom: (row: number) => void;
  onTo: (row: number) => void;
  onBody: (() => void) | undefined;
  children: ReactNode;
}) {
  return (
    <div
      className={cx(
        menuRowVariants({ interaction: "button" }),
        "cursor-default gap-0 pl-0 has-focus-visible:bg-[var(--menu-row-highlight,var(--popover-hover))]",
      )}
    >
      <span className="flex shrink-0 self-stretch pl-2">
        <RadioCell {...grid} side="from" onPick={onFrom} />
        <RadioCell {...grid} side="to" onPick={onTo} />
      </span>
      {onBody === undefined ? (
        <span className="flex min-w-0 flex-1 items-center gap-2 self-stretch pl-2">
          {children}
        </span>
      ) : (
        <button
          type="button"
          tabIndex={-1}
          data-col="body"
          data-row={grid.row}
          onClick={onBody}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 self-stretch pl-2 text-left outline-none"
        >
          {children}
        </button>
      )}
    </div>
  );
}

export type CommitRangePickerProps = {
  pull: RangePull;
  commits: ReadonlyArray<RangeCommit>;
  scope: CommitScope | null;
  onScope: (scope: CommitScope | null) => void;
};

/**
 * The diff toolbar's Commits menu: pick all commits, one commit, or a
 * from/to range on a two-column radio grid; an active scope shows a chip
 * that clears it.
 */
export function CommitRangePicker({
  pull,
  commits,
  scope,
  onScope,
}: CommitRangePickerProps) {
  const [open, setOpen] = useState(false);
  const ids = useId();
  const allRef = useRef<HTMLButtonElement>(null);
  const count = commits.length;
  const { from, to } = rangeRows(commits, scope);
  const pickRange = (nextFrom: number, nextTo: number) =>
    onScope(scopeForRange(pull, commits, nextFrom, nextTo));
  const pickCommit = (row: number) => {
    onScope(scopeForCommit(commits, row));
    setOpen(false);
  };
  const grid = { ids, count, from, to };
  const label = scope === null ? null : scopeLabel(commits, scope);

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger render={<Button variant="ghost" size="xs" />}>
          Commits
          <span className="text-muted-foreground-3 tabular-nums">{count}</span>
          <PullGlyph name="chevron-down-small" className="size-(--icon-sm)" />
        </PopoverTrigger>
        <PopoverContent
          align="start"
          initialFocus={allRef}
          className="w-[30rem] max-w-(--available-width) p-1"
        >
          <ScrollArea className="min-h-0">
            <ScrollAreaViewport className="overscroll-contain">
              {/* biome-ignore lint/a11y/noStaticElementInteractions: arrow keys move focus between the grid's own buttons */}
              <div onKeyDown={onRangeGridKeyDown}>
                <button
                  ref={allRef}
                  type="button"
                  data-col="body"
                  data-row={-1}
                  onClick={() => {
                    onScope(null);
                    setOpen(false);
                  }}
                  className={menuRowVariants({ interaction: "button" })}
                >
                  <span className="min-w-0 flex-1 truncate">All commits</span>
                  {scope === null && (
                    <Icon
                      name="checkmark-1"
                      className="ml-auto size-(--icon-sm) shrink-0 text-foreground"
                    />
                  )}
                </button>
                <div className={separator} />
                <div className={groupLabel}>
                  Compare
                  <span className="ml-auto flex items-center gap-3 font-normal text-muted-foreground-3">
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-diff-del" />
                      From
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-diff-add" />
                      To
                    </span>
                  </span>
                </div>
                <div
                  role="radiogroup"
                  aria-label="Compare from"
                  aria-owns={Array.from(
                    { length: count },
                    (_, row) => `${ids}-from-${row}`,
                  ).join(" ")}
                />
                <div
                  role="radiogroup"
                  aria-label="Compare to"
                  aria-owns={Array.from(
                    { length: count },
                    (_, row) => `${ids}-to-${row + 1}`,
                  ).join(" ")}
                />
                <fieldset aria-label="Compare range" className="m-0 min-w-0 border-0 p-0">
                  <RangeRow
                    {...grid}
                    row={0}
                    label="base"
                    onFrom={(row) => pickRange(row, to)}
                    onTo={(row) => pickRange(from, row)}
                    onBody={undefined}
                  >
                    <span className="min-w-0 flex-1 truncate">Base</span>
                    <span className="ml-auto shrink-0 text-2xs text-muted-foreground-3">
                      {pull.baseRef}
                    </span>
                  </RangeRow>
                  {commits.map((commit, index) => (
                    <RangeRow
                      key={commit.sha}
                      {...grid}
                      row={index + 1}
                      label={shortSha(commit.sha)}
                      onFrom={(row) => pickRange(row, to)}
                      onTo={(row) => pickRange(from, row)}
                      onBody={() => pickCommit(index + 1)}
                    >
                      <span className="shrink-0 text-2xs text-muted-foreground-3 tabular-nums">
                        {shortSha(commit.sha)}
                      </span>
                      <span className={fadeText}>
                        {commitSubject(commit.message)}
                      </span>
                    </RangeRow>
                  ))}
                </div>
              </fieldset>
            </ScrollAreaViewport>
          </ScrollArea>
        </PopoverContent>
      </Popover>
      {scope !== null && label !== null && (
        <Button
          variant="soft"
          size="xs"
          aria-label="Show all commits"
          onClick={() => onScope(null)}
        >
          <span className="tabular-nums">
            {"single" in label ? (
              label.single
            ) : (
              <>
                {label.from}
                <span className="text-muted-foreground-2">..</span>
                {label.to}
              </>
            )}
          </span>
          <PullGlyph name="cross-small" className="size-(--icon-sm)" />
        </Button>
      )}
    </>
  );
}
