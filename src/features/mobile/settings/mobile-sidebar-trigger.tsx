import { SettingsIcon } from "@/features/settings/shell";
import { Button } from "@/primitives/button";

export type MobileSidebarTriggerProps = {
  open: boolean;
  onToggle: () => void;
  className?: string;
};

/** Capy's SidebarTrigger as it behaves below md: it reflects the sheet's open state. */
export function MobileSidebarTrigger({
  open,
  onToggle,
  className,
}: MobileSidebarTriggerProps) {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={open ? "Close sidebar" : "Open sidebar"}
      aria-pressed={open}
      className={className}
      onClick={onToggle}
    >
      <SettingsIcon name="sidebar-simple-left-wide" />
    </Button>
  );
}
