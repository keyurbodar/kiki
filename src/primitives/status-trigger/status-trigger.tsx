import { cx } from "class-variance-authority";
import type { ReactNode } from "react";
import { Button, type ButtonProps } from "@/primitives/button";
import { Icon } from "@/primitives/icon";

const statusDotColors = {
  neutral: "bg-muted-foreground-3",
  accent: "bg-primary",
  success: "bg-success",
  danger: "bg-destructive",
  warning: "bg-warning",
  info: "bg-info",
} as const;

export type StatusColor = keyof typeof statusDotColors;

export type StatusDotProps = { color?: StatusColor; className?: string };

export function StatusDot({ color = "neutral", className }: StatusDotProps) {
  return (
    <span
      aria-hidden
      className={cx(
        "size-1.5 shrink-0 rounded-full",
        statusDotColors[color],
        className,
      )}
    />
  );
}

export type StatusTriggerProps = Omit<ButtonProps, "color"> & {
  color?: StatusColor;
  chevron?: boolean;
};

export function StatusTrigger({
  color = "neutral",
  chevron = true,
  children,
  ...props
}: StatusTriggerProps) {
  return (
    <Button variant="ghost" {...props}>
      <StatusDot color={color} />
      {children}
      {chevron && <Icon name="chevron-down-small" size={null} />}
    </Button>
  );
}

export type FooterTriggerProps = Omit<ButtonProps, "color"> & {
  icon?: ReactNode;
  color?: StatusColor;
  chevron?: boolean;
  detailClassName?: string;
};

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
          size="sm"
          className={cx("shrink-0 text-muted-foreground-3", detailClassName)}
        />
      )}
    </Button>
  );
}
