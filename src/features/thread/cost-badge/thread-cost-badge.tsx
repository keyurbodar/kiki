import { useAtomValue } from "@effect/atom-react";
import { cx } from "class-variance-authority";
import { Option } from "effect";
import { AsyncResult } from "effect/reactivity";
import { useState } from "react";
import { threadUsageAtom } from "@/data/atoms/thread-devices";
import { Button } from "@/primitives/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/primitives/drawer";
import {
  MenuContent,
  MenuSub,
  MenuSubTrigger,
  menuRowVariants,
} from "@/primitives/menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/primitives/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import {
  buildCostRows,
  formatCredits,
  parseThreadUsage,
  type SubtreeNode,
  type ThreadUsage,
} from "./cost";
import { CostBreakdown, menuIconSlot, menuLabel } from "./cost-breakdown";
import { CurrencyDollarGlyph } from "./glyphs";

export type CostValueProps = { value: string; className?: string };

export function CostValue({ value, className }: CostValueProps) {
  return (
    <span
      data-slot="cost-value"
      className={cx(
        "inline-flex items-baseline leading-[inherit] tabular-nums",
        className,
      )}
    >
      {value}
    </span>
  );
}

export type ThreadCostBadgeControlProps = {
  threadId: string;
  usage: ThreadUsage;
  subtree?: ReadonlyArray<SubtreeNode>;
  phone?: boolean;
  inMenu?: boolean;
  defaultOpen?: boolean;
};

export function ThreadCostBadgeControl({
  threadId,
  usage,
  subtree = [],
  phone = false,
  inMenu = false,
  defaultOpen,
}: ThreadCostBadgeControlProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const rows = buildCostRows(threadId, usage, subtree);
  const total = formatCredits(
    usage.members.reduce((sum, m) => sum + m.usage.totalCredits, 0),
  );
  const onOpenChange = (open: boolean) => {
    if (!open) setSelected(null);
  };
  const breakdown = (
    <CostBreakdown
      rows={rows}
      selected={selected}
      onSelect={setSelected}
      phone={phone}
    />
  );
  const trigger = (
    <Button variant="ghost" size="sm" aria-label={`Thread cost ${total}`}>
      <CostValue key={threadId} value={total} />
    </Button>
  );

  if (inMenu) {
    return (
      <MenuSub onOpenChange={onOpenChange} defaultOpen={defaultOpen}>
        <MenuSubTrigger className={menuRowVariants()}>
          <span className={menuIconSlot}>
            <CurrencyDollarGlyph />
          </span>
          <span className={menuLabel}>Cost</span>
          <span className="ml-auto flex shrink-0 items-center gap-1.5 text-sm font-normal text-muted-foreground-1">
            {total}
          </span>
        </MenuSubTrigger>
        <MenuContent className="w-96">{breakdown}</MenuContent>
      </MenuSub>
    );
  }

  if (phone) {
    return (
      <Drawer onOpenChange={onOpenChange} defaultOpen={defaultOpen}>
        <DrawerTrigger render={trigger} />
        <DrawerContent>
          <div className="px-2 pb-4">
            <div className="px-2 pb-1 text-sm font-medium">Cost</div>
            {breakdown}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover onOpenChange={onOpenChange} defaultOpen={defaultOpen}>
      <Tooltip>
        <TooltipTrigger render={<PopoverTrigger render={trigger} />} />
        <TooltipContent side="bottom">Thread cost</TooltipContent>
      </Tooltip>
      <PopoverContent side="bottom" align="end" className="w-96 p-1">
        {breakdown}
      </PopoverContent>
    </Popover>
  );
}

/** A thread that has not spent anything yet still carries Capy's chip, reading $0.00. */
const emptyThreadUsage: ThreadUsage = { members: [], crew: [] };

export type ThreadCostBadgeProps = {
  orgId: string;
  jamId: string;
  subtree?: ReadonlyArray<SubtreeNode>;
  phone?: boolean;
  inMenu?: boolean;
};

export function ThreadCostBadge({
  orgId,
  jamId,
  subtree,
  phone,
  inMenu,
}: ThreadCostBadgeProps) {
  const result = useAtomValue(threadUsageAtom(`${orgId}/${jamId}`));
  const usage = parseThreadUsage(
    Option.getOrUndefined(AsyncResult.value(result)),
  );
  return (
    <ThreadCostBadgeControl
      threadId={jamId}
      usage={usage ?? emptyThreadUsage}
      subtree={subtree}
      phone={phone}
      inMenu={inMenu}
    />
  );
}
