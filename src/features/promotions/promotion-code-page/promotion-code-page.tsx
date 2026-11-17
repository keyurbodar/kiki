import { useAtomRefresh, useAtomValue } from "@effect/atom-react";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  DealCodePreview,
  DealRecipient,
  type PromotionCodePreview,
} from "@/data/api/schemas/promotion";
import {
  promotionPreviewByCodeAtom,
  promotionRecipientAtom,
  promotionRecipientByCodeAtom,
} from "@/data/atoms/promotions";
import { organizationsAtom } from "@/data/atoms/session";
import { Button } from "@/primitives/button";
import {
  creditsAndTrialHeading,
  formatCreditsShort,
  introDescription,
  introHeading,
} from "../public-promotion/format";
import { findPlanTier } from "../public-promotion/plan-tiers";
import {
  PromotionLoading,
  PromotionUnavailable,
} from "../public-promotion/promotion-page";
import {
  PublicPromotionSignUpView,
  type PublicPromotionSignUpViewProps,
} from "../public-promotion/promotion-view";
import { failedWithoutValue, resultValue } from "../public-promotion/results";
import { useAuthState } from "../public-promotion/use-auth-state";
import { PromotionClaim } from "./promotion-claim";
import { PublicDealPage } from "./public-deal-page";

const track = (owner: string) =>
  `features/promotions/promotion-code-page.tsx#${owner}`;

function RetryUnavailable({
  onRetry,
  trackOwner,
}: {
  onRetry: () => void;
  trackOwner: string;
}) {
  return (
    <PromotionUnavailable
      action={
        <Button
          data-track-owner={track(trackOwner)}
          className="mx-auto"
          onClick={onRetry}
        >
          Retry
        </Button>
      }
    />
  );
}

export function PromotionCodePage({ code }: { code: string }) {
  const { isLoaded, isSignedIn } = useAuthState();
  if (!isLoaded) return <PromotionLoading />;
  return isSignedIn ? (
    <ClaimByCode code={code} />
  ) : (
    <SignUpPreview code={code} />
  );
}

export function signUpPreviewProps(
  preview: PromotionCodePreview | DealCodePreview,
): Omit<PublicPromotionSignUpViewProps, "onSignUp"> | undefined {
  if (preview instanceof DealCodePreview) {
    const tier = findPlanTier(preview.tierId);
    if (tier === undefined) return undefined;
    return {
      heading: introHeading(tier.name, preview),
      description: introDescription(preview, tier.priceDollars),
      receives: "the plan",
    };
  }
  const tier =
    preview.trial === null ? undefined : findPlanTier(preview.trial.tierId);
  if (preview.credits === null) {
    if (preview.trial === null || tier === undefined) return undefined;
    return {
      heading: introHeading(tier.name, preview.trial),
      description: introDescription(preview.trial, tier.priceDollars),
      receives: "the plan",
    };
  }
  if (preview.trial === null || tier === undefined)
    return { creditAmount: preview.credits.amount };
  return {
    heading: creditsAndTrialHeading(
      formatCreditsShort(preview.credits.amount),
      tier.name,
      preview.trial.trialDays,
    ),
    description: introDescription(preview.trial, tier.priceDollars),
    receives: "the offer",
  };
}

function SignUpPreview({ code }: { code: string }) {
  const navigate = useNavigate();
  const atom = promotionPreviewByCodeAtom(code);
  const result = useAtomValue(atom);
  const refresh = useAtomRefresh(atom);
  if (failedWithoutValue(result))
    return (
      <RetryUnavailable
        onRetry={refresh}
        trackOwner="SignUpPreview:Button[Retry]"
      />
    );
  const preview = resultValue(result);
  if (preview === undefined) return <PromotionLoading />;
  const props = signUpPreviewProps(preview);
  if (props === undefined) return <PromotionUnavailable />;
  return (
    <PublicPromotionSignUpView
      {...props}
      onSignUp={() =>
        void navigate({
          to: "/sign-up",
          search: { redirect_url: window.location.href },
        })
      }
    />
  );
}

function ClaimByCode({ code }: { code: string }) {
  const navigate = useNavigate();
  const organizations = resultValue(useAtomValue(organizationsAtom));
  const needsOnboarding =
    organizations !== undefined && organizations.length === 0;
  useEffect(() => {
    if (needsOnboarding) void navigate({ to: "/onboarding", replace: true });
  }, [needsOnboarding, navigate]);

  const atom = promotionRecipientByCodeAtom(code);
  const result = useAtomValue(atom);
  const refresh = useAtomRefresh(atom);
  if (needsOnboarding) return <PromotionLoading />;
  if (failedWithoutValue(result))
    return (
      <RetryUnavailable
        onRetry={refresh}
        trackOwner="ClaimByCode:Button[Retry]"
      />
    );
  const recipient = resultValue(result);
  if (recipient === undefined) return <PromotionLoading />;
  if (recipient instanceof DealRecipient)
    return <PublicDealPage deal={recipient} />;
  const trial = recipient.trial;
  if (
    recipient.credits === null ||
    (trial !== null && (trial.introPriceCents > 0 || trial.requireCard))
  ) {
    if (trial === null) return <PromotionUnavailable />;
    return (
      <PublicDealPage
        deal={{
          name: recipient.name,
          code: recipient.code,
          tierId: trial.tierId,
          trialDays: trial.trialDays,
          introPriceCents: trial.introPriceCents,
          requireCard: trial.requireCard,
          claimContext: recipient.claimContext,
        }}
        promotion={recipient.credits === null ? undefined : recipient}
      />
    );
  }
  return <PromotionClaim promotion={recipient} onRefreshPromotion={refresh} />;
}

export function LegacyPromotionRedirect({
  promotionId,
}: {
  promotionId: string;
}) {
  const navigate = useNavigate();
  const atom = promotionRecipientAtom(promotionId);
  const result = useAtomValue(atom);
  const refresh = useAtomRefresh(atom);
  const code = resultValue(result)?.code;
  useEffect(() => {
    if (code !== undefined)
      void navigate({ to: "/p/$code", params: { code }, replace: true });
  }, [code, navigate]);
  if (failedWithoutValue(result))
    return (
      <RetryUnavailable
        onRetry={refresh}
        trackOwner="LegacyPromotionRedirect:Button[Retry]"
      />
    );
  return <PromotionLoading />;
}
