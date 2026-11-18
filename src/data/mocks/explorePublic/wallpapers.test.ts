import { describe, expect, it } from "vitest";
import { WALLPAPERS, wallpaperAsset } from "@/assets/wallpapers";
import { themeListings } from "./themes.ts";

describe("theme wallpapers", () => {
  it("bundles a file for every listing that declares one", () => {
    const declared = themeListings.flatMap((listing) =>
      listing.theme.wallpaper === undefined ? [] : [listing.slug],
    );
    expect(declared.length).toBeGreaterThan(0);
    for (const slug of declared) expect(wallpaperAsset(slug)).toBeDefined();
  });

  it("carries Capy's digest for each file, and nothing for a theme without one", () => {
    for (const [slug, wallpaper] of Object.entries(WALLPAPERS)) {
      expect(wallpaper.digest, slug).toMatch(/^[0-9a-f]{64}$/);
      expect(wallpaper.url, slug).not.toBe("");
    }
    const withoutWallpaper = themeListings.filter(
      (listing) => listing.theme.wallpaper === undefined,
    );
    for (const listing of withoutWallpaper)
      expect(wallpaperAsset(listing.slug)).toBeUndefined();
  });
});
