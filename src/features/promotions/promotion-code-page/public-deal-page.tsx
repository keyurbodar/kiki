import { useAtomSet } from "@effect/atom-react";
import { useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { OrgId } from "@/data/api/schemas/ids";
import type {
  ClaimContext,
  PromotionRecipient,
} from "@/data/api/schemas/promotion";
import { claimPromotionAtom } from "@/data/atoms/promotions";
import { Button } from "@/primitives/button";
import { Card } from "@/primitives/card";
import { Input } from "@/primitives/input";
import { SkeletonPanel } from "@/primitives/skeleton-panel";
import {
  formatCredits,
  formatPriceCents,
  introDescription,
  introHeading,
} from "../public-promotion/format";
import { CheckGlyph } from "../public-promotion/glyphs";
import { LoadingButton } from "../public-promotion/loading-button";
import { findPlanTier } from "../public-promotion/plan-tiers";
import { PromotionPage } from "../public-promotion/promotion-page";
import {
  CreateOrganization,
  OrganizationSelect,
  OrganizationsError,
} from "../public-promotion/promotion-view";
import { TrialStartedCard } from "../public-promotion/trial-started-card";
import { usePromotionOrganizations } from "../public-promotion/use-promotion-organizations";

export type DealOffer = {
  name: string;
  code: string;
  tierId: string;
  trialDays: number;
  introPriceCents: number;
  requireCard: boolean;
  claimContext?: ClaimContext;
};

type Submission = { orgId: string; setupIntentId: string | null };

type CheckoutState =
  | { kind: "pick" }
  | { kind: "card"; submission: Submission }
  | { kind: "confirmed"; submission: Submission }
  | { kind: "granted"; orgId: string; intro: boolean; scheduled: boolean };

type PlanConfirmation = {
  introApplied: boolean;
  schedule: "immediate" | "end_of_cycle";
};

export const confirmPlanStub = (offer: DealOffer): Promise<PlanConfirmation> =>
  Promise.resolve({
    introApplied: offer.introPriceCents === 0 || offer.requireCard,
    schedule: "immediate",
  });

const track = (owner: string) =>
  `features/promotions/public-deal-page.tsx#${owner}`;

export function PublicDealPage({
  deal,
  promotion,
}: {
  deal: DealOffer;
  promotion?: PromotionRecipient;
}) {
  const navigate = useNavigate();
  const claimPromotion = useAtomSet(claimPromotionAtom, { mode: "promise" });
  const [creatingOpen, setCreatingOpen] = useState(false);
  const [checkout, setCheckout] = useState<CheckoutState>({ kind: "pick" });
  const [submitting, setSubmitting] = useState(false);
  const tier = findPlanTier(deal.tierId);
  const {
    organizations,
    organizationsError,
    effectiveOrgId,
    setSelectedOrgId,
    refreshOrganizations,
    creating,
    create,
  } = usePromotionOrganizations("Review it before subscribing");
  const selected = organizations?.find(
    (organization) => organization.id === effectiveOrgId,
  );
  if (tier === undefined) return null;

  const heading = introHeading(tier.name, deal);
  const cardFree = deal.introPriceCents === 0 && !deal.requireCard;
  const goToNew = () => void navigate({ to: "/new" });

  const confirm = (submission: Submission) => {
    setSubmitting(true);
    return confirmPlanStub(deal)
      .then((result) => {
        const scheduled = result.schedule === "end_of_cycle";
        toast.success(
          scheduled
            ? `Your plan switches to ${tier.name} at the end of the cycle`
            : result.introApplied
              ? `${heading} has started`
              : `You're on ${tier.name}`,
        );
        setCheckout({
          kind: "granted",
          orgId: submission.orgId,
          intro: result.introApplied,
          scheduled,
        });
        if (promotion !== undefined && promotion.credits !== null)
          claimPromotion({
            params: { promotionId: promotion.id },
            payload: {
              orgId: OrgId.make(submission.orgId),
              code: promotion.code,
              claimContext: deal.claimContext,
            },
          })
            .then((outcome) => {
              if (
                outcome.kind === "delivered" ||
                outcome.kind === "already_delivered"
              )
                toast.success(
                  `${formatCredits(promotion.credits?.amount ?? 0)} in credits added`,
                );
            })
            .catch(() => toast.error("Could not add the promotion's credits"));
      })
      .catch(() => toast.error("Could not complete checkout"))
      .finally(() => setSubmitting(false));
  };

  const startCheckout = () => {
    if (effectiveOrgId === undefined || submitting) return;
    const submission = { orgId: effectiveOrgId, setupIntentId: null };
    if (cardFree) return void confirm(submission);
    setCheckout({ kind: "card", submission });
  };

  const body = () => {
    switch (checkout.kind) {
      case "card":
        return (
          <div className="flex flex-col gap-4 p-4">
            <div className="flex flex-col gap-0.5 text-center">
              <h2 className="text-sm font-medium text-foreground">
                Complete your subscription
              </h2>
              <p className="text-xs font-normal text-muted-foreground-2 tabular-nums">
                Today: {formatPriceCents(deal.introPriceCents)}, then $
                {tier.priceDollars}/mo from day {deal.trialDays + 1}
              </p>
            </div>
            <StubCardForm
              submitLabel="Subscribe"
              onComplete={(setupIntentId) => {
                const submission = { ...checkout.submission, setupIntentId };
                setCheckout({ kind: "confirmed", submission });
                void confirm(submission);
              }}
            />
          </div>
        );
      case "confirmed":
        return (
          <div className="flex flex-col gap-3 p-4">
            <p className="text-center text-sm font-normal text-muted-foreground-1">
              Completing your subscription
            </p>
            <LoadingButton
              data-track-owner={track("PublicDealPage:Button.1")}
              intent="accent"
              size="base"
              className="w-full"
              loading={submitting}
              loadingLabel="Subscribing"
              onClick={() => void confirm(checkout.submission)}
            >
              Complete purchase
            </LoadingButton>
          </div>
        );
      case "granted": {
        const organization = organizations?.find(
          (candidate) => candidate.id === checkout.orgId,
        ) ?? { id: checkout.orgId, name: "Your organization", avatarUrl: null };
        if (checkout.intro && !checkout.scheduled)
          return (
            <TrialStartedCard
              organization={organization}
              tier={tier}
              trialDays={deal.trialDays}
              creditAmount={promotion?.credits?.amount}
              cardOnFile={!cardFree}
              onContinue={goToNew}
            />
          );
        return (
          <DealTerminal
            tierName={tier.name}
            scheduled={checkout.scheduled}
            onContinue={goToNew}
          />
        );
      }
      case "pick":
        return (
          <div className="flex flex-col gap-5 p-4">
            {creatingOpen ||
            (organizations !== undefined && organizations.length === 0) ? (
              <CreateOrganization
                busy={creating}
                onCancel={
                  organizations !== undefined && organizations.length === 0
                    ? undefined
                    : () => setCreatingOpen(false)
                }
                onCreate={(name) =>
                  create(name).then(() => setCreatingOpen(false))
                }
              />
            ) : (
              <>
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col gap-0.5">
                    <h2 className="text-sm font-medium text-foreground">
                      Choose an organization
                    </h2>
                    <p className="text-xs font-normal text-muted-foreground-2">
                      The subscription belongs to one organization
                    </p>
                  </div>
                  {organizations === undefined ? (
                    organizationsError ? (
                      <OrganizationsError
                        onRetry={refreshOrganizations}
                        trackOwner={track("PublicDealPage:Button[Retry]")}
                      />
                    ) : (
                      <div
                        role="status"
                        aria-label="Loading organizations"
                        className="flex flex-col gap-2"
                      >
                        <SkeletonPanel className="w-full py-4" />
                      </div>
                    )
                  ) : (
                    <OrganizationSelect
                      data-track-owner={track(
                        "PublicDealPage:OrganizationSelect[onSelect=setSelectedOrgId]",
                      )}
                      organizations={organizations}
                      selected={selected}
                      onSelect={setSelectedOrgId}
                      onCreate={() => setCreatingOpen(true)}
                    />
                  )}
                </div>
                {organizations === undefined ? null : selected === undefined ? (
                  <Button
                    data-track-owner={track(
                      "PublicDealPage:Button[Continue to checkout]",
                    )}
                    intent="accent"
                    size="base"
                    className="w-full"
                    disabled
                  >
                    Continue to checkout
                  </Button>
                ) : (
                  <LoadingButton
                    data-track-owner={track(
                      "DealClaimAction:Button[onClick=onSubmit]",
                    )}
                    intent="accent"
                    size="base"
                    className="w-full"
                    loading={submitting}
                    loadingLabel={
                      cardFree ? "Starting trial" : "Starting checkout"
                    }
                    onClick={startCheckout}
                  >
                    {cardFree
                      ? `Start ${tier.name} for ${selected.name}`
                      : `Get ${tier.name} for ${selected.name}`}
                  </LoadingButton>
                )}
              </>
            )}
          </div>
        );
    }
  };

  return (
    <PromotionPage
      heading={heading}
      description={
        <span className="block">
          {introDescription(deal, tier.priceDollars)}, with $
          {(tier.monthlyCredits / 1000).toLocaleString("en-US")}/mo of usage
        </span>
      }
    >
      <Card>{body()}</Card>
    </PromotionPage>
  );
}

export function DealTerminal({
  tierName,
  scheduled,
  onContinue,
}: {
  tierName: string;
  scheduled: boolean;
  onContinue: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 px-4 py-8 text-center">
      <span className="grid size-10 place-items-center rounded-md bg-secondary text-success [&_svg]:size-(--icon-base)">
        <CheckGlyph />
      </span>
      <div className="flex max-w-80 flex-col gap-1">
        <h2 className="text-base font-medium text-foreground">
          {scheduled ? `Switching to ${tierName}` : `You're on ${tierName}`}
        </h2>
        <p className="text-sm font-normal text-muted-foreground-1">
          {scheduled
            ? "Your current plan stays until the end of the cycle"
            : "Subscribed at the regular price"}
        </p>
      </div>
      <Button
        data-track-owner={track("DealTerminal:Button[Start building]")}
        intent="accent"
        size="base"
        onClick={onContinue}
      >
        Start building
      </Button>
    </div>
  );
}

function StubCardForm({
  submitLabel,
  onComplete,
}: {
  submitLabel: string;
  onComplete: (setupIntentId: string) => void;
}) {
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onComplete("seti_stub");
  };
  return (
    <form
      data-slot="stripe-card-form"
      data-stub="billing-deferred"
      className="flex flex-col gap-3"
      onSubmit={submit}
    >
      <Input aria-label="Card number" placeholder="1234 1234 1234 1234" />
      <div className="grid grid-cols-2 gap-3">
        <Input aria-label="Expiration" placeholder="MM / YY" />
        <Input aria-label="CVC" placeholder="CVC" />
      </div>
      <Button type="submit" intent="accent" size="base" className="w-full">
        {submitLabel}
      </Button>
    </form>
  );
}
