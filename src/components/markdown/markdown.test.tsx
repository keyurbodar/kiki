import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MarkdownComponentsProvider } from "./components";
import { Markdown } from "./markdown";

const html = (ui: Parameters<typeof render>[0]) => render(ui).container;

describe("Markdown", () => {
  it("renders the root with Capy's data attributes", () => {
    const root = html(
      <Markdown text="Hello" tone="muted" size="sm" weight="medium" />,
    ).firstElementChild;
    expect(root?.getAttribute("data-component")).toBe("markdown");
    expect(root?.getAttribute("data-tone")).toBe("muted");
    expect(root?.getAttribute("data-size")).toBe("sm");
    expect(root?.getAttribute("data-weight")).toBe("medium");
    expect(root?.querySelector("[data-markdown-block] p")?.textContent).toBe(
      "Hello",
    );
  });

  it("passes children through without text", () => {
    expect(html(<Markdown>plain</Markdown>).textContent).toBe("plain");
  });

  it("renders GFM tables inside markdown-table", () => {
    const root = html(<Markdown text={"| a | b |\n| - | - |\n| 1 | 2 |"} />);
    expect(
      root.querySelector('[data-slot="markdown-table"] > table td')
        ?.textContent,
    ).toBe("1");
  });

  it("renders task lists and strikethrough", () => {
    const root = html(<Markdown text={"- [x] done\n- [ ] ~~todo~~"} />);
    expect(root.querySelectorAll('input[type="checkbox"]')).toHaveLength(2);
    expect(root.querySelector("del")?.textContent).toBe("todo");
  });

  it("renders fenced code with the code header", () => {
    const root = html(<Markdown text={"```ts\nconst a = 1;\n```"} />);
    const block = root.querySelector('[data-component="markdown-code"]');
    expect(
      block?.querySelector('[data-slot="markdown-code-language"]')?.textContent,
    ).toBe("ts");
    expect(block?.querySelector("pre code")?.textContent).toBe("const a = 1;");
    expect(block?.querySelector('[aria-label="Copy code"]')).not.toBeNull();
    expect(block?.querySelector('[aria-label="Wrap lines"]')).not.toBeNull();
  });

  it("opens web links in a new tab, keeps other schemes, drops unparsable", () => {
    const root = html(
      <Markdown text="[ext](https://example.com) [mail](mailto:a@example.com) [rel](/threads)" />,
    );
    const [ext, mail] = root.querySelectorAll("a");
    expect(ext?.getAttribute("target")).toBe("_blank");
    expect(ext?.getAttribute("rel")).toBe("noopener noreferrer");
    expect(mail?.getAttribute("target")).toBeNull();
    expect(root.querySelectorAll("a")).toHaveLength(2);
    expect(root.querySelector('span[title="/threads"]')?.textContent).toBe(
      "rel",
    );
  });

  it("renders links as text when not interactive", () => {
    const root = html(
      <Markdown text="[ext](https://example.com)" interactive={false} />,
    );
    expect(root.querySelector("a")).toBeNull();
  });

  it("sanitizes raw HTML", () => {
    const root = html(
      <Markdown
        text={'<img src="x" onerror="alert(1)"><script>bad()</script>'}
      />,
    );
    expect(root.querySelector("script")).toBeNull();
    expect(root.querySelector("img")?.getAttribute("onerror")).toBeNull();
  });

  it("renders literal HTML as text", () => {
    const root = html(<Markdown text="a <b>bold</b>" literalHtml />);
    expect(root.querySelector("b")).toBeNull();
    expect(root.textContent).toContain("<b>bold</b>");
  });

  it("shows pending math while a $$ block streams", () => {
    const root = html(<Markdown text={"$$\nx^2"} streaming />);
    expect(root.querySelector("[data-math-pending]")).not.toBeNull();
  });

  it("routes mermaid and custom fences through the override hook", () => {
    const root = html(
      <MarkdownComponentsProvider
        value={{
          mermaid: ({ text }) => <div data-testid="mermaid">{text}</div>,
          fences: {
            chart: ({ text }) => <div data-testid="chart">{text}</div>,
          },
        }}
      >
        <Markdown text={"```mermaid\ngraph TD\n```\n\n```chart\n{}\n```"} />
      </MarkdownComponentsProvider>,
    );
    expect(root.querySelector('[data-testid="mermaid"]')?.textContent).toBe(
      "graph TD",
    );
    expect(root.querySelector('[data-testid="chart"]')?.textContent).toBe("{}");
  });

  it("routes data-chip spans to the chip component", () => {
    const root = html(
      <MarkdownComponentsProvider
        value={{
          chip: ({ kind, value }) => (
            <span data-testid="chip">{`${kind}:${value}`}</span>
          ),
          transforms: [
            (tree) => {
              tree.children.push({
                type: "element",
                tagName: "span",
                properties: { dataChip: "file", dataChipValue: "src/a.ts" },
                children: [],
              });
            },
          ],
        }}
      >
        <Markdown text="see" />
      </MarkdownComponentsProvider>,
    );
    expect(root.querySelector('[data-testid="chip"]')?.textContent).toBe(
      "file:src/a.ts",
    );
  });

  it("turns a bare video link into a video", () => {
    const root = html(<Markdown text="https://cdn.example.com/demo.mp4" />);
    expect(root.querySelector("video")?.getAttribute("src")).toBe(
      "https://cdn.example.com/demo.mp4",
    );
  });

  it("flattens code to inline code in the inline variant", () => {
    const root = html(<Markdown text={"```\nx\n```"} variant="inline" />);
    expect(root.querySelector("[data-markdown-inline-code]")?.textContent).toBe(
      "x",
    );
  });
});
