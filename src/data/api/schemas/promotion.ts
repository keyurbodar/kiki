import { Schema } from "effect";
import { OrgId } from "./ids.ts";

export const PromotionId = Schema.String.check(
  Schema.isPattern(/^prom_.{1,59}$/u),
).pipe(Schema.brand("Core.PromotionId"));
export type PromotionId = typeof PromotionId.Type;

export const PartnerCreditOfferId = Schema.String.check(
  Schema.isPattern(/^offer_.{26}$/u),
).pipe(Schema.brand("Core.PartnerCreditOfferId"));
export type PartnerCreditOfferId = typeof PartnerCreditOfferId.Type;

export const PaidIntroDealId = Schema.String.pipe(
  Schema.brand("Core.PaidIntroDealId"),
);
export type PaidIntroDealId = typeof PaidIntroDealId.Type;

export const PromotionRef = Schema.String.check(
  Schema.isMinLength(1),
  Schema.isMaxLength(255),
);

export const PromotionCode = Schema.String.check(
  Schema.isMinLength(1),
  Schema.isMaxLength(255),
);

export const PlanTierId = Schema.String;

export const PromotionExpiry = Schema.Struct({
  type: Schema.Literals(["day", "week", "month", "year"]),
  length: Schema.Int,
});
export type PromotionExpiry = typeof PromotionExpiry.Type;

export const ClaimCampaign = Schema.Union([
  Schema.Struct({ kind: Schema.Literal("deal"), id: PaidIntroDealId }),
  Schema.Struct({ kind: Schema.Literal("promotion"), id: PromotionId }),
]);

export const ClaimContext = Schema.Struct({
  campaign: ClaimCampaign,
  source: Schema.Unknown,
});
export type ClaimContext = typeof ClaimContext.Type;

export class OfferCredits extends Schema.Class<OfferCredits>("OfferCredits")({
  amount: Schema.Int,
  expiry: Schema.NullOr(PromotionExpiry),
}) {}

export class OfferTrial extends Schema.Class<OfferTrial>("OfferTrial")({
  tierId: PlanTierId,
  trialDays: Schema.Int,
  introPriceCents: Schema.Int,
  requireCard: Schema.Boolean,
}) {}

export class PromotionCodePreview extends Schema.Class<PromotionCodePreview>(
  "PromotionCodePreview",
)({
  name: Schema.String,
  code: PromotionCode,
  credits: Schema.NullOr(OfferCredits),
  trial: Schema.NullOr(OfferTrial),
  creditAmount: Schema.NullOr(Schema.Int),
  expiry: Schema.NullOr(PromotionExpiry),
}) {}

export class DealCodePreview extends Schema.Class<DealCodePreview>(
  "DealCodePreview",
)({
  name: Schema.String,
  code: PromotionCode,
  tierId: PlanTierId,
  trialDays: Schema.Int,
  introPriceCents: Schema.Int,
  requireCard: Schema.Boolean,
}) {}

export class PromotionRecipient extends Schema.Class<PromotionRecipient>(
  "PromotionRecipient",
)({
  claimContext: Schema.optional(ClaimContext),
  id: PromotionId,
  name: Schema.String,
  code: PromotionCode,
  credits: Schema.NullOr(OfferCredits),
  trial: Schema.NullOr(OfferTrial),
  creditAmount: Schema.NullOr(Schema.Int),
  expiry: Schema.NullOr(PromotionExpiry),
}) {}

export class DealRecipient extends Schema.Class<DealRecipient>("DealRecipient")(
  {
    claimContext: Schema.optional(ClaimContext),
    id: PaidIntroDealId,
    name: Schema.String,
    code: PromotionCode,
    tierId: PlanTierId,
    trialDays: Schema.Int,
    introPriceCents: Schema.Int,
    requireCard: Schema.Boolean,
  },
) {}

export const PartnerOfferPartner = Schema.Literals(["yc", "solo"]);
export type PartnerOfferPartner = typeof PartnerOfferPartner.Type;

export const PartnerOfferAvailability = Schema.Literals([
  "available",
  "claimed",
  "email_mismatch",
]);
export type PartnerOfferAvailability = typeof PartnerOfferAvailability.Type;

export class PartnerOfferRecipient extends Schema.Class<PartnerOfferRecipient>(
  "PartnerOfferRecipient",
)({
  id: PartnerCreditOfferId,
  partner: PartnerOfferPartner,
  creditAmount: Schema.Int,
  expiry: Schema.NullOr(PromotionExpiry),
  availability: PartnerOfferAvailability,
}) {}

export const ClaimPromotionRequest = Schema.Struct({ orgId: OrgId });

export const ClaimPromotionCodeRequest = Schema.Struct({
  claimContext: Schema.optional(ClaimContext),
  orgId: OrgId,
  code: Schema.optional(PromotionCode),
});

export const OnboardingTrialOutcome = Schema.Literals([
  "started",
  "offered",
  "ineligible",
]);

export const ClaimOutcome = Schema.Union([
  Schema.Struct({
    kind: Schema.Literals([
      "delivered",
      "already_delivered",
      "pending",
      "already_claimed",
    ]),
    trialOutcome: Schema.optional(OnboardingTrialOutcome),
  }),
  Schema.Struct({
    kind: Schema.Literal("rejected"),
    reason: Schema.Literals(["invalid", "exhausted", "already_redeemed"]),
  }),
  Schema.Struct({
    kind: Schema.Literal("ineligible"),
    reason: Schema.Literals(["claimed", "email", "membership"]),
  }),
]);
export type ClaimOutcome = typeof ClaimOutcome.Type;

export class InvalidRequest extends Schema.TaggedError<InvalidRequest>()(
  "capy/InvalidRequest",
  { message: Schema.String },
  { httpApiStatus: 400 },
) {}

export class PromotionNotFound extends Schema.TaggedError<PromotionNotFound>()(
  "capy/PromotionNotFound",
  { promotionId: Schema.String },
  { httpApiStatus: 404 },
) {}

export class PartnerOfferNotFound extends Schema.TaggedError<PartnerOfferNotFound>()(
  "capy/PartnerOfferNotFound",
  { offerId: PartnerCreditOfferId },
  { httpApiStatus: 404 },
) {}

export class IdentityProviderUnavailable extends Schema.TaggedError<IdentityProviderUnavailable>()(
  "capy/IdentityProviderUnavailable",
  {},
  { httpApiStatus: 502 },
) {}
