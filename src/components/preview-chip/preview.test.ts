import { describe, expect, it } from "vitest";
import {
  namedPreviewState,
  previewHrefFromChecks,
  previewLabel,
  previewState,
  previewSummary,
} from "./preview";

const check = (
  name: string,
  conclusion: string | null,
  detailsUrl: string | null = null,
) => ({
  kind: "check" as const,
  name,
  conclusion,
  state: null,
  detailsUrl,
});

describe("preview chips", () => {
  it("rolls up deployment checks", () => {
    expect(previewState([check("Vercel: web", "success")])).toBe("ready");
    expect(previewState([check("Vercel: web", null)])).toBe("building");
    expect(previewState([check("Vercel: web", "failure")])).toBe("failed");
    expect(previewState([check("unit", "success")])).toBeNull();
    expect(namedPreviewState([check("Vercel: web", "success")], "web")).toBe(
      "ready",
    );
    expect(previewLabel("failed")).toBe("Preview failed");
  });

  it("prefers a direct deployment link over dashboards", () => {
    const checks = [
      check("Vercel: web", "success", "https://vercel.com/acme/web"),
      check("Cloudflare Pages", "success", "https://example.preview.capy.ai"),
    ];
    expect(previewHrefFromChecks(checks)).toBe(
      "https://example.preview.capy.ai",
    );
    const links = [
      { url: "https://example.preview.capy.ai", name: "web" },
      { url: "https://docs.preview.capy.ai", name: null },
    ];
    expect(previewSummary(checks, links).links).toHaveLength(2);
    expect(previewSummary(checks, links).href).toBe(links[0]?.url);
  });
});
