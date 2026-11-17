import { describe, expect, it } from "vitest";
import {
  autoReloadError,
  autoReloadLine,
  creditSourceLine,
  currentPlan,
  errorMessage,
  formatCents,
  formatCredits,
  invoiceTitle,
  planDescription,
  planDisplayName,
  receiptsLine,
  scheduledPlan,
  toBillingInvoices,
  toBillingView,
} from "./billing";

const capyShape = {
  customer: true,
  paymentMethod: true,
  plans: [
    {
      planId: "capy_lite",
      name: "Capy Lite",
      status: "active",
      currentPeriodEnd: "2026-11-22T12:00:00.000Z",
      canceledAt: null,
      expiresAt: null,
    },
  ],
  balance: {
    unlimited: false,
    grantedCredits: 20000,
    usedCredits: 20300,
    remainingCredits: -300,
    sources: [],
  },
  autoReload: {
    enabled: true,
    thresholdCredits: 5000,
    amountCredits: 25000,
    monthlyCapCredits: 100000,
    enablementDue: false,
    latestAttempt: { id: "att_1", state: "failed", detail: null },
  },
  machineMemory: { runningGb: 0, budgetGb: 128, custom: false },
  included: [
    { feature: "machine_hours", granted: 500, remaining: 120, resetsAt: null },
    { feature: "review_credits", granted: 0, remaining: 0, resetsAt: null },
  ],
  comp: null,
  sponsoredAllowances: [],
  pendingInvoiceUrl: null,
  receipts: { enabled: false, email: "billing@example.com" },
  ssoAddOn: { status: "none", priceCents: 1200, currentPeriodEnd: null },
};

describe("toBillingView", () => {
  it("reads Capy's billing shape", () => {
    const view = toBillingView(capyShape);
    expect(view.customer).toBe(true);
    expect(view.plans[0]?.currentPeriodEnd).toBeInstanceOf(Date);
    expect(view.balance?.remainingCredits).toBe(-300);
    expect(view.autoReload.monthlyCapCredits).toBe(100000);
    expect(view.autoReload.latestAttempt?.state).toBe("failed");
    expect(view.machineMemory).toEqual({
      runningGb: 0,
      budgetGb: 128,
      custom: false,
    });
    expect(view.included.map((entry) => entry.feature)).toEqual([
      "machine_hours",
    ]);
    expect(view.receipts).toEqual({
      enabled: false,
      email: "billing@example.com",
    });
    expect(view.ssoAddOn?.status).toBe("none");
  });

  it("falls back for a flat receipts flag and missing sections", () => {
    const view = toBillingView({
      receipts: true,
      receiptEmail: "finance@example.com",
      paymentMethod: { brand: "Visa" },
      ssoAddOn: { status: "canceled" },
    });
    expect(view.receipts).toEqual({
      enabled: true,
      email: "finance@example.com",
    });
    expect(view.paymentMethod).toBe(true);
    expect(view.plans).toEqual([]);
    expect(view.balance).toBeNull();
    expect(view.machineMemory).toBeNull();
    expect(view.ssoAddOn).toBeNull();
    expect(view.autoReload.enabled).toBe(false);
  });
});

describe("formatters", () => {
  it("formats credits as dollars", () => {
    expect(formatCredits(20000)).toBe("$20");
    expect(formatCredits(-300)).toBe("-$0.30");
    expect(formatCredits(20300)).toBe("$20.30");
  });

  it("formats cents", () => {
    expect(formatCents(1200)).toBe("$12");
    expect(formatCents(1250)).toBe("$12.50");
  });

  it("names plans", () => {
    expect(planDisplayName("capy_pro__v2", "Pro")).toBe("Capy Pro");
    expect(planDisplayName("capy_max_400", "Max")).toBe("Capy Max");
    expect(planDisplayName("custom_plan", "Custom")).toBe("Custom");
    expect(invoiceTitle([])).toBe("Credits");
    expect(invoiceTitle(["credit_pack", "capy_lite"])).toBe("Capy Lite");
  });

  it("describes auto-reload and receipts", () => {
    const view = toBillingView(capyShape);
    expect(autoReloadLine(view.autoReload)).toBe(
      "Reloads to $25 when balance goes below $5, capped at $100 monthly",
    );
    expect(autoReloadLine({ ...view.autoReload, enabled: false })).toBe(
      "Top up automatically when the balance runs low",
    );
    expect(receiptsLine(false, "a@example.com")).toBe(
      "Email a receipt to a@example.com after each payment",
    );
    expect(receiptsLine(true, "a@example.com")).toBe(
      "Sent to a@example.com after each payment",
    );
    expect(receiptsLine(true, null)).toBe("Email a receipt after each payment");
  });

  it("describes credit sources", () => {
    const base = {
      id: "s",
      name: "Plan",
      grantedCredits: 1,
      remainingCredits: 1,
      resetsAt: null,
      expiresAt: null,
    };
    expect(creditSourceLine(base)).toBe("Never expires");
    expect(
      creditSourceLine({ ...base, expiresAt: new Date(2026, 10, 22) }),
    ).toBe("Expires Nov 22, 2026");
    expect(creditSourceLine({ ...base, resetsAt: new Date(2026, 0, 3) })).toBe(
      "Resets Jan 3, 2026",
    );
  });
});

describe("planDescription", () => {
  const view = toBillingView(capyShape);
  const plan = currentPlan(view.plans);

  it("shows the renewal date", () => {
    expect(planDescription(view, plan, undefined, undefined)).toMatch(
      /^Renews Nov 2[12], 2026$/,
    );
  });

  it("covers the no-plan, scheduled and cancelled states", () => {
    expect(
      planDescription(
        { ...view, customer: false },
        undefined,
        undefined,
        undefined,
      ),
    ).toBe("Choose a plan or purchase credits to start billable work");
    const scheduled = { ...view.plans[0], status: "scheduled" } as NonNullable<
      typeof plan
    >;
    expect(scheduledPlan([scheduled])).toBe(scheduled);
    expect(planDescription(view, plan, scheduled, undefined)).toBe(
      "Your plan and credits stay until the end of the cycle",
    );
    const cancelled = {
      ...(plan as NonNullable<typeof plan>),
      canceledAt: new Date(2026, 10, 1),
      expiresAt: new Date(2026, 10, 30),
    };
    expect(planDescription(view, cancelled, undefined, undefined)).toBe(
      "Ends Nov 30, 2026",
    );
    expect(
      planDescription(
        {
          ...view,
          comp: {
            program: "oss",
            endsAt: new Date(2026, 11, 1),
            cancelConfirmed: true,
            resumesPlanName: null,
          },
        },
        plan,
        undefined,
        undefined,
      ),
    ).toBe("$0 until Dec 1, 2026, then no plan");
  });
});

describe("autoReloadError", () => {
  it("validates threshold, target and cap in order", () => {
    expect(autoReloadError(0, 25, false, 0)).toBe(
      "Threshold must be at least $1",
    );
    expect(autoReloadError(10, 5, false, 0)).toBe(
      "Reload target must be at least the threshold",
    );
    expect(autoReloadError(5, 25, true, 10)).toBe(
      "Monthly cap must be at least the reload target",
    );
    expect(autoReloadError(5, 25, true, 100)).toBeNull();
    expect(autoReloadError(5, 25, false, 0)).toBeNull();
  });
});

describe("toBillingInvoices", () => {
  it("reads both item lists and plain arrays", () => {
    const [mock] = toBillingInvoices([
      {
        id: "in_1",
        status: "paid",
        amount: 4800,
        issuedAt: "2026-03-01T00:00:00.000Z",
        hostedInvoiceUrl: null,
      },
    ]);
    expect(mock?.totalCents).toBe(4800);
    expect(mock?.createdAt).toBeInstanceOf(Date);
    const [capy] = toBillingInvoices({
      items: [
        {
          id: "in_2",
          planIds: ["capy_pro"],
          totalCents: 10000,
          status: "open",
        },
      ],
    });
    expect(capy?.planIds).toEqual(["capy_pro"]);
  });
});

describe("errorMessage", () => {
  it("prefers a Capy API message and otherwise uses the fallback", () => {
    expect(
      errorMessage({ _tag: "capy/Conflict", message: "Taken" }, "Failed"),
    ).toBe("Taken");
    expect(errorMessage(new Error("socket"), "Failed")).toBe("Failed");
  });
});
