export type PlanTier = {
  readonly id: string;
  readonly name: string;
  readonly priceDollars: number;
  readonly monthlyCredits: number;
};

const maxPrices = [200, 300, 400, 500, 600, 700, 800, 900, 1000];

export const planTiers: ReadonlyArray<PlanTier> = [
  {
    id: "capy_lite",
    name: "Capy Lite",
    priceDollars: 20,
    monthlyCredits: 20_000,
  },
  {
    id: "capy_pro",
    name: "Capy Pro",
    priceDollars: 100,
    monthlyCredits: 105_000,
  },
  ...maxPrices.map((price) => ({
    id: `capy_max_${price}`,
    name: `Capy Max $${price}`,
    priceDollars: price,
    monthlyCredits: price * 1100,
  })),
];

export const findPlanTier = (tierId: string) =>
  planTiers.find((tier) => tier.id === tierId);

export const planTierFeatures = (tier: PlanTier) => [
  `$${(tier.monthlyCredits / 1000).toLocaleString("en-US")}/mo of usage`,
  "Capy-hosted models",
  "Reviews on every PR",
  "Agent machines",
  "Buy credits anytime",
];
