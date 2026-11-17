import { describe, expect, it } from "vitest";
import {
  checkoutTerms,
  ctaLabel,
  defaultPlanCatalog,
  formatGb,
  formatMachine,
  leadTerms,
  tierMachineSize,
  toPlanCatalog,
} from "./plan-catalog";

const tier = (id: string) => {
  const entry = defaultPlanCatalog.tiers.find(
    (candidate) => candidate.id === id,
  );
  if (entry === undefined) throw new Error(id);
  return entry;
};

describe("toPlanCatalog", () => {
  it("falls back to the built-in catalog when tiers are missing", () => {
    expect(toPlanCatalog([{ id: "credits_starter" }])).toBe(defaultPlanCatalog);
    expect(toPlanCatalog(undefined)).toBe(defaultPlanCatalog);
  });

  it("keeps known tiers from the server", () => {
    const catalog = toPlanCatalog({
      arm: "lead",
      tiers: [
        {
          basePlanId: "capy_pro",
          tier: "pro",
          interval: "month",
          priceDollars: 100,
          priceMonthlyEquivalentDollars: 100,
          monthlyCredits: 100000,
          machineHours: 2500,
          reviewCredits: 1250,
        },
        { basePlanId: "capy_team", tier: "team", interval: "month" },
      ],
    });
    expect(catalog.tiers.map((entry) => entry.id)).toEqual(["capy_pro"]);
    expect(catalog.tiers[0]?.name).toBe("Capy Pro");
  });
});

describe("leadTerms", () => {
  it("prices Lite's intro week", () => {
    const terms = leadTerms(tier("capy_lite"), true, "large");
    expect(terms.introToday).toBe("$1");
    expect(terms.introUnit).toBe("first week");
    expect(terms.renewal).toBe("$20/mo");
    expect(ctaLabel(terms, "Get Capy Lite")).toBe("Start for $1");
  });

  it("prices annual plans per month with a billed note", () => {
    const terms = leadTerms(tier("capy_pro_annual"), false, "large");
    expect(terms.priceDollars).toBe(80);
    expect(terms.priceNote).toBe("$960 billed annually");
    expect(terms.creditDollars).toBe(100);
    expect(ctaLabel(terms, "Get Capy Pro")).toBe("Get Capy Pro");
  });

  it("caps the quoted machine at the plan's largest size", () => {
    expect(tierMachineSize("lite", "hyper")).toBe("large");
    expect(tierMachineSize("max", "medium")).toBe("medium");
  });
});

describe("formatters", () => {
  it("writes memory and machines with non-breaking spaces", () => {
    expect(formatGb(128)).toBe("128\u00a0GB");
    expect(formatGb(1024)).toBe("1\u00a0TB");
    expect(formatMachine("ultra")).toBe("8\u00a0CPU\u00a0/\u00a032\u00a0GB");
  });
});

describe("checkoutTerms", () => {
  const now = new Date(2026, 0, 31);

  it("charges $1 today for the intro and starts in a week", () => {
    const terms = checkoutTerms(tier("capy_lite"), true, undefined, false, now);
    expect(terms.today).toBe("$1");
    expect(terms.renewal).toBe("$20/mo");
    expect(terms.startsOn).toBe("Feb 7");
    expect(terms.action).toBe("Pay $1 and start Lite");
  });

  it("switches plans at the previewed price, clamping the renewal day", () => {
    const terms = checkoutTerms(tier("capy_pro"), false, 8000, true, now);
    expect(terms.today).toBe("$80");
    expect(terms.startsOn).toBeUndefined();
    expect(terms.action).toBe("Pay $80 and switch to Pro");
    const fresh = checkoutTerms(tier("capy_pro"), false, undefined, false, now);
    expect(fresh.startsOn).toBe("Feb 28");
  });

  it("offers a free switch when nothing is due", () => {
    expect(
      checkoutTerms(tier("capy_max_200"), false, 0, true, now).action,
    ).toBe("Switch to Max");
  });
});
