import { describe, expect, it } from "vitest";
import { minimumCompactAt, validateCompactAt } from "./compact-at-dialog";

describe("compact-at validation", () => {
  it("accepts an empty value as the default", () => {
    expect(validateCompactAt("", true, 200_000)).toEqual({ value: null });
  });

  it("accepts a value inside the user range", () => {
    expect(validateCompactAt("120,000", true, 200_000)).toEqual({
      value: 120_000,
    });
  });

  it("uses the org copy below the minimum", () => {
    const result = validateCompactAt("100", false, 200_000);
    expect(result.error).toBe(
      `Enter at least ${minimumCompactAt.toLocaleString("en-US")} tokens, or leave empty for the default`,
    );
  });

  it("uses the user copy above the context window", () => {
    const result = validateCompactAt("300,000", true, 200_000);
    expect(result.error).toBe(
      `Enter between 50,000 and 200,000 tokens, or leave empty for the default`,
    );
  });
});
