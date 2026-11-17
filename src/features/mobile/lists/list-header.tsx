import type { ReactNode } from "react";
import { MobileSidebarTrigger } from "@/features/mobile/shell";

export type MobileListHeaderProps = {
  /** A page title, or the breadcrumb node Capy draws instead of one. */
  title: ReactNode;
  actions?: ReactNode;
  /** Explore sits the trigger beside the breadcrumb with a gap; lists tuck it in. */
  gap?: "tight" | "wide";
};

export function MobileListHeader({
  title,
  actions,
  gap = "tight",
}: MobileListHeaderProps) {
  return (
    <header
      data-slot="mobile-list-header"
      className="sticky top-0 z-(--z-top-bar) flex min-h-11 shrink-0 items-center border-b-(length:--border-width-hairline) border-border-1 bg-panel px-2"
    >
      <span
        data-slot="mobile-list-header-trigger"
        className={`flex w-(--h-control-sm) shrink-0 items-center overflow-hidden [[data-tab-strip]_&]:hidden ${gap === "wide" ? "mr-2" : "-mr-1"}`}
      >
        <MobileSidebarTrigger />
      </span>
      {typeof title === "string" ? (
        <h1 className="ml-2.5 min-w-0 truncate text-sm font-medium text-foreground">
          {title}
        </h1>
      ) : (
        title
      )}
      {actions === undefined ? null : (
        <div className="ml-auto flex items-center gap-1.5 pl-2">{actions}</div>
      )}
    </header>
  );
}
