import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { clampZoom } from "@/components/pan-zoom/use-pan-zoom";
import {
  DiagramWindow,
  diagramHref,
  diagramWindowSize,
  extractMermaidBlocks,
  MarkdownMermaid,
  mermaidIndexOf,
  mermaidTitle,
} from "./mermaid";

afterEach(cleanup);

const fence = (body: string, lang = "mermaid") => ["```" + lang, body, "```"].join("\n");

describe("extractMermaidBlocks", () => {
  it("finds mermaid fences in order and ignores other languages", () => {
    const text = [
      "Intro",
      fence("graph TD\n  A --> B"),
      fence("const x = 1", "ts"),
      fence("sequenceDiagram\n  A->>B: hi", "mermaid title=x"),
    ].join("\n\n");
    expect(extractMermaidBlocks(text)).toEqual([
      "graph TD\n  A --> B",
      "sequenceDiagram\n  A->>B: hi",
    ]);
  });

  it("finds fences nested inside raw HTML", () => {
    const text = `<details>\n<summary>Diagram</summary>\n\n${fence("pie\n  \"a\": 1")}\n\n</details>`;
    expect(extractMermaidBlocks(text)).toEqual(['pie\n  "a": 1']);
  });

  it("indexes a block within its message", () => {
    const text = [fence("graph LR\n  A --> B"), fence("graph LR\n  C --> D")].join("\n\n");
    expect(mermaidIndexOf(text, "graph LR\n  C --> D")).toBe(1);
    expect(mermaidIndexOf(text, "graph LR\n  X --> Y")).toBeUndefined();
  });
});

describe("diagram window helpers", () => {
  it("builds the window href with an encoded message id", () => {
    expect(diagramHref("jam_1", "msg/1", 2)).toBe("/diagram/jam_1/msg%2F1/2");
  });

  it("sizes the popup around the diagram within screen bounds", () => {
    const screen = { availWidth: 2000, availHeight: 1000 };
    expect(diagramWindowSize(100, 100, screen)).toEqual({ width: 480, height: 360 });
    expect(diagramWindowSize(600, 400, screen)).toEqual({ width: 664, height: 504 });
    expect(diagramWindowSize(5000, 5000, screen)).toEqual({ width: 1200, height: 800 });
  });
});

describe("mermaidTitle", () => {
  it("prefers the front-matter title", () => {
    expect(mermaidTitle("---\ntitle: Deploy flow\n---\nflowchart LR\n  A --> B")).toBe(
      "Deploy flow",
    );
  });

  it("names the diagram kind, skipping comments", () => {
    expect(mermaidTitle("%% note\nsequenceDiagram\n  A->>B: x")).toBe("Sequence diagram");
    expect(mermaidTitle("graph TD\n  A --> B")).toBe("Flowchart");
  });

  it("falls back for unknown kinds", () => {
    expect(mermaidTitle("sankey-beta\n  a,b,1")).toBe("Mermaid diagram");
  });
});

describe("clampZoom", () => {
  it("keeps zoom between the bounds", () => {
    expect(clampZoom(0.1)).toBe(0.25);
    expect(clampZoom(10)).toBe(4);
    expect(clampZoom(1.5)).toBe(1.5);
  });
});

describe("MarkdownMermaid", () => {
  it("shows the source under a mermaid header until the diagram renders", () => {
    const { container } = render(<MarkdownMermaid text={"graph TD\n  A --> B"} complete />);
    expect(container.querySelector('[data-component="markdown-mermaid"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="markdown-code-language"]')?.textContent).toBe(
      "mermaid",
    );
    expect(container.querySelector("pre code")?.textContent).toBe("graph TD\n  A --> B");
    expect(screen.getByRole("button", { name: "Copy code" })).toBeTruthy();
  });
});

describe("DiagramWindow", () => {
  it("says when the message has no diagram at that index", () => {
    render(<DiagramWindow notFound threadTitle="Sample thread" />);
    expect(screen.getByText("Diagram not found")).toBeTruthy();
    expect(screen.getByText("Sample thread")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Open thread/ })).toBeTruthy();
  });
});
