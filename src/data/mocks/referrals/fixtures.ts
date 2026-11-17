import { DateTime } from "effect";
import { minutesAgo } from "../fixtures/time.ts";
import { people, projects, threads } from "../fixtures/world.ts";

const hour = 60;
const day = 24 * hour;

export const dashboardSeed = {
  code: "ACME-REFS",
  shareUrl: "https://capy.example.com/referrals/ACME-REFS",
  referredCount: 3,
  pendingCount: 1,
  creditedCount: 2,
  totalCredits: 14000,
  tier: "Partner",
  nextTierCredits: 25000,
  rewards: [
    {
      id: "reward_sample_signup",
      name: "Referral signup",
      credits: 5000,
      status: "granted",
    },
    {
      id: "reward_sample_first_thread",
      name: "First thread",
      credits: 9000,
      status: "granted",
    },
  ],
};

export const historySeed = [
  {
    id: "ref_sample_rivera",
    email: "taylor@example.com",
    name: "Taylor Rivera",
    status: "credited",
    credits: 5000,
    joinedAt: DateTime.formatIso(minutesAgo(20 * day)),
    creditedAt: DateTime.formatIso(minutesAgo(18 * day)),
  },
  {
    id: "ref_sample_shah",
    email: "dev@example.com",
    name: "Dev Shah",
    status: "credited",
    credits: 9000,
    joinedAt: DateTime.formatIso(minutesAgo(10 * day)),
    creditedAt: DateTime.formatIso(minutesAgo(8 * day)),
  },
  {
    id: "ref_sample_lee",
    email: "jo@example.com",
    name: "Jo Lee",
    status: "pending",
    credits: 0,
    joinedAt: DateTime.formatIso(minutesAgo(2 * day)),
    creditedAt: null,
  },
];

export const kickbackSeed = [
  {
    id: "kb_sample_signup",
    name: "Referral signup",
    trigger: "referee_signup",
    credits: 5000,
    tier: "Partner",
  },
  {
    id: "kb_sample_thread",
    name: "First completed thread",
    trigger: "referee_first_thread",
    credits: 9000,
    tier: "Partner",
  },
];

export const previewSeed = {
  code: "ACME-REFS",
  shareUrl: "https://capy.example.com/referrals/ACME-REFS",
  title: "Build with Acme's team",
  description: "Join Acme on Capy and get started with shared agent time.",
  referrerName: `${people.alex.firstName} ${people.alex.lastName}`,
  organizationName: "Acme",
  expiresAt: DateTime.formatIso(minutesAgo(-30 * day)),
};

export const refereeSeed = {
  code: "ACME-REFS",
  referrerName: `${people.alex.firstName} ${people.alex.lastName}`,
  organizationName: "Acme",
  status: "eligible",
  rewardCredits: 5000,
  appliedCredits: 0,
  expiresAt: DateTime.formatIso(minutesAgo(-30 * day)),
};

export const transferSeed = [
  {
    id: "tr_sample_5000",
    amount: 5000,
    status: "completed",
    fromOrgId: "org_sample_lab",
    toOrgId: "org_sample_acme",
    refereeId: "ref_sample_rivera",
    createdAt: DateTime.formatIso(minutesAgo(18 * day)),
  },
  {
    id: "tr_sample_9000",
    amount: 9000,
    status: "completed",
    fromOrgId: "org_sample_lab",
    toOrgId: "org_sample_acme",
    refereeId: "ref_sample_shah",
    createdAt: DateTime.formatIso(minutesAgo(8 * day)),
  },
  {
    id: "tr_sample_pending",
    amount: 5000,
    status: "pending",
    fromOrgId: "org_sample_lab",
    toOrgId: "org_sample_acme",
    refereeId: "ref_sample_lee",
    createdAt: DateTime.formatIso(minutesAgo(2 * day)),
  },
];

export const activitySeed = [
  {
    id: "ra_sample_1",
    kind: "thread",
    actor: people.sam.id,
    title: threads.checkoutTest.title,
    threadId: threads.checkoutTest.id,
    projectId: projects.web.id,
    occurredAt: DateTime.formatIso(minutesAgo(hour)),
  },
  {
    id: "ra_sample_2",
    kind: "thread",
    actor: people.priya.id,
    title: threads.gettingStarted.title,
    threadId: threads.gettingStarted.id,
    projectId: projects.docs.id,
    occurredAt: DateTime.formatIso(minutesAgo(day)),
  },
];
