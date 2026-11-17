import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import {
  ClaimOutcome,
  ClaimPromotionCodeRequest,
  ClaimPromotionRequest,
  DealCodePreview,
  DealRecipient,
  IdentityProviderUnavailable,
  InvalidRequest,
  PartnerCreditOfferId,
  PartnerOfferNotFound,
  PartnerOfferRecipient,
  PromotionCode,
  PromotionCodePreview,
  PromotionNotFound,
  PromotionRecipient,
  PromotionRef,
} from "../schemas/promotion.ts";

export class PromotionsGroup extends HttpApiGroup.make("promotions").add(
  HttpApiEndpoint.get("getRecipient", "/promotions/:promotionId", {
    params: { promotionId: PromotionRef },
    success: PromotionRecipient,
    error: PromotionNotFound,
  }),
  HttpApiEndpoint.post("claim", "/promotions/:promotionId/claim", {
    params: { promotionId: PromotionRef },
    payload: ClaimPromotionCodeRequest,
    success: ClaimOutcome,
    error: [InvalidRequest, PromotionNotFound],
  }),
  HttpApiEndpoint.get("getPartnerOffer", "/partner-offers/:offerId", {
    params: { offerId: PartnerCreditOfferId },
    success: PartnerOfferRecipient,
    error: [IdentityProviderUnavailable, PartnerOfferNotFound],
  }),
  HttpApiEndpoint.post("claimPartnerOffer", "/partner-offers/:offerId/claim", {
    params: { offerId: PartnerCreditOfferId },
    payload: ClaimPromotionRequest,
    success: ClaimOutcome,
    error: [IdentityProviderUnavailable, PartnerOfferNotFound],
  }),
  HttpApiEndpoint.get(
    "getRecipientByCode",
    "/promotions/code/:code/recipient",
    {
      params: { code: PromotionCode },
      success: Schema.Union([PromotionRecipient, DealRecipient]),
      error: PromotionNotFound,
    },
  ),
  HttpApiEndpoint.get("getByCode", "/promotions/code/:code", {
    params: { code: PromotionCode },
    success: Schema.Union([PromotionCodePreview, DealCodePreview]),
    error: PromotionNotFound,
  }),
) {}
