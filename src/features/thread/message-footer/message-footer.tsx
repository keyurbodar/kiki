import { type ComponentProps, useEffect, useRef, useState } from "react";
import type { ReasoningMode as ReasoningModeSchema } from "@/data/events";
import { Button } from "@/primitives/button";
import { MenuSeparator } from "@/primitives/menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import { useMessageActions } from "./context";
import { cx } from "./cx";
import { formatMessageStamp } from "./format";
import { CheckIcon, ClockIcon, CopyIcon } from "./icons";

type ReasoningMode = typeof ReasoningModeSchema.Type;

export type MessageFooterProps = ComponentProps<"div"> & {
  touch?: boolean;
  align?: "start" | "end";
};

/** The hover toolbar pinned to the top-right of a message section. */
export function MessageFooter({
  touch = false,
  align = "end",
  className,
  ...props
}: MessageFooterProps) {
  return (
    <div
      className={cx(
        "pointer-events-none absolute -top-5.5 right-0 bottom-0 flex flex-col",
        align === "start" ? "left-0 items-end-safe" : "items-end",
        !touch && "pointer-coarse:hidden",
      )}
    >
      <div
        data-slot="message-footer"
        className={cx(
          "pointer-events-auto sticky top-0 flex h-7 items-center gap-0.5 rounded-(--radius) border-hairline border-border-2 bg-card px-0.5 opacity-0 shadow-sm transition-opacity group-hover/rail:opacity-100 has-focus-visible:opacity-100 has-[[data-popup-open]]:opacity-100 md:top-(--scroll-fade-ramp,--spacing(8))",
          touch && "pointer-coarse:opacity-100",
          className,
        )}
        {...props}
      />
    </div>
  );
}

const COPIED_RESET = 2_000;

export type CopyMessageButtonProps = { text: string; className?: string };

export function CopyMessageButton({ text, className }: CopyMessageButtonProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const copy = () => {
    void navigator.clipboard?.writeText(text);
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), COPIED_RESET);
  };
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Copy message"
            className={className}
            onClick={copy}
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
          </Button>
        }
      />
      <TooltipContent>{copied ? "Copied" : "Copy message"}</TooltipContent>
    </Tooltip>
  );
}

export type MessageStampProps = {
  date: Date;
  className?: string;
  visibility?: "visible" | "message-hover";
};

export function MessageStamp({
  date,
  className,
  visibility = "visible",
}: MessageStampProps) {
  const { now } = useMessageActions();
  return (
    <span
      className={cx(
        "shrink-0 text-xs whitespace-nowrap text-muted-foreground-2 tabular-nums select-none",
        visibility === "message-hover" &&
          "opacity-0 transition-opacity duration-hover group-focus-within/message:opacity-100 group-hover/message:opacity-100 pointer-coarse:opacity-100",
        className,
      )}
    >
      {formatMessageStamp(date, now)}
    </span>
  );
}

export const MENU_ICON_SLOT =
  "flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted in-data-[intent=danger]:text-destructive";

const REASONING_LABELS: Record<ReasoningMode, string> = {
  none: "None",
  instant: "Instant",
  minimal: "Minimal",
  low: "Low",
  medium: "Medium",
  high: "High",
  xhigh: "Extra high",
  max: "Max",
};

const MODE_LABELS = { fast: "Fast", pro: "Pro", ultrafast: "Ultrafast" };

const DEFAULT_SOURCE_LABELS = {
  personal: "Personal default",
  service_user: "Service user default",
  slack: "Slack default",
  linear: "Linear default",
  org: "Organization default",
  platform: "Capy default",
};

export type ModelDefaultInfo = {
  source: keyof typeof DEFAULT_SOURCE_LABELS;
  skipped: ReadonlyArray<{ modelId: string; reason: string }>;
};

export type MessageMetaProps = {
  modelId?: string;
  reasoningMode?: ReasoningMode;
  mode?: keyof typeof MODE_LABELS;
  createdAt?: Date;
  modelDefault?: ModelDefaultInfo;
  separated?: boolean;
};

const META_ROW =
  "flex h-(--h-menu-row) min-w-0 items-center gap-2 px-2 text-sm text-muted-foreground-1 select-none";

/** Read-only rows at the foot of a message's More menu: model and send time. */
export function MessageMeta({
  modelId,
  reasoningMode,
  mode,
  createdAt,
  modelDefault,
  separated = false,
}: MessageMetaProps) {
  const { now } = useMessageActions();
  if (modelId === undefined && createdAt === undefined) return null;
  return (
    <>
      {separated && <MenuSeparator />}
      {modelId !== undefined && (
        <div className={META_ROW}>
          <span className="flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted" />
          <span className="truncate">
            {[
              modelId,
              reasoningMode === undefined
                ? undefined
                : REASONING_LABELS[reasoningMode],
              mode === undefined ? undefined : MODE_LABELS[mode],
            ]
              .filter((part) => part !== undefined)
              .join(" ")}
          </span>
        </div>
      )}
      {modelDefault !== undefined && (
        <div className="flex min-w-0 flex-col gap-0.5 px-2 py-1 pl-8 text-xs text-muted-foreground-1 select-none">
          <span>{DEFAULT_SOURCE_LABELS[modelDefault.source]}</span>
          {modelDefault.skipped.map((skip) => (
            <span key={skip.modelId} className="text-muted-foreground-2">
              Skipped {skip.modelId}: {skip.reason}
            </span>
          ))}
        </div>
      )}
      {createdAt !== undefined && (
        <div className={META_ROW}>
          <span className="flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted">
            <ClockIcon className="size-(--icon-sm)" />
          </span>
          <span className="truncate tabular-nums">
            {formatMessageStamp(createdAt, now)}
          </span>
        </div>
      )}
    </>
  );
}
