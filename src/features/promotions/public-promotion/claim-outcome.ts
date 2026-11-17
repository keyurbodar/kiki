import type { ClaimOutcome } from "@/data/api/schemas/promotion";

export type ClaimState =
  | "granted"
  | "pending"
  | "already_claimed"
  | "claimed"
  | "email_mismatch"
  | "exhausted"
  | "ineligible";

export type ViewState = ClaimState | "available";

export const claimState = (outcome: ClaimOutcome): ClaimState => {
  switch (outcome.kind) {
    case "delivered":
    case "already_delivered":
      return "granted";
    case "pending":
      return "pending";
    case "already_claimed":
      return "already_claimed";
    case "rejected":
      return outcome.reason === "exhausted"
        ? "exhausted"
        : outcome.reason === "already_redeemed"
          ? "already_claimed"
          : "ineligible";
    case "ineligible":
      return outcome.reason === "email"
        ? "email_mismatch"
        : outcome.reason === "claimed"
          ? "claimed"
          : "ineligible";
  }
};

export const terminalCopy: Record<
  ClaimState,
  { title: string; description: string; positive: boolean }
> = {
  granted: {
    title: "Credits added",
    description: "Your organization is ready to build",
    positive: true,
  },
  pending: {
    title: "Credits on the way",
    description: "They will appear on your organization's balance shortly",
    positive: true,
  },
  already_claimed: {
    title: "Already claimed",
    description: "Your account or organization already received these credits",
    positive: false,
  },
  claimed: {
    title: "Offer already claimed",
    description: "This offer has already been used",
    positive: false,
  },
  email_mismatch: {
    title: "Email does not match",
    description: "Sign in with the email this offer was sent to",
    positive: false,
  },
  exhausted: {
    title: "Fully claimed",
    description: "Every claim for this promotion has been used",
    positive: false,
  },
  ineligible: {
    title: "Promotion unavailable",
    description: "This promotion cannot be claimed with this organization",
    positive: false,
  },
};
