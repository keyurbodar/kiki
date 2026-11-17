import { useEffect } from "react";
import type { SettingsSearchContext } from "@/features/settings/nav/search";
import { SettingsSidebarPanel } from "@/features/settings/shell";
import { useIsNarrow } from "@/features/shell/sidebar-container";
import { Sheet, SheetContent } from "@/primitives/sheet";
import { MobileSidebarTrigger } from "./mobile-sidebar-trigger";

export type MobileSettingsSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  searchContext?: SettingsSearchContext;
};

/**
 * The settings sidebar on phones: Capy's left "Navigation" sheet holding the
 * settings sidebar, mounted only below md and closed when the viewport widens.
 * Styling is the Sheet primitive's (ui/sheet), so none is passed here.
 */
export function MobileSettingsSheet({
  open,
  onOpenChange,
  searchContext,
}: MobileSettingsSheetProps) {
  const isNarrow = useIsNarrow();
  useEffect(() => {
    if (!isNarrow && open) onOpenChange(false);
  }, [isNarrow, open, onOpenChange]);
  if (!isNarrow) return null;
  const close = () => onOpenChange(false);
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent aria-label="Navigation">
        <SettingsSidebarPanel
          searchContext={searchContext}
          trigger={<MobileSidebarTrigger open={open} onToggle={close} />}
          onNavigate={close}
        />
      </SheetContent>
    </Sheet>
  );
}
