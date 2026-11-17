/// <reference types="node" />
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const html = readFileSync("index.html", "utf8");

/** `public/` is served from the build root, so a reference is `/brand/x` → `public/brand/x`. */
const publicPath = (href: string) => `public${href}`;

const brandHrefs = [
  ...html.matchAll(/<link\s+rel="(?:icon|apple-touch-icon)"[^>]*href="([^"]+)"/g),
].map((match) => match[1] ?? "");

const publicFiles = readdirSync("public/brand", { recursive: true, encoding: "utf8" })
  .map((path) => `/brand/${path.replaceAll("\\", "/")}`)
  .filter((path) => !path.endsWith("README.md"));

describe("brand files served from the public root", () => {
  it("links at least the svg favicon, the png favicon and the touch icon", () => {
    expect(brandHrefs).toEqual(
      expect.arrayContaining([
        "/brand/favicon.svg",
        "/brand/favicon.png",
        "/brand/apple-touch-icon.png",
      ]),
    );
  });

  it("has a file behind every brand link", () => {
    const missing = brandHrefs.filter((href) => !existsSync(publicPath(href)));
    expect(missing).toEqual([]);
  });

  it("leaves no brand file unreferenced", () => {
    const orphans = publicFiles.filter((path) => !brandHrefs.includes(path));
    expect(orphans).toEqual([]);
  });

  it("keeps Capy's share copy without a deployment origin", () => {
    expect(html).toContain('<meta name="description" content="Capy runs your coding agents in the cloud." />');
    expect(html).toContain('<meta property="og:image" content="https://capy.ai/social/og-image.png" />');
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image" />');
    expect(html).toContain('<meta name="theme-color" content="#09090a" />');
  });
});
