import { describe, expect, it } from "vitest";
import { cssLengthToPx } from "./wide-layout";

describe("cssLengthToPx", () => {
  it("scales rem by the root font size", () => {
    expect(cssLengthToPx(" 56rem", 16)).toBe(896);
  });

  it("passes plain lengths through and rejects empty values", () => {
    expect(cssLengthToPx("640", 16)).toBe(640);
    expect(cssLengthToPx("", 16)).toBeUndefined();
  });
});
