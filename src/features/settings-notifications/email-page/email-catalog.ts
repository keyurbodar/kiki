export const emailPrograms = [
  "product_news",
  "weekly",
  "onboarding",
  "win_back",
] as const;

export type EmailProgram = (typeof emailPrograms)[number];

export type EmailProgramInfo = {
  label: string;
  description: string;
  question: string;
  stop: string;
  cadence: string;
  rowId: string;
};

export const emailProgramInfo: Record<EmailProgram, EmailProgramInfo> = {
  product_news: {
    label: "Product news",
    description: "Launches and what's new in Capy",
    question: "Stop getting product news?",
    stop: "Stop product news",
    cadence: "when Capy ships something new",
    rowId: "email-product-news",
  },
  weekly: {
    label: "Weekly recap",
    description: "Your week in Capy",
    question: "Stop getting the weekly recap?",
    stop: "Stop weekly recap",
    cadence: "once a week",
    rowId: "email-weekly",
  },
  onboarding: {
    label: "Onboarding tips",
    description: "Getting started in your first weeks",
    question: "Stop getting onboarding tips?",
    stop: "Stop onboarding tips",
    cadence: "in your first weeks",
    rowId: "email-onboarding",
  },
  win_back: {
    label: "Check-ins",
    description: "A note after time away",
    question: "Stop getting check-ins?",
    stop: "Stop check-ins",
    cadence: "after time away",
    rowId: "email-win-back",
  },
};

export const isEmailProgram = (value: unknown): value is EmailProgram =>
  typeof value === "string" &&
  (emailPrograms as readonly string[]).includes(value);

export type EmailNoticeInfo = {
  label: string;
  description: string;
  group: "account" | "team";
  rowId: string;
  risk?: { title: string; description: string };
};

export const emailNoticeInfo = {
  device_enrolled: {
    label: "New sign-ins",
    description: "When a computer is added to your account",
    group: "account",
    rowId: "email-sign-ins",
    risk: {
      title: "Turn off new sign-in alerts?",
      description: "You won't hear about a computer you didn't add",
    },
  },
  org_invite: {
    label: "Invitations",
    description: "When someone invites you to an organization",
    group: "account",
    rowId: "email-invitations",
  },
  admin_signup_invite_credits: {
    label: "Credit offers",
    description: "When partner credits are waiting to be claimed",
    group: "account",
    rowId: "email-credit-offers",
  },
  member_joined: {
    label: "New members",
    description: "When someone joins your organization",
    group: "team",
    rowId: "email-new-members",
  },
  auto_reload: {
    label: "Auto-reload receipts",
    description: "Each time credits reload",
    group: "team",
    rowId: "email-auto-reload",
  },
  auto_reload_failed: {
    label: "Failed payments",
    description: "When an auto-reload card is declined",
    group: "team",
    rowId: "email-failed-payments",
    risk: {
      title: "Turn off failed payment alerts?",
      description: "Credits can run out and threads stop without warning",
    },
  },
  partner_credits_applied: {
    label: "Credits added",
    description: "When partner or promo credits land",
    group: "team",
    rowId: "email-credits-added",
  },
} satisfies Record<string, EmailNoticeInfo>;

export type EmailNotice = keyof typeof emailNoticeInfo;

export const emailNotices = Object.keys(emailNoticeInfo) as EmailNotice[];

export const noticeInfo = (notice: EmailNotice): EmailNoticeInfo =>
  emailNoticeInfo[notice];

export type EmailPreferenceTarget =
  | { kind: "marketing" }
  | { kind: "program"; program: EmailProgram }
  | { kind: "notice"; notice: EmailNotice };

export const emailPreferenceKey = (target: EmailPreferenceTarget) =>
  target.kind === "marketing"
    ? "marketing"
    : target.kind === "program"
      ? `program:${target.program}`
      : `notice:${target.notice}`;

export const emailPreferenceLabel = (target: EmailPreferenceTarget) =>
  target.kind === "marketing"
    ? "Marketing email"
    : target.kind === "program"
      ? emailProgramInfo[target.program].label
      : noticeInfo(target.notice).label;
