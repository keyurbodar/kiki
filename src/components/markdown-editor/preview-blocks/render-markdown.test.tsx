import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderMarkdown } from "./render-markdown";

const html = (source: string) =>
  render(<div>{renderMarkdown(source)}</div>).container;

describe("renderMarkdown", () => {
  it("strips scripts, event handlers, javascript links and iframes", () => {
    const container = html(
      [
        "<script>window.pwned = true</script>",
        '<img src="https://example.com/a.png" onerror="window.pwned = true">',
        '<iframe srcdoc="<script>parent.pwned = true</script>"></iframe>',
        '<a href="javascript:alert(1)">bad</a>',
        '<div onclick="window.pwned = true">kept text</div>',
      ].join("\n\n"),
    );
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("iframe")).toBeNull();
    expect(container.querySelector("[srcdoc]")).toBeNull();
    expect(container.querySelector("[onerror], [onclick]")).toBeNull();
    expect(
      container.querySelector("a")?.getAttribute("href") ?? null,
    ).toBeNull();
    expect(container.textContent).toContain("kept text");
    expect(container.innerHTML).not.toContain("pwned");
  });

  it("still renders math and footnotes", () => {
    const container = html("$$\nx^2\n$$\n\nText[^1]\n\n[^1]: Note");
    expect(container.querySelector(".katex")).not.toBeNull();
    expect(container.querySelector("section[data-footnotes]")).not.toBeNull();
  });
});
