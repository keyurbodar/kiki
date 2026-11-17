import { describe, expect, it } from "vitest";
import {
  ARTIFACT_CSP,
  bridgeScript,
  buildArtifactDocument,
  decodeArtifactMessage,
  detectTheme,
  standaloneDocument,
  tokenRule,
  webUrl,
} from "./bridge";

describe("decodeArtifactMessage", () => {
  it("accepts well-formed messages", () => {
    expect(
      decodeArtifactMessage({
        type: "capy-artifact-layout",
        top: 0,
        height: 10,
      }),
    ).toEqual({
      type: "capy-artifact-layout",
      top: 0,
      height: 10,
    });
    expect(
      decodeArtifactMessage({
        type: "capy-artifact-storage",
        values: { a: "1" },
      }),
    ).toEqual({
      type: "capy-artifact-storage",
      values: { a: "1" },
    });
    expect(
      decodeArtifactMessage({
        type: "capy-artifact-link-menu",
        url: "https://example.com",
        x: 1,
        y: 2,
      }),
    ).toBeDefined();
  });

  it("rejects malformed messages", () => {
    expect(
      decodeArtifactMessage({
        type: "capy-artifact-storage",
        values: { a: 1 },
      }),
    ).toBeUndefined();
    expect(
      decodeArtifactMessage({ type: "capy-artifact-link" }),
    ).toBeUndefined();
    expect(decodeArtifactMessage({ type: "other" })).toBeUndefined();
    expect(decodeArtifactMessage("capy-artifact-link")).toBeUndefined();
  });
});

describe("detectTheme", () => {
  it("leaves documents without theme selectors alone", () => {
    expect(detectTheme("<p>hi</p>", true)).toEqual({
      theme: undefined,
      inherits: true,
      source: "<p>hi</p>",
    });
  });

  it("inherits the app theme when the html tag has no data-theme", () => {
    const html = '<html lang="en"><style>[data-theme=dark] p{}</style></html>';
    const result = detectTheme(html, true);
    expect(result.theme).toBe("dark");
    expect(result.inherits).toBe(true);
    expect(result.source.startsWith('<html data-theme="dark" lang="en">')).toBe(
      true,
    );
  });

  it("keeps a declared theme", () => {
    const html =
      '<html data-theme="light"><style>[data-theme] p{}</style></html>';
    expect(detectTheme(html, true)).toEqual({
      theme: "light",
      inherits: false,
      source: html,
    });
  });
});

describe("artifact documents", () => {
  it("keeps only capy tokens and strips unsafe characters", () => {
    expect(tokenRule({ "--capy-bg": "red;}", "--other": "x" })).toBe(
      ":root{--capy-bg:red}",
    );
  });

  it("wraps the html with the CSP, theme and bridge", () => {
    const document = buildArtifactDocument({
      html: "<!DOCTYPE html><p>hi</p>",
      theme: "dark",
      host: "<style></style>",
      values: { note: "</script>" },
    });
    expect(document).toContain(ARTIFACT_CSP);
    expect(document).toContain('<meta name="color-scheme" content="dark">');
    expect(document.endsWith("<p>hi</p>")).toBe(true);
    expect(document.match(/<\/script>/g)).toHaveLength(1);
  });

  it("produces a bridge script that parses", () => {
    expect(() => new Function(bridgeScript({ a: "1" }))).not.toThrow();
  });

  it("escapes the standalone srcdoc", () => {
    expect(standaloneDocument('<p class="a">&</p>')).toContain(
      'srcdoc="&lt;p class=&quot;a&quot;>&amp;&lt;/p>"',
    );
  });

  it("only opens web urls", () => {
    expect(webUrl("https://example.com/a")).toBe("https://example.com/a");
    expect(webUrl("javascript:alert(1)")).toBeUndefined();
  });
});
