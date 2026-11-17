import { describe, expect, it } from "vitest";
import { claimState } from "./claim-outcome";

describe("claimState", () => {
  it.each([
    [{ kind: "delivered" }, "granted"],
    [{ kind: "already_delivered" }, "granted"],
    [{ kind: "pending" }, "pending"],
    [{ kind: "already_claimed" }, "already_claimed"],
    [{ kind: "rejected", reason: "exhausted" }, "exhausted"],
    [{ kind: "rejected", reason: "already_redeemed" }, "already_claimed"],
    [{ kind: "rejected", reason: "invalid" }, "ineligible"],
    [{ kind: "ineligible", reason: "email" }, "email_mismatch"],
    [{ kind: "ineligible", reason: "claimed" }, "claimed"],
    [{ kind: "ineligible", reason: "membership" }, "ineligible"],
  ] as const)("maps %o to %s", (outcome, state) => {
    expect(claimState(outcome)).toBe(state);
  });
});
