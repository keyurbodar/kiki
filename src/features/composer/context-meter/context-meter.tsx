import { useAtomValue } from "@effect/atom-react";
import { cx } from "class-variance-authority";
import { AsyncResult } from "effect/reactivity";
import { type ComponentProps, type ReactNode, useState } from "react";
import { contextUsageAtom } from "@/data/atoms/events";
import type { ContextUsage } from "@/data/events/events";
import { Button } from "@/primitives/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/primitives/drawer";
import { Popover, PopoverContent, PopoverTrigger } from "@/primitives/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import {
  contextRingCircumference,
  contextRingRadius,
  formatTokens,
  meterSegments,
  segmentLabel,
  segmentTone,
  type UsageLevel,
  usageLevel,
  usedFraction,
} from "./format";
import { MeterBar, meterToneClass } from "./meter-bar";

const ringTone: Record<UsageLevel, string> = {
  neutral: "text-muted-foreground-2",
  warning: "text-warning-fg",
  danger: "text-destructive",
};

export type ContextMeterUsage = Pick<
  ContextUsage,
  "usedTokens" | "budgetTokens" | "segments"
>;

export type ContextMeterCompact = {
  jamId: string;
  tokens: number;
  defaultTokens: number;
  windowTokens: number;
  model?: string;
  threadTokens?: number;
};

export type ContextMeterControlProps = {
  usage: ContextMeterUsage;
  /** Phones open a drawer instead of a popover. */
  phone?: boolean;
  defaultOpen?: boolean;
  /** Present when the thread has a compact-at setting; adds the "Compact at" row. */
  compact?: ContextMeterCompact;
  /** Renders the compact-at dialog (features/thread/thread-compact-at-dialog, owned elsewhere). */
  renderCompactDialog?: (
    compact: ContextMeterCompact,
    onClose: () => void,
  ) => ReactNode;
};

/** The ring button and its breakdown, from Capy's `ContextMeterControl`. */
export function ContextMeterControl({
  usage,
  phone = false,
  defaultOpen = false,
  compact,
  renderCompactDialog,
}: ContextMeterControlProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [compactOpen, setCompactOpen] = useState(false);
  const fraction = usedFraction(usage);
  const percent = Math.round(fraction * 100);
  const level = usageLevel(fraction);
  const used = formatTokens(usage.usedTokens);
  const budget = formatTokens(usage.budgetTokens);
  const segments =
    usage.segments === undefined || usage.segments.length === 0
      ? null
      : usage.segments;

  const button = (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={`${used} of ${budget} token budget used, ${percent}%`}
    >
      <svg
        viewBox="0 0 16 16"
        className="size-(--icon-base) -rotate-90"
        aria-hidden
      >
        <circle
          cx="8"
          cy="8"
          r={contextRingRadius}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-border-2"
        />
        <circle
          cx="8"
          cy="8"
          r={contextRingRadius}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray={contextRingCircumference}
          strokeDashoffset={contextRingCircumference * (1 - fraction)}
          className={ringTone[level]}
        />
      </svg>
    </Button>
  );

  const body = (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium">Context</span>
        <span className="text-xs font-normal text-muted-foreground-2 tabular-nums">
          {used} / {budget} used ({percent}%)
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label="Context used"
      >
        <MeterBar segments={meterSegments(usage)} />
      </div>
      {segments !== null && (
        <div className="flex flex-col gap-1.5">
          {segments.map((segment) => (
            <div
              key={segment.key}
              className="flex items-center gap-2 text-xs font-normal"
            >
              <span
                className={cx(
                  "size-2 shrink-0 rounded-sm",
                  meterToneClass[segmentTone[segment.key]],
                )}
              />
              <span className="truncate">{segmentLabel[segment.key]}</span>
              <span className="ml-auto text-muted-foreground-2 tabular-nums">
                {formatTokens(segment.tokens)}
              </span>
            </div>
          ))}
        </div>
      )}
      {compact !== undefined && (
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-between"
          onClick={() => {
            setOpen(false);
            setCompactOpen(true);
          }}
        >
          <span>Compact at</span>
          <span className="tabular-nums">
            {formatTokens(compact.tokens)}
            <span className="text-muted-foreground-2">
              {` / ${formatTokens(compact.windowTokens)}`}
            </span>
          </span>
        </Button>
      )}
    </div>
  );

  const dialog =
    compactOpen && compact !== undefined && renderCompactDialog !== undefined
      ? renderCompactDialog(compact, () => setCompactOpen(false))
      : null;

  if (phone)
    return (
      <>
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger render={button} />
          <DrawerContent>
            <div className="px-4 pb-4">{body}</div>
          </DrawerContent>
        </Drawer>
        {dialog}
      </>
    );

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <Tooltip>
          <TooltipTrigger render={<PopoverTrigger render={button} />} />
          <TooltipContent side="top">{`${used} / ${budget} tokens`}</TooltipContent>
        </Tooltip>
        <PopoverContent side="top" align="end" className="w-72 p-3">
          {body}
        </PopoverContent>
      </Popover>
      {dialog}
    </>
  );
}

/** Builds the compact-at row's data the way Capy's `ContextMeter` does. */
export const compactOf = (
  jamId: string,
  usage: ContextUsage,
): ContextMeterCompact | undefined =>
  usage.compactAtTokens === undefined ||
  usage.defaultCompactAtTokens === undefined ||
  usage.windowTokens === undefined
    ? undefined
    : {
        jamId,
        tokens: usage.compactAtTokens,
        defaultTokens: usage.defaultCompactAtTokens,
        windowTokens: usage.windowTokens,
        model: usage.modelId,
        threadTokens: usage.threadCompactAtTokens,
      };

export type ContextMeterProps = Omit<ComponentProps<"div">, "children"> & {
  orgId: string;
  jamId: string;
  phone?: boolean;
  renderCompactDialog?: ContextMeterControlProps["renderCompactDialog"];
};

/** Reads `events/context-usage` for a thread and renders nothing until it lands. */
export function ContextMeter({
  orgId,
  jamId,
  phone,
  renderCompactDialog,
  ...props
}: ContextMeterProps) {
  const usage = AsyncResult.getOrElse(
    useAtomValue(contextUsageAtom(orgId, jamId)),
    () => null,
  );
  if (usage === null) return null;
  return (
    <div {...props}>
      <ContextMeterControl
        usage={usage}
        phone={phone}
        compact={compactOf(jamId, usage)}
        renderCompactDialog={renderCompactDialog}
      />
    </div>
  );
}
