import type { ReactNode } from "react";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { Sheet, SheetContent } from "@/primitives/sheet";
import { useIsNarrow } from "../use-mobile";
import { useMobileNavigation } from "./mobile-navigation";

export type MobileNavigationSheetProps = { children: ReactNode };

export function MobileNavigationSheet({
  children,
}: MobileNavigationSheetProps) {
  const isNarrow = useIsNarrow();
  const { open, setOpen } = useMobileNavigation();
  if (!isNarrow) return null;
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent aria-label="Navigation">{children}</SheetContent>
    </Sheet>
  );
}

export type MobileSidebarTriggerProps = { className?: string };

export function MobileSidebarTrigger({ className }: MobileSidebarTriggerProps) {
  const { open, toggle } = useMobileNavigation();
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={open ? "Close sidebar" : "Open sidebar"}
      aria-pressed={open}
      className={className}
      onClick={toggle}
    >
      <Icon name="sidebar-simple-left-wide" />
    </Button>
  );
}

export function MobileTopBar() {
  return (
    <div className="absolute top-1.5 left-2 z-(--z-top-bar) [[data-tab-strip]_&]:hidden">
      <MobileSidebarTrigger />
    </div>
  );
}

export type MobileShellProps = {
  sidebar: ReactNode;
  children: ReactNode;
};

export function MobileShell({ sidebar, children }: MobileShellProps) {
  return (
    <>
      {children}
      <MobileNavigationSheet>{sidebar}</MobileNavigationSheet>
    </>
  );
}
