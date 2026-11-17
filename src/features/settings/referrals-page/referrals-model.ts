export type HistoryEntry = {
  id: string;
  title: string;
  detail?: string;
  delta: number;
  balance: number;
  pending?: boolean;
};

export type ReferralSummary = {
  eligible: boolean;
  code: string;
  balance: number;
  qualifiedReferrals: number;
  kickbackTier: "none" | "fellow" | "lead" | "ambassador";
  kickbackStartsAt: Date | null;
  kickbackEarned: number;
  history: HistoryEntry[];
};

export const sampleReferrals: ReferralSummary = {
  eligible: false,
  code: "ACME42",
  balance: 0,
  qualifiedReferrals: 0,
  kickbackTier: "none",
  kickbackStartsAt: null,
  kickbackEarned: 0,
  history: [],
};

export const kickbackTarget = 10;

export const usd = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    amount,
  );

export const signedUsd = (delta: number) =>
  `${delta > 0 ? "+" : "−"}${usd(Math.abs(delta))}`;

export function kickbackProgress(summary: ReferralSummary) {
  const qualified = Math.min(summary.qualifiedReferrals, kickbackTarget);
  const unlocked =
    summary.kickbackTier !== "none" || qualified >= kickbackTarget;
  return {
    qualified,
    unlocked,
    percent: (qualified / kickbackTarget) * 100,
    caption:
      summary.kickbackTier !== "none"
        ? "Permanently unlocked"
        : qualified < kickbackTarget
          ? `${(kickbackTarget - qualified).toLocaleString("en-US")} more to unlock`
          : "Qualification complete",
  };
}

export const referralLink = (origin: string, code: string) =>
  `${origin}/?ref=${encodeURIComponent(code)}`;
