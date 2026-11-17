import { describe, expect, it } from "vitest";
import { buttonIntentVariants, intents, intentVariants } from "./intent";

describe("intent", () => {
  it("covers every intent in both maps", () => {
    for (const intent of intents) {
      expect(typeof intentVariants[intent]).toBe("string");
      expect(typeof buttonIntentVariants[intent]).toBe("string");
    }
    expect(intentVariants.neutral).toBe("");
    expect(buttonIntentVariants.accent).toContain("--intent-bg-soft");
  });
});
