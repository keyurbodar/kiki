import type { ComponentProps } from "react";
import {
  actorName,
  cx,
  useMessageActions,
} from "@/features/thread/message-footer";
import { Icon } from "@/primitives/icon";

export type ReplyQuoteProps = Omit<ComponentProps<"button">, "children"> & {
  rowId: string;
  section: number;
  quote: string;
  align?: "start" | "end";
};

/** The "replying to" line above a message; clicking it jumps to the quoted section. */
export function ReplyQuote({
  rowId,
  section,
  quote,
  align = "start",
  className,
  ...props
}: ReplyQuoteProps) {
  const actions = useMessageActions();
  const actor = actions.rowActors?.get(rowId);
  return (
    <button
      type="button"
      data-slot="reply-quote"
      onClick={() => actions.jumpToSection?.(rowId, section)}
      className={cx(
        "relative flex max-w-full min-w-0 cursor-pointer items-center gap-1.5 rounded-(--radius-inner) text-xs focus-gutter leading-5 text-muted-foreground-2 outline-none transition-colors hover:text-muted-foreground focus-visible:outline-ring-inset pointer-coarse:after:absolute pointer-coarse:after:top-1/2 pointer-coarse:after:left-1/2 pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 pointer-coarse:after:-translate-x-1/2 pointer-coarse:after:-translate-y-1/2",
        align === "end" ? "self-end" : "self-start",
        className,
      )}
      {...props}
    >
      <span className="flex size-4 shrink-0 items-center justify-center text-icon-muted">
        <Icon name="arrow-share-left" className="size-3.5" />
      </span>
      {actor !== undefined && (
        <span className="mask-fade-r max-w-1/2 shrink-0 overflow-hidden font-medium whitespace-nowrap text-muted-foreground [--mask-fade-ramp:--spacing(4)]">
          {actorName(actions, actor)}
        </span>
      )}
      <span className="mask-fade-r min-w-0 overflow-hidden whitespace-nowrap [--mask-fade-ramp:--spacing(8)]">
        {quote}
      </span>
    </button>
  );
}
