import { cx } from "class-variance-authority";
import type { ComponentProps } from "react";
import { formatStamp } from "./format-stamp";

export type ChatStampProps = Omit<ComponentProps<"div">, "children"> & {
  at: Date;
  now?: number;
};

export function ChatStamp({ at, now, className, ...props }: ChatStampProps) {
  return (
    <div
      data-slot="chat-stamp"
      className={cx(
        "flex min-h-7 items-center justify-center text-xs text-muted-foreground-2 tabular-nums select-none",
        "mb-3 max-md:mb-2.5",
        className,
      )}
      {...props}
    >
      {formatStamp(at, now)}
    </div>
  );
}
