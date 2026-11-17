import type { ComponentProps } from "react";

export type BreadcrumbProps = ComponentProps<"nav">;

export function Breadcrumb(props: BreadcrumbProps) {
  return <nav data-slot="breadcrumb" {...props} />;
}

export type BreadcrumbItemProps = ComponentProps<"span">;

export function BreadcrumbItem(props: BreadcrumbItemProps) {
  return <span data-slot="breadcrumb-item" {...props} />;
}
