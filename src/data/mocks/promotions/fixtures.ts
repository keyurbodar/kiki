import {
  DealCodePreview,
  DealRecipient,
  OfferCredits,
  OfferTrial,
  PaidIntroDealId,
  PartnerCreditOfferId,
  PartnerOfferRecipient,
  PromotionCodePreview,
  PromotionId,
  PromotionRecipient,
} from "../../api/schemas/promotion.ts";

export type SamplePromotionOutcome =
  | "delivered"
  | "already_claimed"
  | "exhausted"
  | "ineligible";

export type SamplePromotion = {
  readonly recipient: PromotionRecipient | DealRecipient;
  readonly outcome: SamplePromotionOutcome;
};

const credits = (amount: number) => new OfferCredits({ amount, expiry: null });

const promotion = (
  id: string,
  code: string,
  name: string,
  amount: number | null,
  trial: OfferTrial | null,
  outcome: SamplePromotionOutcome = "delivered",
): SamplePromotion => ({
  outcome,
  recipient: new PromotionRecipient({
    id: PromotionId.make(id),
    name,
    code,
    credits: amount === null ? null : credits(amount),
    trial,
    creditAmount: amount,
    expiry: null,
  }),
});

export const samplePromotions: ReadonlyArray<SamplePromotion> = [
  promotion("prom_welcome", "WELCOME50", "Welcome credits", 50_000, null),
  promotion(
    "prom_launch",
    "LAUNCHPRO",
    "Launch week",
    25_000,
    new OfferTrial({
      tierId: "capy_pro",
      trialDays: 14,
      introPriceCents: 0,
      requireCard: false,
    }),
  ),
  promotion(
    "prom_protrial",
    "PROTRIAL",
    "Pro trial",
    null,
    new OfferTrial({
      tierId: "capy_pro",
      trialDays: 14,
      introPriceCents: 0,
      requireCard: true,
    }),
  ),
  promotion(
    "prom_used",
    "USED",
    "Meetup credits",
    20_000,
    null,
    "already_claimed",
  ),
  promotion(
    "prom_soldout",
    "SOLDOUT",
    "Hackathon credits",
    100_000,
    null,
    "exhausted",
  ),
  promotion(
    "prom_members",
    "MEMBERS",
    "Members only",
    30_000,
    null,
    "ineligible",
  ),
  {
    outcome: "delivered",
    recipient: new DealRecipient({
      id: PaidIntroDealId.make("deal_sample_starter"),
      name: "Starter deal",
      code: "STARTER",
      tierId: "capy_lite",
      trialDays: 30,
      introPriceCents: 500,
      requireCard: true,
    }),
  },
];

export const toCodePreview = (
  recipient: PromotionRecipient | DealRecipient,
): PromotionCodePreview | DealCodePreview =>
  recipient instanceof DealRecipient
    ? new DealCodePreview({
        name: recipient.name,
        code: recipient.code,
        tierId: recipient.tierId,
        trialDays: recipient.trialDays,
        introPriceCents: recipient.introPriceCents,
        requireCard: recipient.requireCard,
      })
    : new PromotionCodePreview({
        name: recipient.name,
        code: recipient.code,
        credits: recipient.credits,
        trial: recipient.trial,
        creditAmount: recipient.creditAmount,
        expiry: recipient.expiry,
      });

const offerId = (suffix: string) =>
  PartnerCreditOfferId.make(`offer_${suffix.padEnd(26, "0")}`);

export const samplePartnerOffers: ReadonlyArray<PartnerOfferRecipient> = [
  new PartnerOfferRecipient({
    id: offerId("SAMPLEAVAILABLE"),
    partner: "yc",
    creditAmount: 500_000,
    expiry: { type: "month", length: 12 },
    availability: "available",
  }),
  new PartnerOfferRecipient({
    id: offerId("SAMPLENOEXPIRY"),
    partner: "solo",
    creditAmount: 100_000,
    expiry: null,
    availability: "available",
  }),
  new PartnerOfferRecipient({
    id: offerId("SAMPLECLAIMED"),
    partner: "yc",
    creditAmount: 500_000,
    expiry: { type: "month", length: 12 },
    availability: "claimed",
  }),
  new PartnerOfferRecipient({
    id: offerId("SAMPLEMISMATCH"),
    partner: "solo",
    creditAmount: 100_000,
    expiry: null,
    availability: "email_mismatch",
  }),
];
