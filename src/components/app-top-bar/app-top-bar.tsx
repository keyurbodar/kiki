import type { ComponentProps, ReactNode } from "react";

export type AppTopBarProps = ComponentProps<"header"> & {
  /** The breadcrumb or back link shown before the title. */
  leading?: ReactNode;
  /** Actions pinned to the trailing edge. */
  trailing?: ReactNode;
};

export function AppTopBar({
  leading,
  trailing,
  className,
  children,
  ...props
}: AppTopBarProps) {
  return (
    <header
      className={
        className ??
        "sticky top-0 z-(--z-top-bar) flex min-h-11 shrink-0 items-center bg-panel px-2"
      }
      {...props}
    >
      {leading}
      {children}
      {trailing}
    </header>
  );
}
