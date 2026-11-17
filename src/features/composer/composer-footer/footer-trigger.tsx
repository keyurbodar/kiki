import { cx } from "class-variance-authority";
import type { ReactNode } from "react";
import { Button, type ButtonProps } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import type { StatusColor } from "./machine";

const statusDotColor: Record<StatusColor, string> = {
  neutral: "bg-muted-foreground-3",
  accent: "bg-primary",
  success: "bg-success",
  danger: "bg-destructive",
  warning: "bg-warning",
  info: "bg-info",
};

export type StatusDotProps = { color?: StatusColor; className?: string };

/** Capy's `ui/status-trigger` StatusDot. */
export function StatusDot({ color = "neutral", className }: StatusDotProps) {
  return (
    <span
      aria-hidden
      className={cx(
        "size-1.5 shrink-0 rounded-full",
        statusDotColor[color],
        className,
      )}
    />
  );
}

export type FooterTriggerProps = Omit<ButtonProps, "color"> & {
  icon?: ReactNode;
  color?: StatusColor;
  chevron?: boolean;
  detailClassName?: string;
};

/** Capy's `ui/status-trigger` FooterTrigger: a bare xs button with icon, label, dot and chevron. */
export function FooterTrigger({
  icon,
  color,
  chevron = true,
  className,
  detailClassName,
  children,
  ...props
}: FooterTriggerProps) {
  return (
    <Button
      variant="bare"
      size="xs"
      className={cx("-mx-2 min-w-0 shrink", className)}
      {...props}
    >
      {icon}
      <span className={cx("min-w-0 truncate", detailClassName)}>
        {children}
      </span>
      {color !== undefined && <StatusDot color={color} />}
      {chevron && (
        <Icon
          name="chevron-top-small"
          className={cx(
            "size-(--icon-sm) shrink-0 text-muted-foreground-3",
            detailClassName,
          )}
        />
      )}
    </Button>
  );
}
