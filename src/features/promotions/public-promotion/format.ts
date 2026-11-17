import type { OfferTrial, PromotionExpiry } from "@/data/api/schemas/promotion";

const creditsPerDollar = 1000;

const usdCents = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const usdWhole = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export const formatCredits = (credits: number) =>
  usdCents.format(credits / creditsPerDollar);

export const formatCreditsShort = (credits: number) => {
  const dollars = credits / creditsPerDollar;
  return (Number.isInteger(dollars) ? usdWhole : usdCents).format(dollars);
};

export const formatPriceCents = (cents: number) =>
  cents % 100 === 0
    ? `$${(cents / 100).toLocaleString("en-US")}`
    : usd.format(cents / 100);

type IntroOffer = Pick<
  OfferTrial,
  "trialDays" | "introPriceCents" | "requireCard"
>;

export const introHeading = (tierName: string, offer: IntroOffer) =>
  offer.introPriceCents === 0
    ? `${tierName} free for ${offer.trialDays} days`
    : `${tierName} for ${formatPriceCents(offer.introPriceCents)}`;

export const introDescription = (offer: IntroOffer, priceDollars: number) => {
  if (offer.introPriceCents > 0)
    return `${formatPriceCents(offer.introPriceCents)} for your first ${offer.trialDays} days, then $${priceDollars}/mo`;
  if (offer.requireCard)
    return `Free for your first ${offer.trialDays} days, then $${priceDollars}/mo`;
  return `Free for your first ${offer.trialDays} days with no card, then $${priceDollars}/mo once you add a payment method`;
};

export const creditsAndTrialHeading = (
  credits: string,
  tierName: string,
  trialDays: number,
) => `${credits} in credits + ${trialDays} days of ${tierName}`;

export const partnerOfferDescription = (
  partnerName: string,
  expiry: PromotionExpiry | null,
) =>
  expiry === null
    ? `Claim partner credits from ${partnerName} with no expiry`
    : `Credits expire ${expiry.length} ${expiry.type}${expiry.length === 1 ? "" : "s"} after claim`;
