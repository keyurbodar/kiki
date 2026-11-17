import { cx } from "class-variance-authority";
import { type ComponentProps, useState } from "react";
import { Button } from "@/primitives/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/primitives/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import { type CostRow, formatCost } from "./cost";
import { CostBreakdown } from "./cost-breakdown";
import { CostValue } from "./thread-cost-badge";

export type CostBadgeProps = ComponentProps<"div"> & {
  /** Amount in credits. Defaults to the rows' total; a missing amount renders an em dash. */
  credits?: number | null;
  /** Rows the card breaks down. Without rows the chip has no card. */
  rows?: ReadonlyArray<CostRow>;
};

const rowsTotal = (rows: ReadonlyArray<CostRow>) =>
  rows.reduce((sum, row) => sum + row.charged + row.onKeys, 0);

export function CostBadge({
  credits,
  rows,
  className,
  children,
  ...props
}: CostBadgeProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const amount = formatCost(
    credits === undefined && rows !== undefined ? rowsTotal(rows) : credits,
  );
  const onOpenChange = (open: boolean) => {
    if (!open) setSelected(null);
  };
  const trigger = (
    <Button variant="ghost" size="sm" aria-label={`Thread cost ${amount}`}>
      <CostValue value={amount} />
    </Button>
  );
  const chip = (
    <Tooltip>
      <TooltipTrigger
        render={
          rows === undefined ? trigger : <PopoverTrigger render={trigger} />
        }
      />
      <TooltipContent side="bottom">Thread cost</TooltipContent>
    </Tooltip>
  );
  return (
    <div
      data-slot="cost-badge"
      {...props}
      className={cx("inline-flex items-center", className)}
    >
      {rows === undefined ? (
        chip
      ) : (
        <Popover onOpenChange={onOpenChange}>
          {chip}
          <PopoverContent side="bottom" align="end" className="w-96 p-1">
            <CostBreakdown
              rows={rows}
              selected={selected}
              onSelect={setSelected}
            />
          </PopoverContent>
        </Popover>
      )}
      {children}
    </div>
  );
}
