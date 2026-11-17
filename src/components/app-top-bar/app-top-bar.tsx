import { cx } from "class-variance-authority";
import type { ComponentProps, ReactNode } from "react";
import { SidebarTrigger, useSidebarStateOptional } from "@/primitives/sidebar";

export type AppTopBarProps = Omit<ComponentProps<"header">, "title"> & {
  /** The page title, shown after the leading breadcrumb. */
  title?: ReactNode;
  /** The breadcrumb or back link shown before the title. */
  leading?: ReactNode;
  /** Actions pinned to the trailing edge. */
  trailing?: ReactNode;
};

const BAR_CLASS =
  "sticky top-0 z-(--z-top-bar) flex min-h-11 shrink-0 items-center bg-panel px-2";

export function AppTopBar({
  title,
  leading,
  trailing,
  className,
  children,
  ...props
}: AppTopBarProps) {
  return (
    <header
      {...props}
      className={cx(
        className ?? BAR_CLASS,
        title !== undefined && "border-b-hairline border-border-1",
      )}
    >
      <SidebarTriggerRail />
      {leading !== undefined && (
        <span className="flex min-w-0 shrink-0 items-center pl-2">
          {leading}
        </span>
      )}
      {title !== undefined && (
        <h1 className="ml-2.5 min-w-0 truncate text-sm font-medium text-foreground">
          {title}
        </h1>
      )}
      {children}
      {trailing !== undefined && (
        <div className="ml-auto flex items-center gap-1.5 pl-2">{trailing}</div>
      )}
    </header>
  );
}

function SidebarTriggerRail() {
  const sidebar = useSidebarStateOptional();
  if (sidebar === null) return null;
  const visible = sidebar.isNarrow || !sidebar.open;
  return (
    <span
      inert={!visible || undefined}
      className={cx(
        "ease-out-quint flex shrink-0 items-center overflow-hidden transition-[width,margin,opacity] duration-base [[data-tab-strip]_&]:hidden motion-reduce:transition-none",
        visible ? "w-(--h-control-sm) -mr-1 opacity-100" : "mr-0 w-0 opacity-0",
      )}
    >
      <SidebarTrigger />
    </span>
  );
}
