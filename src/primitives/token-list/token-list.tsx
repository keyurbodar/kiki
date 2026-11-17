import { cx } from "class-variance-authority";
import type { ComponentProps } from "react";

export type TokenListProps = ComponentProps<"div">;

export function TokenList({ className, ...props }: TokenListProps) {
  return (
    <div
      data-slot="token-list"
      className={cx(
        "flex flex-col divide-y-hairline divide-border-1 rounded-(--radius-card) border-hairline border-border-2",
        className,
      )}
      {...props}
    />
  );
}
