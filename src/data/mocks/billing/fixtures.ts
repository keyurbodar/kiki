import { DateTime } from "effect";
import { minutesAgo } from "../fixtures/time.ts";
import { members, projects, threads } from "../fixtures/world.ts";

const hour = 60;
const day = 24 * hour;

export const accountSeed = {
  id: "cus_sample_acme",
  name: "Acme",
  email: "billing@example.com",
  customerId: "cus_sample_acme",
  plan: "Team",
  planStatus: "active",
  planAmount: 4800,
  planInterval: "month",
  currentPeriodStart: DateTime.formatIso(minutesAgo(12 * day)),
  currentPeriodEnd: DateTime.formatIso(minutesAgo(-18 * day)),
  cancelAtPeriodEnd: false,
  customer: true,
  plans: [
    {
      planId: "capy_lite",
      name: "Capy Lite",
      status: "active",
      interval: "month",
      currentPeriodEnd: DateTime.formatIso(minutesAgo(-18 * day)),
      canceledAt: null as string | null,
      expiresAt: null as string | null,
    },
  ],
  balance: {
    unlimited: false,
    grantedCredits: 20000,
    usedCredits: 20300,
    remainingCredits: -300,
    planRemainingCredits: null as number | null,
    sources: [] as unknown[],
  },
  machineMemory: { runningGb: 0, budgetGb: 128, custom: false },
  included: [] as unknown[],
  comp: null,
  sponsoredAllowances: [] as unknown[],
  pendingInvoiceUrl: null,
  seats: members.length,
  credits: 18450,
  paymentMethod: {
    id: "pm_sample_visa",
    brand: "Visa",
    last4: "4242",
    expiryMonth: 8,
    expiryYear: 2028,
  },
  autoReload: {
    enabled: false,
    threshold: 5000,
    amount: 10000,
    attempts: 2,
    lastAttemptAt: DateTime.formatIso(minutesAgo(2 * day)),
    lastFailure: null,
    thresholdCredits: 5000,
    amountCredits: 10000,
    monthlyCapCredits: null as number | null,
    enablementDue: false,
    latestAttempt: null,
  },
  receipts: false,
  receiptEmail: "billing@example.com",
  sponsoredPaidFallthrough: true,
  ssoAddOn: {
    status: "none",
    amount: 1200,
    interval: "month",
    renewsAt: DateTime.formatIso(minutesAgo(-18 * day)),
    priceCents: 1200,
    currentPeriodEnd: DateTime.formatIso(minutesAgo(-18 * day)),
  },
};

export const catalogSeed = [
  {
    id: "credits_starter",
    name: "Starter credits",
    amount: 5000,
    priceCents: 500,
    description: "Top up a workspace with a small credit pack.",
  },
  {
    id: "credits_team",
    name: "Team credits",
    amount: 25000,
    priceCents: 2000,
    description: "A larger pack for shared agent time.",
  },
  {
    id: "plan_team",
    name: "Team",
    amount: 4800,
    priceCents: 4800,
    interval: "month",
    description: "Shared projects, members, and usage reporting.",
  },
  {
    id: "addon_sso",
    name: "Single sign-on",
    amount: 1200,
    priceCents: 1200,
    interval: "month",
    description: "SAML single sign-on for Acme.",
  },
];

export const invoiceSeed = [
  {
    id: "in_sample_1042",
    number: "ACME-1042",
    planIds: ["capy_lite"],
    status: "paid",
    amount: 4800,
    currency: "usd",
    issuedAt: DateTime.formatIso(minutesAgo(12 * day)),
    paidAt: DateTime.formatIso(minutesAgo(11 * day)),
    description: "Team plan, monthly",
    hostedInvoiceUrl: "https://billing.example.com/invoices/ACME-1042",
  },
  {
    id: "in_sample_1041",
    number: "ACME-1041",
    planIds: ["capy_lite", "credit_pack"],
    status: "paid",
    amount: 6800,
    currency: "usd",
    issuedAt: DateTime.formatIso(minutesAgo(42 * day)),
    paidAt: DateTime.formatIso(minutesAgo(41 * day)),
    description: "Team plan and credit pack",
    hostedInvoiceUrl: "https://billing.example.com/invoices/ACME-1041",
  },
  {
    id: "in_sample_1040",
    number: "ACME-1040",
    planIds: [] as string[],
    status: "open",
    amount: 1200,
    currency: "usd",
    issuedAt: DateTime.formatIso(minutesAgo(2 * day)),
    paidAt: null,
    description: "Single sign-on add-on",
    hostedInvoiceUrl: "https://billing.example.com/invoices/ACME-1040",
  },
  {
    id: "in_sample_1043",
    number: "ACME-1043",
    planIds: ["credit_pack"],
    status: "void",
    amount: 2000,
    currency: "usd",
    issuedAt: DateTime.formatIso(minutesAgo(day)),
    paidAt: null,
    description: "Credit pack",
    hostedInvoiceUrl: "https://billing.example.com/invoices/ACME-1043",
  },
];

export const usageSeed = {
  period: {
    start: DateTime.formatIso(minutesAgo(30 * day)),
    end: DateTime.formatIso(minutesAgo(0)),
  },
  totalCredits: 18450,
  totalCostCents: 1845,
  currency: "usd",
  totalThreads: Object.keys(threads).length,
  totalMembers: members.length,
  breakdown: [
    {
      kind: "inference",
      credits: 13200,
      costCents: 1320,
      model: "anthropic/claude-opus",
    },
    { kind: "inference", credits: 3450, costCents: 345, model: "openai/gpt" },
    {
      kind: "machines",
      credits: 1800,
      costCents: 180,
      projectId: projects.web.id,
    },
  ],
  heatmap: [
    {
      date: DateTime.formatIso(minutesAgo(6 * day)),
      credits: 920,
      costCents: 92,
    },
    {
      date: DateTime.formatIso(minutesAgo(5 * day)),
      credits: 1540,
      costCents: 154,
    },
    {
      date: DateTime.formatIso(minutesAgo(4 * day)),
      credits: 760,
      costCents: 76,
    },
    {
      date: DateTime.formatIso(minutesAgo(3 * day)),
      credits: 2810,
      costCents: 281,
    },
    {
      date: DateTime.formatIso(minutesAgo(2 * day)),
      credits: 3120,
      costCents: 312,
    },
    {
      date: DateTime.formatIso(minutesAgo(day)),
      credits: 1480,
      costCents: 148,
    },
    { date: DateTime.formatIso(minutesAgo(0)), credits: 1120, costCents: 112 },
  ],
  leaderboard: members.map((member, index) => ({
    userId: member.id,
    name: `${member.firstName} ${member.lastName}`,
    credits: [6200, 4800, 3100, 2500, 1850][index] ?? 0,
  })),
  series: [
    {
      date: DateTime.formatIso(minutesAgo(6 * day)),
      credits: 920,
      costCents: 92,
    },
    {
      date: DateTime.formatIso(minutesAgo(4 * day)),
      credits: 2300,
      costCents: 230,
    },
    {
      date: DateTime.formatIso(minutesAgo(2 * day)),
      credits: 5930,
      costCents: 593,
    },
    { date: DateTime.formatIso(minutesAgo(0)), credits: 9300, costCents: 930 },
  ],
};

export const memberUsageSeed = members.map((member, index) => ({
  userId: member.id,
  email: member.email,
  name: `${member.firstName} ${member.lastName}`,
  role: member.role,
  credits: [6200, 4800, 3100, 2500, 1850][index] ?? 0,
  costCents: [620, 480, 310, 250, 185][index] ?? 0,
  threads: [3, 2, 1, 1, 0][index] ?? 0,
}));

export const threadUsageSeed = [
  {
    threadId: threads.checkoutTest.id,
    title: threads.checkoutTest.title,
    projectId: threads.checkoutTest.projectId,
    credits: 2140,
    costCents: 214,
    dominantRoute: "byok",
  },
  {
    threadId: threads.darkMode.id,
    title: threads.darkMode.title,
    projectId: threads.darkMode.projectId,
    credits: 1860,
    costCents: 186,
    dominantRoute: "byok",
  },
  {
    threadId: threads.paginate.id,
    title: threads.paginate.title,
    projectId: threads.paginate.projectId,
    credits: 1420,
    costCents: 142,
    dominantRoute: "subscription",
  },
  {
    threadId: threads.rateLimit.id,
    title: threads.rateLimit.title,
    projectId: threads.rateLimit.projectId,
    credits: 980,
    costCents: 98,
    dominantRoute: "byok",
  },
  {
    threadId: threads.bundler.id,
    title: threads.bundler.title,
    projectId: threads.bundler.projectId,
    credits: 760,
    costCents: 76,
    dominantRoute: "paid",
  },
];
