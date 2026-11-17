import { Link } from "@tanstack/react-router";
import { Button, ButtonIcon } from "@/primitives/button";
import { formatCredits } from "./format";
import { CheckGlyph, CreditCardGlyph } from "./glyphs";
import { OrgAvatar } from "./org-avatar";
import { type PlanTier, planTierFeatures } from "./plan-tiers";
import type { PromotionOrganization } from "./use-promotion-organizations";

const dayMs = 24 * 60 * 60 * 1000;
const shortDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});
const longDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const track = (owner: string) =>
  `features/promotions/trial-started-card.tsx#TrialStartedCard:${owner}`;

export type TrialStartedCardProps = {
  organization: PromotionOrganization;
  tier: PlanTier;
  trialDays: number;
  endsAt?: Date;
  cardOnFile?: boolean;
  creditAmount?: number;
  now?: number;
  onContinue?: () => void;
};

export function TrialStartedCard({
  organization,
  tier,
  trialDays,
  endsAt: endsAtProp,
  cardOnFile = false,
  creditAmount = 0,
  now = Date.now(),
  onContinue,
}: TrialStartedCardProps) {
  const endsAt = endsAtProp ?? new Date(now + trialDays * dayMs);
  const span = trialDays * dayMs;
  const startedAt = new Date(endsAt.getTime() - span);
  const daysLeft = Math.max(Math.ceil((endsAt.getTime() - now) / dayMs), 0);
  const progress = Math.min(Math.max((now - startedAt.getTime()) / span, 0), 1);
  const shortName = tier.name.startsWith("Capy ")
    ? tier.name.slice(5)
    : tier.name;
  const endDay = shortDate.format(endsAt);
  const features =
    creditAmount > 0
      ? [
          ...planTierFeatures(tier),
          `+${formatCredits(creditAmount)} in credits`,
          "Shared with your team",
        ]
      : planTierFeatures(tier);

  return (
    <div data-slot="trial-started-card" className="flex flex-col gap-4 p-5">
      <div className="flex flex-col gap-2 rounded-(--radius-inner) bg-secondary p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <OrgAvatar src={organization.avatarUrl} name={organization.name} />
            <span className="min-w-0 truncate text-sm font-medium text-foreground">
              {organization.name} · {tier.name} trial
            </span>
          </div>
          <span className="shrink-0 text-xs font-normal tabular-nums text-muted-foreground-1">
            {daysLeft} {daysLeft === 1 ? "day" : "days"} left
          </span>
        </div>
        <div className="flex h-1.5 overflow-hidden rounded-full bg-card">
          <div
            className="h-full bg-success"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <div className="flex items-center justify-between gap-3 text-xs font-normal tabular-nums text-muted-foreground-2">
          <span>Started {shortDate.format(startedAt)}</span>
          <span className="text-right">
            Ends {longDate.format(endsAt)} ·{" "}
            {cardOnFile ? `then $${tier.priceDollars}/mo` : "then Free, $0"}
          </span>
        </div>
      </div>
      <ul className="grid grid-cols-1 gap-x-4 gap-y-2.5 sm:grid-cols-2">
        {features.map((feature) => (
          <li key={feature} className="flex min-w-0 items-center gap-2">
            <CheckGlyph className="size-(--icon-sm) shrink-0 text-success" />
            <span className="min-w-0 truncate text-sm font-normal tabular-nums text-foreground">
              {feature}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-xs font-normal tabular-nums text-muted-foreground-2">
        {cardOnFile
          ? `Your card is charged $${tier.priceDollars} on ${endDay}. Cancel before then in Billing`
          : `No card on file, so nothing is charged on ${endDay}. Add one before then to keep ${shortName}`}
      </p>
      {onContinue === undefined && cardOnFile ? null : (
        <div className="flex flex-col gap-2">
          {onContinue === undefined ? null : (
            <Button
              data-track-owner={track("Button[Start building]")}
              intent="accent"
              size="base"
              className="w-full"
              onClick={onContinue}
            >
              Start building
            </Button>
          )}
          {cardOnFile ? null : (
            <Button
              data-track-owner={track("Button[Add a card to keep]")}
              size="base"
              className="w-full"
              render={
                <Link
                  data-track-owner={track("Link.1")}
                  to="/settings/org/billing"
                />
              }
            >
              <ButtonIcon>
                <CreditCardGlyph />
              </ButtonIcon>
              Add a card to keep {shortName}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
