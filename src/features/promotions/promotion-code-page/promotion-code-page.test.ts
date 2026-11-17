import { describe, expect, it } from "vitest";
import {
  DealCodePreview,
  OfferCredits,
  OfferTrial,
  PromotionCodePreview,
} from "@/data/api/schemas/promotion";
import { claimUntilSettled, pendingPollLimitMs } from "./promotion-claim";
import { signUpPreviewProps } from "./promotion-code-page";

const preview = (credits: number | null, trial: OfferTrial | null) =>
  new PromotionCodePreview({
    name: "Sample",
    code: "SAMPLE",
    credits:
      credits === null
        ? null
        : new OfferCredits({ amount: credits, expiry: null }),
    trial,
    creditAmount: credits,
    expiry: null,
  });

const proTrial = new OfferTrial({
  tierId: "capy_pro",
  trialDays: 14,
  introPriceCents: 0,
  requireCard: false,
});

describe("signUpPreviewProps", () => {
  it("shows credits only", () => {
    expect(signUpPreviewProps(preview(50_000, null))).toEqual({
      creditAmount: 50_000,
    });
  });

  it("combines credits and a trial", () => {
    expect(signUpPreviewProps(preview(25_000, proTrial))).toMatchObject({
      heading: "$25 in credits + 14 days of Capy Pro",
      receives: "the offer",
    });
  });

  it("presents a trial or deal as the plan", () => {
    expect(signUpPreviewProps(preview(null, proTrial))).toMatchObject({
      heading: "Capy Pro free for 14 days",
      receives: "the plan",
    });
    expect(
      signUpPreviewProps(
        new DealCodePreview({
          name: "Deal",
          code: "DEAL",
          tierId: "capy_lite",
          trialDays: 30,
          introPriceCents: 500,
          requireCard: true,
        }),
      ),
    ).toMatchObject({ heading: "Capy Lite for $5", receives: "the plan" });
  });

  it("is unavailable without an offer", () => {
    expect(signUpPreviewProps(preview(null, null))).toBeUndefined();
  });
});

describe("claimUntilSettled", () => {
  it("polls a pending claim until it settles", async () => {
    const outcomes = [{ kind: "pending" }, { kind: "delivered" }] as const;
    let calls = 0;
    const result = await claimUntilSettled(
      () => Promise.resolve(outcomes[Math.min(calls++, 1)] ?? outcomes[1]),
      () => Promise.resolve(),
      () => 0,
    );
    expect(result).toEqual({ outcome: { kind: "delivered" }, polled: true });
  });

  it("stops polling after the time limit", async () => {
    let clock = 0;
    const result = await claimUntilSettled(
      () => Promise.resolve({ kind: "pending" } as const),
      () => {
        clock += pendingPollLimitMs;
        return Promise.resolve();
      },
      () => clock,
    );
    expect(result).toEqual({ outcome: { kind: "pending" }, polled: true });
  });
});
