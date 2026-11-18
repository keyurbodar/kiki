import { useAtomSet } from "@effect/atom-react";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { OrgId } from "@/data/api/schemas/ids";
import type {
  ClaimContext,
  ClaimOutcome,
  PromotionRecipient,
} from "@/data/api/schemas/promotion";
import { claimPromotionAtom } from "@/data/atoms/promotions";
import { toast } from "@/primitives/toaster";
import { type ClaimState, claimState } from "../public-promotion/claim-outcome";
import {
  creditsAndTrialHeading,
  formatCreditsShort,
  introDescription,
  introHeading,
} from "../public-promotion/format";
import { findPlanTier } from "../public-promotion/plan-tiers";
import {
  type ClaimedBalance,
  PublicPromotionView,
  type StartedTrial,
} from "../public-promotion/promotion-view";
import { signInHref } from "../public-promotion/require-signed-in";
import { usePromotionOrganizations } from "../public-promotion/use-promotion-organizations";

export const pendingPollLimitMs = 15_000;
export const pendingPollIntervalMs = 2_000;

export async function claimUntilSettled(
  claim: () => Promise<ClaimOutcome>,
  wait: () => Promise<void>,
  now: () => number = Date.now,
): Promise<{ outcome: ClaimOutcome; polled: boolean }> {
  const startedAt = now();
  let polled = false;
  let outcome = await claim();
  while (outcome.kind === "pending" && now() - startedAt < pendingPollLimitMs) {
    polled = true;
    await wait();
    outcome = await claim();
  }
  return { outcome, polled };
}

const waitForPoll = () =>
  new Promise<void>((resolve) => setTimeout(resolve, pendingPollIntervalMs));

export type PromotionClaimProps = {
  promotion: PromotionRecipient;
  claimContext?: ClaimContext;
  onRefreshPromotion: () => void;
  startingCredits?: number;
};

export function PromotionClaim({
  promotion,
  claimContext = promotion.claimContext,
  onRefreshPromotion,
  startingCredits = 0,
}: PromotionClaimProps) {
  const navigate = useNavigate();
  const claim = useAtomSet(claimPromotionAtom, { mode: "promise" });
  const [state, setState] = useState<ClaimState>();
  const [balance, setBalance] = useState<ClaimedBalance>();
  const [trial, setTrial] = useState<StartedTrial>();
  const [claiming, setClaiming] = useState(false);
  const {
    organizations,
    organizationsError,
    effectiveOrgId,
    setSelectedOrgId,
    refreshOrganizations,
    creating,
    create,
  } = usePromotionOrganizations("Review it before claiming");

  const creditAmount = promotion.credits?.amount ?? 0;
  const trialTier =
    promotion.trial === null ? undefined : findPlanTier(promotion.trial.tierId);

  const onClaim = () => {
    if (effectiveOrgId === undefined) return;
    const orgId = effectiveOrgId;
    const organization = organizations?.find(
      (candidate) => candidate.id === orgId,
    );
    setClaiming(true);
    claimUntilSettled(
      () =>
        claim({
          params: { promotionId: promotion.id },
          payload: {
            orgId: OrgId.make(orgId),
            code: promotion.code,
            claimContext,
          },
        }),
      waitForPoll,
    )
      .then(({ outcome, polled }) => {
        const next = claimState(outcome);
        onRefreshPromotion();
        if (next !== "granted" && next !== "pending") {
          setState(next);
          return;
        }
        const destination = organization ?? {
          id: orgId,
          name: "Your organization",
          avatarUrl: null,
        };
        const alreadyDelivered =
          outcome.kind === "already_delivered" && !polled;
        if (
          (outcome.kind === "delivered" ||
            outcome.kind === "already_delivered") &&
          outcome.trialOutcome === "started" &&
          promotion.trial !== null &&
          trialTier !== undefined
        )
          setTrial({
            organization: destination,
            tier: trialTier,
            trialDays: promotion.trial.trialDays,
          });
        setBalance({
          organization: destination,
          beforeCredits: alreadyDelivered
            ? Math.max(startingCredits - creditAmount, 0)
            : startingCredits,
          afterCredits: alreadyDelivered
            ? startingCredits
            : startingCredits + creditAmount,
          settled: next === "granted",
        });
        setState(next);
      })
      .catch(() => toast.error("Could not claim this promotion"))
      .finally(() => setClaiming(false));
  };

  const heading =
    promotion.trial === null || trialTier === undefined
      ? undefined
      : creditAmount > 0
        ? creditsAndTrialHeading(
            formatCreditsShort(creditAmount),
            trialTier.name,
            promotion.trial.trialDays,
          )
        : introHeading(trialTier.name, promotion.trial);
  const description =
    promotion.trial === null || trialTier === undefined
      ? undefined
      : introDescription(promotion.trial, trialTier.priceDollars);

  return (
    <PublicPromotionView
      creditAmount={creditAmount}
      heading={heading}
      description={description}
      state={state ?? "available"}
      balance={balance}
      trial={trial}
      organizations={organizations}
      organizationsError={organizationsError}
      selectedOrgId={effectiveOrgId}
      claiming={claiming}
      creating={creating}
      onSelectOrganization={setSelectedOrgId}
      onRetryOrganizations={refreshOrganizations}
      onClaim={onClaim}
      onCreateOrganization={create}
      onContinue={() => void navigate({ to: "/new" })}
      onSwitchAccount={() =>
        void navigate({ href: signInHref(window.location.href) })
      }
    />
  );
}
