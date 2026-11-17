import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";

export type SupportOrganizationBannerViewProps = {
  name: string;
  onExit: () => void;
};

/** The strip a superadmin sees while viewing an organization they're not in. */
export function SupportOrganizationBannerView({
  name,
  onExit,
}: SupportOrganizationBannerViewProps) {
  return (
    <div className="flex min-h-11 shrink-0 items-center gap-3 border-b-hairline border-border-1 bg-card px-4 py-2">
      <Icon
        name="exclamation-triangle"
        className="size-(--icon-base) shrink-0 text-warning-fg"
      />
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
        Viewing {name} as superadmin
      </span>
      <Button size="xs" onClick={onExit}>
        Exit
      </Button>
    </div>
  );
}
