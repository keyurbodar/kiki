import type { ComponentProps, ReactNode } from "react";
import { Card, CardListHeader } from "@/primitives/card";
import { cx } from "./settings-kit";

/** Capy's settings card with hairline row dividers (Card variant default, rows). */
export function CardList({ className, ...props }: ComponentProps<"div">) {
  return (
    <Card
      rows
      className={cx(
        "flex flex-col overflow-clip rounded-(--radius-card) border-[0.03125rem] border-(--card-hairline) bg-card shadow-card divide-y-[0.03125rem] divide-border-1",
        className,
      )}
      {...props}
    />
  );
}

export function CardListTitle({
  title,
  children,
}: {
  readonly title: ReactNode;
  readonly children?: ReactNode;
}) {
  return (
    <CardListHeader className="flex min-h-15 items-center justify-between gap-3 py-3 pr-2 pl-4">
      <span className="min-w-0 flex-1 text-sm font-medium text-foreground">
        {title}
      </span>
      {children && (
        <div className="flex shrink-0 items-center gap-0.5">{children}</div>
      )}
    </CardListHeader>
  );
}

export function CardEmpty({ children }: { readonly children: ReactNode }) {
  return (
    <div className="p-8 text-center text-sm font-normal text-muted-foreground-2">
      {children}
    </div>
  );
}

const dotColor = {
  neutral: "bg-muted-foreground-3",
  accent: "bg-primary",
  success: "bg-success",
  danger: "bg-destructive",
  warning: "bg-warning",
  info: "bg-info",
} as const;

export type StatusDotColor = keyof typeof dotColor;

export function StatusDot({
  color = "neutral",
  className,
}: {
  readonly color?: StatusDotColor;
  readonly className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cx("size-1.5 shrink-0 rounded-full", dotColor[color], className)}
    />
  );
}
