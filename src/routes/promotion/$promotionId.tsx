import { createFileRoute } from "@tanstack/react-router";
import { Schema } from "effect";
import { PromotionId } from "@/data/api/schemas/promotion";
import { LegacyPromotionRedirect } from "@/features/promotions/promotion-code-page";
import {
  PromotionUnavailable,
  RequireSignedIn,
} from "@/features/promotions/public-promotion";

export const Route = createFileRoute("/promotion/$promotionId")({
  head: () => ({ meta: [{ title: "Promotion" }] }),
  component: RouteComponent,
});

const isPromotionId = Schema.is(PromotionId);

function RouteComponent() {
  const { promotionId } = Route.useParams();
  return (
    <RequireSignedIn>
      {isPromotionId(promotionId) ? (
        <LegacyPromotionRedirect key={promotionId} promotionId={promotionId} />
      ) : (
        <PromotionUnavailable />
      )}
    </RequireSignedIn>
  );
}
