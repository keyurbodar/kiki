import { useAtomRefresh, useAtomSet, useAtomValue } from "@effect/atom-react";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { OrgId } from "@/data/api/schemas/ids";
import type {
  PartnerCreditOfferId,
  PartnerOfferPartner,
} from "@/data/api/schemas/promotion";
import {
  claimPartnerOfferAtom,
  partnerOfferAtom,
} from "@/data/atoms/promotions";
import { Button } from "@/primitives/button";
import { type ClaimState, claimState } from "../public-promotion/claim-outcome";
import { partnerOfferDescription } from "../public-promotion/format";
import {
  PromotionLoading,
  PromotionUnavailable,
} from "../public-promotion/promotion-page";
import { PublicPromotionView } from "../public-promotion/promotion-view";
import { signInHref } from "../public-promotion/require-signed-in";
import { failedWithoutValue, resultValue } from "../public-promotion/results";
import { usePromotionOrganizations } from "../public-promotion/use-promotion-organizations";

export const partnerNames: Record<PartnerOfferPartner, string> = {
  yc: "YC Bookface",
  solo: "SoloFounders",
};

export const partnerOfferNoticesKey = "capy-web:partner-offer-notices";

export function rememberPartnerOfferNotice(offerId: string) {
  try {
    const stored: unknown = JSON.parse(
      localStorage.getItem(partnerOfferNoticesKey) ?? "[]",
    );
    const notices = Array.isArray(stored)
      ? stored.filter((value): value is string => typeof value === "string")
      : [];
    if (!notices.includes(offerId))
      localStorage.setItem(
        partnerOfferNoticesKey,
        JSON.stringify([...notices, offerId]),
      );
  } catch {}
}

export function PublicPartnerOfferPage({
  offerId,
}: {
  offerId: PartnerCreditOfferId;
}) {
  const navigate = useNavigate();
  const atom = partnerOfferAtom(offerId);
  const result = useAtomValue(atom);
  const refresh = useAtomRefresh(atom);
  const claim = useAtomSet(claimPartnerOfferAtom, { mode: "promise" });
  const [outcome, setOutcome] = useState<ClaimState>();
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

  if (failedWithoutValue(result))
    return (
      <PromotionUnavailable
        title="Offer unavailable"
        action={
          <Button
            data-track-owner="features/promotions/public-partner-offer-page.tsx#PublicPartnerOfferPage:Button[Retry]"
            className="mx-auto"
            onClick={refresh}
          >
            Retry
          </Button>
        }
      />
    );
  const offer = resultValue(result);
  if (offer === undefined) return <PromotionLoading label="Loading offer" />;

  const onClaim = () => {
    if (effectiveOrgId === undefined) return;
    setClaiming(true);
    claim({
      params: { offerId },
      payload: { orgId: OrgId.make(effectiveOrgId) },
    })
      .then((claimed) => {
        const next = claimState(claimed);
        setOutcome(next);
        refresh();
        if (next === "granted" || next === "pending")
          rememberPartnerOfferNotice(offerId);
      })
      .catch(() => toast.error("Could not claim this offer"))
      .finally(() => setClaiming(false));
  };

  const partner = partnerNames[offer.partner];
  return (
    <PublicPromotionView
      name={`${partner} credits`}
      description={partnerOfferDescription(partner, offer.expiry)}
      creditAmount={offer.creditAmount}
      state={outcome ?? offer.availability}
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
