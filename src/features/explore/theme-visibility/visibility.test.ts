import { describe, expect, it } from "vitest";
import {
  errorMessage,
  VISIBILITY_ERROR,
  visibilityLabel,
  visibilityToast,
} from "./visibility";

describe("theme visibility copy", () => {
  it("offers the opposite of the current state", () => {
    expect(visibilityLabel(false)).toBe("Hide from Explore");
    expect(visibilityLabel(true)).toBe("Show in Explore");
  });

  it("confirms the change", () => {
    expect(visibilityToast(false)).toBe("Hidden from Explore");
    expect(visibilityToast(true)).toBe("Shown in Explore again");
  });

  it("prefers the server message and falls back to Capy's copy", () => {
    expect(errorMessage({ message: "Not allowed" }, VISIBILITY_ERROR)).toBe(
      "Not allowed",
    );
    expect(errorMessage({ _tag: "Unknown" }, VISIBILITY_ERROR)).toBe(
      "Could not change the theme's visibility",
    );
  });
});
