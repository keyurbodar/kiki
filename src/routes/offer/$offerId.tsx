import { createFileRoute } from "@tanstack/react-router";
import { Schema } from "effect";
import { PartnerCreditOfferId } from "@/data/api/schemas/promotion";
import { PublicPartnerOfferPage } from "@/features/promotions/partner-offer";
import {
  PromotionUnavailable,
  RequireSignedIn,
} from "@/features/promotions/public-promotion";

export const Route = createFileRoute("/offer/$offerId")({
  head: () => ({ meta: [{ title: "Partner credits" }] }),
  component: RouteComponent,
});

const isOfferId = Schema.is(PartnerCreditOfferId);

function RouteComponent() {
  const { offerId } = Route.useParams();
  return (
    <RequireSignedIn>
      {isOfferId(offerId) ? (
        <PublicPartnerOfferPage key={offerId} offerId={offerId} />
      ) : (
        <PromotionUnavailable title="Offer unavailable" />
      )}
    </RequireSignedIn>
  );
}
