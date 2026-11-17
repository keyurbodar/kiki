import { cx } from "class-variance-authority";
import { type CSSProperties, useState } from "react";
import { Button } from "@/primitives/button";
import { menuRowVariants } from "@/primitives/menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import {
  type CostRow,
  formatCredits,
  isVisibleCredits,
  type ModelLine,
  resourceLines,
  rowHues,
  type UsageMember,
} from "./cost";
import { ChevronLeftSmallGlyph } from "./glyphs";

export const menuIconSlot =
  "flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted in-data-[intent=danger]:text-destructive";
export const menuLabel =
  "mask-fade-r min-w-0 flex-1 overflow-hidden whitespace-nowrap";
export const menuSeparator = "-mx-1 my-1 h-px bg-border-1";
export const costList =
  "-mx-1 flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto px-1 md:scroll-fade-y [&>*]:shrink-0";

const swatch = (hue: number | undefined) =>
  ({ "--cost-hue": hue ?? 0 }) as CSSProperties;

export type CostTotalsProps = { charged: number; onKeys: number };

export function CostTotals({ charged, onKeys }: CostTotalsProps) {
  return (
    <div className="flex shrink-0 items-start justify-between gap-3 px-2 pt-1.5 pb-2">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-lg font-medium text-foreground tabular-nums">
          {formatCredits(charged)}
        </span>
        <span className="text-xs font-normal text-muted-foreground-2">
          Charged by Capy
        </span>
      </div>
      <div className="flex min-w-0 flex-col items-end gap-0.5">
        <span className="text-lg font-medium text-muted-foreground-1 tabular-nums">
          {formatCredits(onKeys)}
        </span>
        <span className="text-xs font-normal text-muted-foreground-2">
          On your keys
        </span>
      </div>
    </div>
  );
}

export type CostLineProps = {
  label: string;
  source?: string | null;
  value: number;
  muted?: boolean;
};

export function CostLine({
  label,
  source,
  value,
  muted = false,
}: CostLineProps) {
  return (
    <div className="flex h-(--h-menu-row) items-center gap-2 px-2 text-sm font-normal">
      <span
        className={cx(
          menuLabel,
          muted ? "text-muted-foreground-1" : "text-foreground",
        )}
      >
        {label}
        {source != null && (
          <span className="text-muted-foreground-2">
            {" · "}
            {source}
          </span>
        )}
      </span>
      <span
        className={cx(
          "shrink-0 tabular-nums",
          muted ? "text-muted-foreground-2" : "text-foreground",
        )}
      >
        {formatCredits(value)}
      </span>
    </div>
  );
}

const modelLine = (line: ModelLine, muted: boolean) => (
  <CostLine
    key={line.key}
    label={line.label}
    source={muted ? line.credentialName : undefined}
    value={line.credits}
    muted={muted}
  />
);

export type CostResourcesProps = { members: ReadonlyArray<UsageMember> };

export function CostResources({ members }: CostResourcesProps) {
  const lines = resourceLines(members);
  return (
    <div className={costList}>
      {isVisibleCredits(lines.machines) && (
        <CostLine label="Machines" value={lines.machines} />
      )}
      {isVisibleCredits(lines.tokenFee) && (
        <CostLine label="Capy token fee" value={lines.tokenFee} />
      )}
      {lines.billed.map((line) => modelLine(line, false))}
      {lines.images.map((image) => (
        <CostLine
          key={image.endpoint}
          label={image.label}
          value={image.credits}
        />
      ))}
      {lines.unbilled.length > 0 && (
        <>
          <div className={menuSeparator} />
          <div className="mt-1 flex min-h-5.5 items-center px-2 text-xs font-medium text-muted-foreground-2 first:mt-0">
            On your keys, not charged
          </div>
          {lines.unbilled.map((line) => modelLine(line, true))}
        </>
      )}
    </div>
  );
}

export type CostBreakdownProps = {
  rows: ReadonlyArray<CostRow>;
  selected: string | null;
  onSelect: (key: string | null) => void;
  phone?: boolean;
};

export function CostBreakdown({
  rows,
  selected,
  onSelect,
  phone = false,
}: CostBreakdownProps) {
  const [view, setView] = useState<"threads" | "resources">("threads");
  const detail = rows.find((row) => row.key === selected);
  if (detail !== undefined) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <button
          type="button"
          className={menuRowVariants({
            interaction: "button",
            className: "shrink-0",
          })}
          onClick={() => onSelect(null)}
        >
          <span className={menuIconSlot}>
            <ChevronLeftSmallGlyph />
          </span>
          <span className={cx(menuLabel, "font-medium")}>{detail.label}</span>
        </button>
        <div className={cx(menuSeparator, "shrink-0")} />
        <CostTotals charged={detail.charged} onKeys={detail.onKeys} />
        <div className={cx(menuSeparator, "shrink-0")} />
        <CostResources members={detail.members} />
      </div>
    );
  }
  const charged = rows.reduce((sum, row) => sum + row.charged, 0);
  const onKeys = rows.reduce((sum, row) => sum + row.onKeys, 0);
  const total = charged + onKeys;
  const hues = rowHues(rows);
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <CostTotals charged={charged} onKeys={onKeys} />
      {total > 0 && (
        <div className="mx-2 mb-2 flex h-1.5 shrink-0 gap-px overflow-hidden rounded-full">
          {rows
            .filter((row) => row.charged + row.onKeys > 0)
            .map((row) => {
              const style = {
                ...swatch(hues.get(row.key)),
                flexGrow: (row.charged + row.onKeys) / total,
              };
              return phone ? (
                <span
                  key={row.key}
                  aria-hidden
                  style={style}
                  className="cost-swatch min-w-0.5 shrink-0 basis-0"
                />
              ) : (
                <Tooltip key={row.key}>
                  <TooltipTrigger
                    render={
                      <button
                        type="button"
                        aria-label={`${row.label}: ${formatCredits(row.charged)} charged by Capy, ${formatCredits(row.onKeys)} on your keys`}
                        onClick={() => onSelect(row.key)}
                        style={style}
                        className="cost-swatch min-w-0.5 shrink-0 basis-0 cursor-pointer focus-visible:outline-ring-inset"
                      />
                    }
                  />
                  <TooltipContent>
                    <div className="flex max-w-72 flex-col gap-1">
                      <span>{row.label}</span>
                      <span>{formatCredits(row.charged)} charged by Capy</span>
                      <span>{formatCredits(row.onKeys)} on your keys</span>
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
        </div>
      )}
      {/* biome-ignore lint/a11y/useSemanticElements: Capy renders the segmented group as a div with role="group" */}
      <div
        data-slot="cost-breakdown-toggle"
        role="group"
        aria-label="Cost breakdown"
        className="relative mx-2 mb-2 flex items-center gap-0.5 rounded-lg border-hairline border-border-2 bg-secondary p-0.5 [&>button]:relative [&>[data-selected]]:bg-card [&>[data-selected]]:shadow-card"
      >
        <Button
          variant="segmented"
          size="xs"
          aria-pressed={view === "threads"}
          data-selected={view === "threads" ? "" : undefined}
          className="flex-1"
          onClick={() => setView("threads")}
        >
          By thread
        </Button>
        <Button
          variant="segmented"
          size="xs"
          aria-pressed={view === "resources"}
          data-selected={view === "resources" ? "" : undefined}
          className="flex-1"
          onClick={() => setView("resources")}
        >
          Models and machines
        </Button>
      </div>
      <div className={cx(menuSeparator, "shrink-0")} />
      {view === "resources" ? (
        <CostResources members={rows.flatMap((row) => row.members)} />
      ) : (
        <div className={costList}>
          {rows.map((row) => (
            <button
              key={row.key}
              type="button"
              className={menuRowVariants({ interaction: "button" })}
              onClick={() => onSelect(row.key)}
            >
              <span className={menuIconSlot}>
                <span
                  aria-hidden
                  className="cost-swatch size-2 shrink-0 rounded-full"
                  style={swatch(hues.get(row.key))}
                />
              </span>
              <span className={menuLabel}>{row.label}</span>
              <span className="w-18 shrink-0 text-right text-foreground tabular-nums">
                {formatCredits(row.charged)}
              </span>
              <span className="w-18 shrink-0 text-right text-muted-foreground-2 tabular-nums">
                {row.onKeys > 0 ? formatCredits(row.onKeys) : ""}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
