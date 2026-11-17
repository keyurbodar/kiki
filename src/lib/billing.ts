type Raw = Record<string, unknown>;

const record = (value: unknown): Raw =>
  typeof value === "object" && value !== null ? (value as Raw) : {};
const str = (value: unknown) => (typeof value === "string" ? value : undefined);
const num = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;
const bool = (value: unknown) =>
  typeof value === "boolean" ? value : undefined;
const date = (value: unknown) => {
  if (value instanceof Date) return value;
  if (typeof value !== "string" && typeof value !== "number") return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};
const list = (value: unknown) => (Array.isArray(value) ? value : []);

export type BillingPlan = {
  planId: string;
  name: string;
  status: string;
  interval: string | null;
  currentPeriodEnd: Date | null;
  canceledAt: Date | null;
  expiresAt: Date | null;
};

export type CreditSource = {
  id: string;
  name: string;
  grantedCredits: number;
  remainingCredits: number;
  resetsAt: Date | null;
  expiresAt: Date | null;
};

export type BillingBalance = {
  unlimited: boolean;
  grantedCredits: number;
  usedCredits: number;
  remainingCredits: number;
  planRemainingCredits: number | null;
  sources: CreditSource[];
};

export type ReloadAttempt = {
  id: string;
  state: string;
  detail: string | null;
  paymentActionAvailable: boolean;
  reconciliationRequired: boolean;
};

export type AutoReload = {
  enabled: boolean;
  thresholdCredits: number;
  amountCredits: number;
  monthlyCapCredits: number | null;
  enablementDue: boolean;
  latestAttempt: ReloadAttempt | null;
};

export type IncludedUsage = {
  feature: "machine_hours" | "review_credits";
  granted: number;
  remaining: number;
  resetsAt: Date | null;
};

export type SponsoredAllowance = {
  id: string;
  period: "day" | "month";
  products: string[];
  amountCredits: number;
  usedCredits: number;
  remainingCredits: number;
  resetAt: Date | null;
  paidFallthrough: boolean;
};

export type SsoAddOn = {
  status: "none" | "active" | "cancelling" | "included";
  priceCents: number;
  currentPeriodEnd: Date | null;
};

export type BillingComp = {
  program: string | null;
  endsAt: Date;
  cancelConfirmed: boolean;
  resumesPlanName: string | null;
};

export type BillingView = {
  customer: boolean;
  paymentMethod: boolean;
  plans: BillingPlan[];
  balance: BillingBalance | null;
  autoReload: AutoReload;
  machineMemory: {
    runningGb: number;
    budgetGb: number;
    custom: boolean;
  } | null;
  included: IncludedUsage[];
  comp: BillingComp | null;
  sponsoredAllowances: SponsoredAllowance[];
  pendingInvoiceUrl: string | null;
  receipts: { enabled: boolean; email: string | null };
  ssoAddOn: SsoAddOn | null;
};

export type BillingInvoice = {
  id: string;
  planIds: string[];
  createdAt: Date | null;
  status: string;
  totalCents: number;
  hostedInvoiceUrl: string | null;
};

const toPlan = (value: unknown): BillingPlan => {
  const plan = record(value);
  const planId = str(plan.planId) ?? str(plan.id) ?? "";
  return {
    planId,
    name: str(plan.name) ?? planId,
    status: str(plan.status) ?? "active",
    interval: str(plan.interval) ?? null,
    currentPeriodEnd: date(plan.currentPeriodEnd),
    canceledAt: date(plan.canceledAt),
    expiresAt: date(plan.expiresAt),
  };
};

const toBalance = (value: unknown): BillingBalance | null => {
  if (value === null || value === undefined) return null;
  const balance = record(value);
  return {
    unlimited: bool(balance.unlimited) ?? false,
    grantedCredits: num(balance.grantedCredits) ?? 0,
    usedCredits: num(balance.usedCredits) ?? 0,
    remainingCredits: num(balance.remainingCredits) ?? 0,
    planRemainingCredits: num(balance.planRemainingCredits) ?? null,
    sources: list(balance.sources).map((entry) => {
      const source = record(entry);
      return {
        id: str(source.id) ?? "",
        name: str(source.name) ?? "",
        grantedCredits: num(source.grantedCredits) ?? 0,
        remainingCredits: num(source.remainingCredits) ?? 0,
        resetsAt: date(source.resetsAt),
        expiresAt: date(source.expiresAt),
      };
    }),
  };
};

const toAttempt = (value: unknown): ReloadAttempt | null => {
  if (value === null || value === undefined) return null;
  const attempt = record(value);
  return {
    id: str(attempt.id) ?? "",
    state: str(attempt.state) ?? "",
    detail: str(attempt.detail) ?? null,
    paymentActionAvailable: bool(attempt.paymentActionAvailable) ?? false,
    reconciliationRequired: bool(attempt.reconciliationRequired) ?? false,
  };
};

const ssoStatuses = ["none", "active", "cancelling", "included"] as const;

export function toBillingView(value: unknown): BillingView {
  const raw = record(value);
  const reload = record(raw.autoReload);
  const memory = raw.machineMemory === null ? null : record(raw.machineMemory);
  const comp = raw.comp === null ? null : record(raw.comp);
  const sso = raw.ssoAddOn === null ? null : record(raw.ssoAddOn);
  const receipts = raw.receipts;
  const ssoStatus = ssoStatuses.find((status) => status === sso?.status);
  const compEnds = date(comp?.endsAt);
  return {
    customer: bool(raw.customer) ?? false,
    paymentMethod: Boolean(raw.paymentMethod),
    plans: list(raw.plans).map(toPlan),
    balance: toBalance(raw.balance),
    autoReload: {
      enabled: bool(reload.enabled) ?? false,
      thresholdCredits: num(reload.thresholdCredits) ?? 0,
      amountCredits: num(reload.amountCredits) ?? 0,
      monthlyCapCredits: num(reload.monthlyCapCredits) ?? null,
      enablementDue: bool(reload.enablementDue) ?? false,
      latestAttempt: toAttempt(reload.latestAttempt),
    },
    machineMemory:
      memory === null || num(memory.budgetGb) === undefined
        ? null
        : {
            runningGb: num(memory.runningGb) ?? 0,
            budgetGb: num(memory.budgetGb) ?? 0,
            custom: bool(memory.custom) ?? false,
          },
    included: list(raw.included).flatMap((entry) => {
      const usage = record(entry);
      const feature =
        usage.feature === "machine_hours" || usage.feature === "review_credits"
          ? usage.feature
          : undefined;
      const granted = num(usage.granted) ?? 0;
      return feature === undefined || granted <= 0
        ? []
        : [
            {
              feature,
              granted,
              remaining: num(usage.remaining) ?? 0,
              resetsAt: date(usage.resetsAt),
            },
          ];
    }),
    comp:
      comp === null || compEnds === null
        ? null
        : {
            program: str(comp.program) ?? null,
            endsAt: compEnds,
            cancelConfirmed: bool(comp.cancelConfirmed) ?? false,
            resumesPlanName: str(comp.resumesPlanName) ?? null,
          },
    sponsoredAllowances: list(raw.sponsoredAllowances).map((entry) => {
      const allowance = record(entry);
      return {
        id: str(allowance.id) ?? "",
        period: allowance.period === "day" ? "day" : "month",
        products: list(allowance.products).flatMap((product) =>
          typeof product === "string" ? [product] : [],
        ),
        amountCredits: num(allowance.amountCredits) ?? 0,
        usedCredits: num(allowance.usedCredits) ?? 0,
        remainingCredits: num(allowance.remainingCredits) ?? 0,
        resetAt: date(allowance.resetAt),
        paidFallthrough: bool(allowance.paidFallthrough) ?? false,
      };
    }),
    pendingInvoiceUrl: str(raw.pendingInvoiceUrl) ?? null,
    receipts:
      typeof receipts === "object" && receipts !== null
        ? {
            enabled: bool(record(receipts).enabled) ?? false,
            email: str(record(receipts).email) ?? null,
          }
        : {
            enabled: bool(receipts) ?? false,
            email: str(raw.receiptEmail) ?? null,
          },
    ssoAddOn:
      sso === null || ssoStatus === undefined
        ? null
        : {
            status: ssoStatus,
            priceCents: num(sso.priceCents) ?? 0,
            currentPeriodEnd: date(sso.currentPeriodEnd),
          },
  };
}

export function toBillingInvoices(value: unknown): BillingInvoice[] {
  const items = Array.isArray(value) ? value : list(record(value).items);
  return items.map((entry) => {
    const invoice = record(entry);
    return {
      id: str(invoice.id) ?? "",
      planIds: list(invoice.planIds).flatMap((id) =>
        typeof id === "string" ? [id] : [],
      ),
      createdAt: date(invoice.createdAt ?? invoice.issuedAt),
      status: str(invoice.status) ?? "",
      totalCents: num(invoice.totalCents) ?? num(invoice.amount) ?? 0,
      hostedInvoiceUrl: str(invoice.hostedInvoiceUrl) ?? null,
    };
  });
}

const CREDITS_PER_DOLLAR = 1000;
const wholeDollars = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});
const centsDollars = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Credits as dollars: 20000 is "$20", -300 is "-$0.30". */
export const formatCredits = (credits: number) => {
  const dollars = credits / CREDITS_PER_DOLLAR;
  return (Number.isInteger(dollars) ? wholeDollars : centsDollars).format(
    dollars,
  );
};

/** Credits as a bare dollar amount: 25000 is "25". */
export const creditsToDollarsLabel = (credits: number) =>
  (credits / CREDITS_PER_DOLLAR).toLocaleString("en-US");

export const formatCents = (cents: number) =>
  (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  });

export const formatBillingDate = (value: Date) =>
  value.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export const formatShortDate = (value: Date) =>
  value.toLocaleDateString("en-US", { month: "short", day: "numeric" });

export const formatCount = (value: number) =>
  Math.floor(Math.max(0, value)).toLocaleString("en-US");

export const CREDIT_PACK_PLAN_ID = "credit_pack";

const planNames: Record<string, string> = {
  capy_lite: "Capy Lite",
  capy_pro: "Capy Pro",
  capy_lite_annual: "Capy Lite",
  capy_pro_annual: "Capy Pro",
  capy_free: "Capy Free",
};

export const basePlanId = (planId: string) => planId.split("__")[0] ?? planId;

/** Capy's display name for a plan id, falling back to the stored name. */
export const planDisplayName = (planId: string, name: string) => {
  const base = basePlanId(planId);
  const known = planNames[base];
  if (known !== undefined) return known;
  if (base.startsWith("capy_max")) return "Capy Max";
  return name;
};

export const currentPlan = (plans: readonly BillingPlan[]) =>
  plans.find(
    (plan) =>
      plan.planId !== CREDIT_PACK_PLAN_ID &&
      basePlanId(plan.planId) !== "capy_free" &&
      (plan.status === "active" || plan.status === "trialing"),
  );

export const scheduledPlan = (plans: readonly BillingPlan[]) =>
  plans.find(
    (plan) =>
      plan.planId !== CREDIT_PACK_PLAN_ID && plan.status === "scheduled",
  );

export const planCancelDate = (plan: BillingPlan | undefined) =>
  plan?.canceledAt == null
    ? undefined
    : (plan.expiresAt ?? plan.currentPeriodEnd ?? plan.canceledAt);

/** The plan row's secondary line on the Billing page. */
export function planDescription(
  billing: BillingView,
  plan: BillingPlan | undefined,
  scheduled: BillingPlan | undefined,
  freeLine: string | undefined,
) {
  if (billing.comp !== null) {
    const then = billing.comp.cancelConfirmed
      ? `, then ${billing.comp.resumesPlanName ?? "no plan"}`
      : "";
    return `$0 until ${formatBillingDate(billing.comp.endsAt)}${then}`;
  }
  if (
    billing.balance?.unlimited === true &&
    plan === undefined &&
    scheduled === undefined
  )
    return "Unlimited credits, no recurring plan";
  if (freeLine !== undefined && plan === undefined && scheduled === undefined)
    return freeLine;
  if (!billing.customer)
    return "Choose a plan or purchase credits to start billable work";
  if (scheduled !== undefined)
    return "Your plan and credits stay until the end of the cycle";
  const ends = planCancelDate(plan);
  if (ends !== undefined) return `Ends ${formatBillingDate(ends)}`;
  return plan?.currentPeriodEnd == null
    ? "Credits only, no recurring plan"
    : `Renews ${formatBillingDate(plan.currentPeriodEnd)}`;
}

export const creditSourceLine = (source: CreditSource) =>
  source.resetsAt === null
    ? source.expiresAt === null
      ? "Never expires"
      : `Expires ${formatBillingDate(source.expiresAt)}`
    : `Resets ${formatBillingDate(source.resetsAt)}`;

export const invoiceTitle = (planIds: readonly string[]) => {
  const named = planIds.find((id) => planNames[basePlanId(id)] !== undefined);
  if (named !== undefined) return planDisplayName(named, named);
  if (planIds.length === 0) return "Credits";
  return planDisplayName(planIds[0] ?? "", planIds[0] ?? "Credits");
};

export const capitalize = (value: string) =>
  value.length === 0 ? value : value[0]?.toUpperCase() + value.slice(1);

export const autoReloadLine = (reload: AutoReload) =>
  reload.enabled
    ? `Reloads to $${creditsToDollarsLabel(reload.amountCredits)} when balance goes below $${creditsToDollarsLabel(reload.thresholdCredits)}${reload.monthlyCapCredits === null ? "" : `, capped at $${creditsToDollarsLabel(reload.monthlyCapCredits)} monthly`}`
    : "Top up automatically when the balance runs low";

export const receiptsLine = (enabled: boolean, email: string | null) =>
  email === null
    ? "Email a receipt after each payment"
    : enabled
      ? `Sent to ${email} after each payment`
      : `Email a receipt to ${email} after each payment`;

export const machineMemoryLine = (memory: {
  budgetGb: number;
  custom: boolean;
}) =>
  memory.budgetGb === 0
    ? "Choose a plan or purchase credits to run cloud machines"
    : `Running cloud machines share this ${memory.custom ? "custom" : "plan's"} budget, and one that does not fit is refused until another stops`;

/** Validation for the auto-reload dialog's dollar fields. */
export function autoReloadError(
  threshold: number,
  target: number,
  capEnabled: boolean,
  cap: number,
) {
  if (!Number.isFinite(threshold) || threshold < 1)
    return "Threshold must be at least $1";
  if (!Number.isFinite(target) || target < threshold)
    return "Reload target must be at least the threshold";
  if (capEnabled && (!Number.isFinite(cap) || cap < target))
    return "Monthly cap must be at least the reload target";
  return null;
}

export const RECEIPT_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const CREDIT_AMOUNTS = [20, 100, 500] as const;
export const MIN_CREDIT_DOLLARS = 5;

export const CANCEL_REASONS = {
  too_expensive: "Too expensive",
  not_using: "Not using it enough",
  missing_feature: "Missing a feature",
  output_quality: "Output quality",
  switched_tool: "Switched to another tool",
  project_ended: "Project ended or temporary",
  other: "Other",
} as const;

export type CancelReason = keyof typeof CANCEL_REASONS;

/** A Capy API error's own message, else the fallback copy. */
export const errorMessage = (error: unknown, fallback: string) => {
  const failure = record(error);
  const message = str(failure.message);
  return str(failure._tag)?.startsWith("capy/") && message ? message : fallback;
};
