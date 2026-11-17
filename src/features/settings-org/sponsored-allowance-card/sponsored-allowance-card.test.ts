import { describe, expect, it } from "vitest";
import {
  allowancePoolsLine,
  allowanceTitle,
  paidFallthroughLine,
} from "./sponsored-allowance-card";

const allowance = {
  id: "a",
  period: "month" as const,
  products: ["agent", "review"],
  amountCredits: 50000,
  usedCredits: 0,
  remainingCredits: 50000,
  resetAt: null,
  paidFallthrough: false,
};

describe("sponsored allowance copy", () => {
  it("titles an allowance by amount, period and products", () => {
    expect(allowanceTitle(allowance)).toBe(
      "$50 per month for Capy Agent and reviews",
    );
    expect(allowanceTitle({ ...allowance, products: ["review"] })).toBe(
      "$50 per month for reviews",
    );
  });

  it("describes how pools are charged", () => {
    expect(allowancePoolsLine([allowance])).toBe(
      "Capy Agent and reviews share one pool",
    );
    expect(allowancePoolsLine([allowance, allowance])).toBe(
      "Capy Agent and reviews draw from separate pools",
    );
    expect(allowancePoolsLine([{ ...allowance, products: ["agent"] }])).toBe(
      "Reviews are charged to paid credits",
    );
    expect(allowancePoolsLine([{ ...allowance, products: ["review"] }])).toBe(
      "Capy Agent is charged to paid credits",
    );
  });

  it("explains the paid fall-through switch", () => {
    expect(paidFallthroughLine(false, true)).toBe(
      "Covered work stops when its allowance is spent, until the next reset",
    );
    expect(paidFallthroughLine(true, false)).toBe(
      "Requires a plan or balance before covered work can continue",
    );
  });
});
