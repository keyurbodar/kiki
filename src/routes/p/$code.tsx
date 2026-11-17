import { createFileRoute } from "@tanstack/react-router";
import { Schema } from "effect";
import { PromotionCode } from "@/data/api/schemas/promotion";
import { PromotionCodePage } from "@/features/promotions/promotion-code-page";
import { PromotionUnavailable } from "@/features/promotions/public-promotion";

export const Route = createFileRoute("/p/$code")({
  head: () => ({ meta: [{ title: "Promotion" }] }),
  component: RouteComponent,
});

const isPromotionCode = Schema.is(PromotionCode);

function RouteComponent() {
  const { code } = Route.useParams();
  return isPromotionCode(code) ? (
    <PromotionCodePage key={code} code={code} />
  ) : (
    <PromotionUnavailable />
  );
}
