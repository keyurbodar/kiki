import { Atom } from "effect/reactivity";
import type { PartnerCreditOfferId } from "../api/schemas/promotion.ts";
import { ApiClient } from "../client/ApiClient.ts";

const promotionTimeToLive = "1 minute";

export const promotionPreviewByCodeAtom = Atom.family((code: string) =>
  ApiClient.query("promotions", "getByCode", {
    params: { code },
    timeToLive: promotionTimeToLive,
  }),
);

export const promotionRecipientByCodeAtom = Atom.family((code: string) =>
  ApiClient.query("promotions", "getRecipientByCode", {
    params: { code },
    timeToLive: promotionTimeToLive,
  }),
);

export const promotionRecipientAtom = Atom.family((promotionId: string) =>
  ApiClient.query("promotions", "getRecipient", {
    params: { promotionId },
    timeToLive: promotionTimeToLive,
  }),
);

export const partnerOfferAtom = Atom.family((offerId: PartnerCreditOfferId) =>
  ApiClient.query("promotions", "getPartnerOffer", {
    params: { offerId },
    timeToLive: promotionTimeToLive,
  }),
);

export const claimPromotionAtom = ApiClient.mutation("promotions", "claim");

export const claimPartnerOfferAtom = ApiClient.mutation(
  "promotions",
  "claimPartnerOffer",
);

export const createOrganizationAtom = ApiClient.mutation(
  "organizations",
  "create",
);
