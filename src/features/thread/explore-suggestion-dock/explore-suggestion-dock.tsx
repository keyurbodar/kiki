import type { ComponentProps, ReactNode } from "react";
import { AttentionCardIcon } from "@/features/thread/attention-card";
import { Button } from "@/primitives/button";
import { Icon, type IconId } from "@/primitives/icon";
import { SuggestionDock } from "./suggestion-dock";

export type ExploreListingKind = "skill" | "theme";

export type ExploreListing = {
  kind: ExploreListingKind;
  display_name: string;
  description: string;
  repository: string | null;
  stars: number | null;
};

const KINDS: Record<ExploreListingKind, { label: string; icon: IconId }> = {
  skill: { label: "Skill", icon: "plugin-1" },
  theme: { label: "Theme", icon: "color-palette" },
};

const compact = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export const listingMeta = (listing: ExploreListing) => {
  const from = listing.repository === null ? "" : ` from ${listing.repository}`;
  const stars =
    listing.stars === null
      ? ""
      : `, ${compact.format(listing.stars).toLowerCase()} ${listing.stars === 1 ? "star" : "stars"}`;
  return `${KINDS[listing.kind].label}${from}${stars}`;
};

export type ExploreSuggestionDockProps = Omit<
  ComponentProps<"div">,
  "children"
> & {
  listing?: ExploreListing;
  reason?: ReactNode;
  action?: ReactNode;
  onLater?: () => void;
  onDismiss?: () => void;
};

export function ExploreSuggestionDock({
  listing,
  reason,
  action,
  onLater,
  onDismiss,
  ...props
}: ExploreSuggestionDockProps) {
  if (listing === undefined) return null;
  return (
    <SuggestionDock
      slot="explore-suggestion-dock"
      label="Suggested from Explore"
      footer={
        <>
          <span className="flex items-center gap-2">
            <Button variant="outline" size="xs" onClick={onLater}>
              Later
            </Button>
            {onDismiss !== undefined && (
              <Button variant="ghost" size="xs" onClick={onDismiss}>
                Dismiss
              </Button>
            )}
          </span>
          <span className="flex items-center gap-2">{action}</span>
        </>
      }
      {...props}
    >
      <div className="flex flex-col gap-3">
        <div className="flex gap-3">
          <AttentionCardIcon status="pending">
            <Icon name={KINDS[listing.kind].icon} />
          </AttentionCardIcon>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="truncate text-sm font-medium text-foreground">
              {listing.display_name}
            </span>
            <span className="truncate text-sm text-muted-foreground-1">
              {listingMeta(listing)}
            </span>
          </div>
        </div>
        <p className="line-clamp-3 text-sm text-muted-foreground-1">
          {listing.description}
        </p>
        <div className="flex gap-3 text-sm">
          <span className="w-8 shrink-0 text-muted-foreground-2">Why</span>
          <span className="min-w-0 text-foreground">{reason}</span>
        </div>
      </div>
    </SuggestionDock>
  );
}
