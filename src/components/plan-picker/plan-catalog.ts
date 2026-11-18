export type PlanTier = "lite" | "pro" | "max";
export type PlanInterval = "month" | "year";
export type MachineSize =
  | "small"
  | "medium"
  | "large"
  | "ultra"
  | "hyper"
  | "bigguy";

export type CatalogTier = {
  id: string;
  tier: PlanTier;
  name: string;
  interval: PlanInterval;
  priceDollars: number;
  priceMonthlyEquivalentDollars: number;
  monthlyCredits: number;
  machineHours: number;
  reviewCredits: number;
};

export type PlanCatalog = {
  arm: string;
  tiers: CatalogTier[];
};

export const tierLabels: Record<PlanTier, string> = {
  lite: "Lite",
  pro: "Pro",
  max: "Max",
};

export const tierSurfaces: Record<PlanTier, string> = {
  lite: "var(--gradient-plan-lite)",
  pro: "var(--gradient-plan-pro)",
  max: "var(--gradient-plan-max)",
};

export const machineSizes: readonly MachineSize[] = [
  "small",
  "medium",
  "large",
  "ultra",
  "hyper",
  "bigguy",
];

const machineSpecs: Record<MachineSize, { cpu: number; memoryGb: number }> = {
  small: { cpu: 1, memoryGb: 4 },
  medium: { cpu: 2, memoryGb: 8 },
  large: { cpu: 4, memoryGb: 16 },
  ultra: { cpu: 8, memoryGb: 32 },
  hyper: { cpu: 16, memoryGb: 64 },
  bigguy: { cpu: 32, memoryGb: 128 },
};

/** Machine hours one hour on each size counts for. */
export const machineHourRates: Record<MachineSize, number> = {
  small: 1,
  medium: 2,
  large: 4,
  ultra: 8,
  hyper: 16,
  bigguy: 32,
};

export const reviewEfforts = [
  { key: "low", label: "Low", credits: 1 },
  { key: "medium", label: "Medium", credits: 5 },
  { key: "high", label: "High", credits: 10 },
] as const;

/** Capy's per-plan limits (feature flag plan values for Lite, Pro, Max). */
export const tierLimits: Record<
  PlanTier,
  {
    memoryGb: number;
    maxMachineSize: MachineSize;
    driveGb: number;
    mobile: boolean;
  }
> = {
  lite: { memoryGb: 128, maxMachineSize: "large", driveGb: 10, mobile: false },
  pro: { memoryGb: 512, maxMachineSize: "ultra", driveGb: 25, mobile: true },
  max: { memoryGb: 1024, maxMachineSize: "hyper", driveGb: 50, mobile: true },
};

const nbsp = "\u00a0";

/**
 * The plan a billing plan id belongs to. Ids are the catalog's own
 * (`capy_lite`, `capy_pro`, `capy_max_200`, and their annual or versioned
 * forms), so one billing read carries the whole answer.
 */
export const planTierOf = (planId: string): PlanTier | undefined => {
  const base = planId.split("__")[0] ?? planId;
  if (base.startsWith("capy_lite")) return "lite";
  if (base.startsWith("capy_pro")) return "pro";
  if (base.startsWith("capy_max")) return "max";
  return undefined;
};

export const formatGb = (gb: number) =>
  gb >= 1024 && gb % 1024 === 0 ? `${gb / 1024}${nbsp}TB` : `${gb}${nbsp}GB`;

export const formatMachine = (size: MachineSize) => {
  const spec = machineSpecs[size];
  return `${spec.cpu}${nbsp}CPU${nbsp}/${nbsp}${spec.memoryGb}${nbsp}GB`;
};

export const formatWhole = (value: number) =>
  Math.floor(Math.max(0, value)).toLocaleString("en-US");

/** The machine size a tier's hours are quoted on: the default, capped by the plan. */
export const tierMachineSize = (tier: PlanTier, defaultSize: MachineSize) =>
  machineSizes[
    Math.min(
      machineSizes.indexOf(defaultSize),
      machineSizes.indexOf(tierLimits[tier].maxMachineSize),
    )
  ] ?? defaultSize;

const tier = (
  id: string,
  planTier: PlanTier,
  interval: PlanInterval,
  priceDollars: number,
  monthly: number,
  machineHours: number,
  reviewCredits: number,
): CatalogTier => ({
  id,
  tier: planTier,
  name: `Capy ${tierLabels[planTier]}`,
  interval,
  priceDollars,
  priceMonthlyEquivalentDollars: monthly,
  monthlyCredits: (interval === "month" ? priceDollars : monthly / 0.8) * 1000,
  machineHours,
  reviewCredits,
});

/** The catalog the picker shows when the server's catalog has no tiers. */
export const defaultPlanCatalog: PlanCatalog = {
  arm: "lead",
  tiers: [
    tier("capy_lite", "lite", "month", 20, 20, 500, 250),
    tier("capy_pro", "pro", "month", 100, 100, 2500, 1250),
    tier("capy_max_200", "max", "month", 200, 200, 5000, 2500),
    tier("capy_lite_annual", "lite", "year", 192, 16, 500, 250),
    tier("capy_pro_annual", "pro", "year", 960, 80, 2500, 1250),
    tier("capy_max_200_annual", "max", "year", 1920, 160, 5000, 2500),
  ],
};

const tiers: readonly PlanTier[] = ["lite", "pro", "max"];

/** Reads the catalog response, keeping only tiers the picker can show. */
export function toPlanCatalog(value: unknown): PlanCatalog {
  const raw =
    typeof value === "object" && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const parsed = (Array.isArray(raw.tiers) ? raw.tiers : []).flatMap(
    (entry): CatalogTier[] => {
      const t = entry as Record<string, unknown>;
      const planTier = tiers.find((candidate) => candidate === t.tier);
      const interval =
        t.interval === "month" || t.interval === "year"
          ? t.interval
          : undefined;
      const id = typeof t.basePlanId === "string" ? t.basePlanId : t.id;
      if (planTier === undefined || interval === undefined) return [];
      if (typeof id !== "string") return [];
      const numberOf = (key: string) =>
        typeof t[key] === "number" ? (t[key] as number) : 0;
      return [
        {
          id,
          tier: planTier,
          name:
            typeof t.name === "string"
              ? t.name
              : `Capy ${tierLabels[planTier]}`,
          interval,
          priceDollars: numberOf("priceDollars"),
          priceMonthlyEquivalentDollars: numberOf(
            "priceMonthlyEquivalentDollars",
          ),
          monthlyCredits: numberOf("monthlyCredits"),
          machineHours: numberOf("machineHours"),
          reviewCredits: numberOf("reviewCredits"),
        },
      ];
    },
  );
  return parsed.length === 0
    ? defaultPlanCatalog
    : { arm: typeof raw.arm === "string" ? raw.arm : "lead", tiers: parsed };
}

export type LeadTerms = {
  priceDollars: number;
  introToday?: string;
  introUnit?: string;
  priceNote?: string;
  renewal?: string;
  machineHours: number;
  machineSize: MachineSize;
  reviewCredits: number;
  creditDollars: number;
};

export const billedLine = (entry: CatalogTier) =>
  entry.interval === "month"
    ? "billed monthly"
    : `$${entry.priceDollars.toLocaleString("en-US")} billed annually`;

/** The lead card's price block for a tier; intro adds the $1 first week. */
export function leadTerms(
  entry: CatalogTier,
  intro: boolean,
  defaultSize: MachineSize,
): LeadTerms {
  return {
    priceDollars: entry.priceMonthlyEquivalentDollars,
    introToday: intro ? "$1" : undefined,
    introUnit: intro ? "first week" : undefined,
    priceNote:
      !intro && entry.interval === "year" ? billedLine(entry) : undefined,
    renewal: intro
      ? `$${entry.priceMonthlyEquivalentDollars.toLocaleString("en-US")}/mo`
      : undefined,
    machineHours: entry.machineHours,
    machineSize: tierMachineSize(entry.tier, defaultSize),
    reviewCredits: entry.reviewCredits,
    creditDollars: entry.monthlyCredits / 1000,
  };
}

export const ctaLabel = (terms: LeadTerms, fallback: string) =>
  terms.introToday === undefined ? fallback : `Start for ${terms.introToday}`;

export type CheckoutTerms = {
  tier: PlanTier;
  today: string;
  renewal: string;
  startsOn?: string;
  action: string;
};

const formatDueCents = (cents: number) =>
  (cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });

/** What the checkout step shows: today's charge, renewal and the pay button. */
export function checkoutTerms(
  entry: CatalogTier,
  intro: boolean,
  dueTodayCents: number | undefined,
  hasPlan: boolean,
  now: Date,
): CheckoutTerms {
  const month = now.getMonth() + (entry.interval === "year" ? 12 : 1);
  const starts = intro
    ? new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7)
    : new Date(
        now.getFullYear(),
        month,
        Math.min(
          now.getDate(),
          new Date(now.getFullYear(), month + 1, 0).getDate(),
        ),
      );
  const cents = intro ? 100 : (dueTodayCents ?? entry.priceDollars * 100);
  const today = `$${formatDueCents(cents)}`;
  const label = tierLabels[entry.tier];
  return {
    tier: entry.tier,
    today,
    renewal: `$${entry.priceDollars.toLocaleString("en-US")}${entry.interval === "year" ? "/yr" : "/mo"}`,
    startsOn:
      intro || !hasPlan
        ? starts.toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : undefined,
    action:
      cents === 0
        ? `${hasPlan ? "Switch to" : "Start"} ${label}`
        : `Pay ${today} and ${hasPlan ? "switch to" : "start"} ${label}`,
  };
}
