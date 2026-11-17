import { describe, expect, it } from "vitest";
import { dealTitle } from "./model";

describe("dealTitle", () => {
  it("names a free trial", () => {
    expect(
      dealTitle({ code: "ACME14", trialDays: 14, introPriceCents: 0 }),
    ).toBe("ACME14 free for 14 days");
  });

  it("names an intro price", () => {
    expect(
      dealTitle({ code: "ACME14", trialDays: 14, introPriceCents: 1200 }),
    ).toBe("ACME14 for $12.00");
  });

  it("has nothing to say without a recipient", () => {
    expect(dealTitle(undefined)).toBeUndefined();
  });
});
