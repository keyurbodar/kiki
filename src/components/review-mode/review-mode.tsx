import type { ReactElement, ReactNode } from "react";
import {
  MenuContent,
  MenuSeparator,
  MenuSub,
  MenuSubTrigger,
  MenuTrigger,
} from "@/primitives/menu";
import {
  ResponsiveMenu,
  ResponsiveMenuItem,
} from "@/primitives/responsive-menu";
import { CheckmarkGlyph, cx } from "./glyphs";

export const reviewTiers = ["low", "medium", "high"] as const;

export type ReviewTier = (typeof reviewTiers)[number];

export const reviewTierCopy: Record<
  ReviewTier,
  { readonly label: string; readonly description: string }
> = {
  low: {
    label: "Low",
    description: "Lowest cost, flags only high-confidence issues",
  },
  medium: { label: "Medium", description: "Balanced cost and intelligence" },
  high: {
    label: "High",
    description: "Highest intelligence, most thorough coverage",
  },
};

export const reviewCreditsPerTier: Record<ReviewTier, number> = {
  low: 1,
  medium: 5,
  high: 10,
};

export const formatCount = (value: number) =>
  Math.floor(Math.max(0, value)).toLocaleString("en-US");

export const pluralCount = (value: number, unit: string) =>
  `${formatCount(value)} ${unit}${Math.floor(value) === 1 ? "" : "s"}`;

export const reviewTierCost = (tier: ReviewTier) =>
  `Uses ${pluralCount(reviewCreditsPerTier[tier], "review credit")}`;

export const autoReviewModes = [
  { value: "off", label: "Off", hint: "No automatic reviews" },
  {
    value: "once",
    label: "Once",
    hint: "First review only, when a pull request opens",
  },
  {
    value: "always",
    label: "Every push",
    hint: "Each opening and every later push",
  },
] as const;

export type AutoReviewMode = (typeof autoReviewModes)[number]["value"];

export const autoReviewModeLabel = (mode: string) =>
  autoReviewModes.find((entry) => entry.value === mode)?.label ?? mode;

const menuIconSlot =
  "flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted in-data-[intent=danger]:text-destructive";
const menuTrailing =
  "ml-auto flex shrink-0 items-center gap-1.5 text-sm font-normal text-muted-foreground-1";
const menuCheck = "size-(--icon-sm) shrink-0 text-foreground";

export type MenuRowContentProps = {
  readonly icon?: ReactNode;
  readonly label: ReactNode;
  readonly description?: ReactNode;
  readonly trailing?: ReactNode;
  readonly density?: "default" | "rich";
  readonly className?: string;
};

export function MenuRowContent({
  icon,
  label,
  description,
  trailing,
  density,
  className,
}: MenuRowContentProps) {
  const rich = density === "rich" && description != null;
  return (
    <span
      data-slot="menu-row"
      className={cx(
        "flex min-w-0 flex-1 items-center gap-2 text-left",
        className,
      )}
    >
      {icon ? (
        <span className={cx(menuIconSlot, rich && "h-5 self-start")}>
          {icon}
        </span>
      ) : null}
      <span className="flex min-w-0 flex-1 flex-col justify-center">
        <span className="line-clamp-1 min-w-0 text-sm font-normal text-foreground in-data-[intent=danger]:text-destructive">
          {label}
        </span>
        {description ? (
          <span className="line-clamp-1 min-w-0 text-xs font-normal text-muted-foreground-2">
            {description}
          </span>
        ) : null}
      </span>
      {trailing ? (
        <span className={cx(menuTrailing, rich && "h-5 self-start")}>
          {trailing}
        </span>
      ) : null}
    </span>
  );
}

export type AutoReviewModeMenuProps = {
  readonly value: AutoReviewMode;
  readonly trigger: ReactElement;
  readonly onPick: (mode: AutoReviewMode) => void;
};

export function AutoReviewModeMenu({
  value,
  trigger,
  onPick,
}: AutoReviewModeMenuProps) {
  return (
    <ResponsiveMenu>
      <MenuTrigger
        data-track-owner="shared/review-mode.tsx#AutoReviewModeMenu:ResponsiveMenuTrigger.1"
        render={trigger}
      />
      <MenuContent align="end" className="w-72">
        {autoReviewModes.map((mode) => (
          <ResponsiveMenuItem
            key={mode.value}
            data-track-owner="shared/review-mode.tsx#AutoReviewModeMenu:ResponsiveMenuItem.1"
            data-density="rich"
            onClick={() => {
              if (mode.value !== value) onPick(mode.value);
            }}
          >
            <MenuRowContent
              density="rich"
              label={mode.label}
              description={mode.hint}
              trailing={
                mode.value === value ? (
                  <CheckmarkGlyph className={menuCheck} />
                ) : undefined
              }
            />
          </ResponsiveMenuItem>
        ))}
      </MenuContent>
    </ResponsiveMenu>
  );
}

export type ReviewEffortMenuProps = {
  readonly value: ReviewTier | null;
  readonly trigger: ReactElement;
  readonly onPick: (tier: ReviewTier | null) => void;
  readonly defaultLabel?: string;
  readonly defaultDescription?: string;
  /** "How usage counts" content; given only when the plan meters review credits. */
  readonly usage?: ReactNode;
};

export function ReviewEffortMenu({
  value,
  trigger,
  onPick,
  defaultLabel = "Platform default",
  defaultDescription = "Follow Capy's default review tier",
  usage,
}: ReviewEffortMenuProps) {
  const metered = usage !== undefined;
  return (
    <ResponsiveMenu>
      <MenuTrigger
        data-track-owner="shared/review-mode.tsx#ReviewEffortMenu:ResponsiveMenuTrigger.1"
        render={trigger}
      />
      <MenuContent align="end" className="w-80">
        {reviewTiers.map((tier) => (
          <ResponsiveMenuItem
            key={tier}
            data-track-owner="shared/review-mode.tsx#ReviewEffortMenu:ResponsiveMenuItem.1"
            data-density="rich"
            onClick={() => {
              if (tier !== value) onPick(tier);
            }}
          >
            <MenuRowContent
              density="rich"
              label={reviewTierCopy[tier].label}
              description={reviewTierCopy[tier].description}
              trailing={
                !metered && tier !== value ? undefined : (
                  <>
                    {metered ? reviewTierCost(tier) : null}
                    {tier === value ? (
                      <CheckmarkGlyph className={menuCheck} />
                    ) : null}
                  </>
                )
              }
            />
          </ResponsiveMenuItem>
        ))}
        <MenuSeparator />
        <ResponsiveMenuItem
          data-track-owner="shared/review-mode.tsx#ReviewEffortMenu:ResponsiveMenuItem.2"
          data-density="rich"
          onClick={() => {
            if (value !== null) onPick(null);
          }}
        >
          <MenuRowContent
            density="rich"
            label={defaultLabel}
            description={defaultDescription}
            trailing={
              value === null ? (
                <CheckmarkGlyph className={menuCheck} />
              ) : undefined
            }
          />
        </ResponsiveMenuItem>
        {metered ? (
          <>
            <MenuSeparator />
            <MenuSub>
              <MenuSubTrigger data-density="default">
                <MenuRowContent label="How usage counts" />
              </MenuSubTrigger>
              <MenuContent className="w-96 p-2">{usage}</MenuContent>
            </MenuSub>
          </>
        ) : null}
      </MenuContent>
    </ResponsiveMenu>
  );
}
