import { describe, expect, it } from "vitest";
import { themeFromListing } from "./theme-from-listing";

const listing = {
  light: {
    "--bg": "#eef1f6",
    "--fg": "#4a5068",
    "--text": "#4a5068",
    "--primary": "#6a5ae0",
    "--primary-text": "#ffffff",
    "--shader-ink": "#6a5ae0",
    "--text-link": "#2b73d5",
  },
  dark: {
    "--bg": "#0a0b1e",
    "--fg": "#d2daf6",
    "--text": "#d2daf6",
    "--primary": "#a99cf5",
    "--primary-text": "#14142e",
    "--shader-ink": "#a99cf5",
    "--input": "var(--card)",
  },
  appearance: { effect: "grain" },
};

describe("themeFromListing", () => {
  it("turns a listing palette into a user theme", () => {
    const theme = themeFromListing(listing);
    expect(theme?.light.background).toEqual({
      kind: "literal",
      hex: "#eef1f6",
    });
    expect(theme?.light.accent).toEqual({ kind: "literal", hex: "#6a5ae0" });
    expect(theme?.dark.input).toEqual({ kind: "reference", field: "card" });
    expect(theme?.effect).toBe("grain");
  });

  it("falls back to dither when the listing names no known effect", () => {
    const theme = themeFromListing({ ...listing, appearance: {} });
    expect(theme?.effect).toBe("dither");
  });

  it("refuses a palette missing a required colour", () => {
    const dark = { ...listing.dark };
    expect(
      themeFromListing({
        light: listing.light,
        dark: Object.fromEntries(
          Object.entries(dark).filter(([name]) => name !== "--primary"),
        ),
      }),
    ).toBeUndefined();
  });
});
