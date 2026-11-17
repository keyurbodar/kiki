import {
  useSidebarActions,
  useSidebarOpenMobile,
} from "@/features/shell/sidebar-container";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";

export type MobileSidebarTriggerProps = { className?: string };

export function MobileSidebarTrigger({ className }: MobileSidebarTriggerProps) {
  const open = useSidebarOpenMobile();
  const { setOpenMobile } = useSidebarActions();
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={open ? "Close sidebar" : "Open sidebar"}
      aria-pressed={open}
      className={className}
      onClick={() => setOpenMobile((current) => !current)}
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
