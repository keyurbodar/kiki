import { toast } from "sonner";
import { useDiffPreferences } from "@/lib/diff-preferences";
import { Icon } from "@/primitives/icon";
import { ResponsiveMenuItem } from "@/primitives/responsive-menu";

export const menuIconSlotClassName =
  "flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted in-data-[intent=danger]:text-destructive";

export const menuCheckClassName = "size-(--icon-sm) shrink-0 text-foreground";

const saveFailed = () => toast.error("Could not save line wrapping");

export function DiffWrapMenuItem() {
  const { preferences, updateAppearance } = useDiffPreferences();
  const wrap = preferences.diffWrap;
  return (
    <ResponsiveMenuItem
      closeOnClick={false}
      onClick={() => {
        updateAppearance({ diffWrap: !wrap }).catch(saveFailed);
      }}
    >
      <span className={menuIconSlotClassName}>
        <Icon name="linebreak" size="sm" />
      </span>
      Wrap lines
      {wrap ? (
        <Icon name="checkmark-1" className={`ml-auto ${menuCheckClassName}`} />
      ) : null}
    </ResponsiveMenuItem>
  );
}
