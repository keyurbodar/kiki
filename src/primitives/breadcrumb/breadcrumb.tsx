import { Link, type LinkProps } from "@tanstack/react-router";
import { cx } from "class-variance-authority";
import type { ComponentProps, ReactNode } from "react";
import { Icon } from "@/primitives/icon";

export type BreadcrumbProps = {
  to: NonNullable<LinkProps["to"]>;
  params?: LinkProps["params"];
  label: ReactNode;
  className?: string;
};

/** Back link to the parent page: a chevron and the parent's name. */
export function Breadcrumb({ to, params, label, className }: BreadcrumbProps) {
  return (
    <Link
      data-slot="breadcrumb"
      to={to}
      params={params}
      className={cx(
        "-ml-2 flex h-(--h-control-sm) w-fit items-center gap-1.5 rounded px-2 text-sm font-medium text-muted-foreground-1 select-none",
        "transition-colors duration-(--duration-hover) hover:bg-secondary",
        "outline-none focus-visible:outline-ring-inset",
        className,
      )}
    >
      <Icon
        name="chevron-left-medium"
        size={null}
        className="size-(--icon-sm) shrink-0"
      />
      {label}
    </Link>
  );
}

export type BreadcrumbItemProps = ComponentProps<"span">;

export function BreadcrumbItem(props: BreadcrumbItemProps) {
  return <span data-slot="breadcrumb-item" {...props} />;
}
