import { describe, expect, it } from "vitest";
import { isEmailProgram, programSubscription } from "./email-programs";

describe("email programs", () => {
  it("recognises Capy's four programs only", () => {
    for (const program of [
      "product_news",
      "weekly",
      "onboarding",
      "win_back",
    ]) {
      expect(isEmailProgram(program)).toBe(true);
    }
    expect(isEmailProgram("toString")).toBe(false);
    expect(isEmailProgram("marketing")).toBe(false);
  });

  it("reads a program's subscription from the preferences", () => {
    const preferences = {
      programs: [
        { program: "weekly", subscribed: false },
        { program: "product_news", subscribed: true },
      ],
    };
    expect(programSubscription(preferences, "weekly")).toBe(false);
    expect(programSubscription(preferences, "product_news")).toBe(true);
    expect(programSubscription(preferences, "win_back")).toBeUndefined();
    expect(programSubscription({ programs: {} }, "weekly")).toBeUndefined();
  });
});
