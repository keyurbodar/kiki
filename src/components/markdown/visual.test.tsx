import { describe, expect, it } from "vitest";
import { buildVisualDocument, VISUAL_CSP } from "./visual";
import { visualKit } from "./visual-kit";

describe("buildVisualDocument", () => {
  const doc = buildVisualDocument({
    id: "call_1",
    html: "<p>Hello</p>",
    title: 'Revenue "by" <region>',
    theme: "dark",
    tokens: { "--text": "white", "--chart-1": "teal;}" },
    layout: { "--visual-space-1": "4px" },
    min: 48,
    max: 1200,
    kit: "/*kit*/",
  });

  it("opens with the sandbox head Capy's host writes", () => {
    expect(doc.startsWith('<!doctype html>\n<html lang="en" data-skin="web" data-theme="dark" class="dark">')).toBe(true);
    expect(doc).toContain(`content="${VISUAL_CSP}"`);
    expect(doc).toContain("<script>/*kit*/</script>");
  });

  it("escapes the title into visual-head and strips unsafe token characters", () => {
    expect(doc).toContain('<visual-head label="Revenue &quot;by&quot; &lt;region>"></visual-head>');
    expect(doc).toContain("--chart-1:teal");
    expect(doc).not.toContain("teal;}");
  });

  it("reports the line offset of the agent's HTML to the bridge", () => {
    const offset = Number(doc.match(/"offset":\s*(\d+)/)?.[1]);
    const lines = doc.split("\n");
    expect(lines[offset]).toBe("<p>Hello</p>");
  });
});

describe("visualKit", () => {
  it("exposes the visual API and wires app-tabs to state", async () => {
    visualKit();
    const visual = Reflect.get(window, "visual") as {
      get: (n: string) => unknown;
      set: (n: string, v: unknown) => void;
      on: (e: string, l: (s: Record<string, unknown>, n: string) => void) => () => void;
      color: (i: number) => string;
      state: Record<string, unknown>;
    };
    expect(visual.color(0)).toBe("var(--chart-1)");
    expect(visual.color(9)).toBe("var(--chart-2)");

    const tabs = document.createElement("app-tabs");
    tabs.setAttribute("name", "view");
    tabs.setAttribute("options", '["A","B"]');
    document.body.append(tabs);
    expect(visual.get("view")).toBe("A");

    const changes: string[] = [];
    visual.on("change", (state, name) => changes.push(`${name}=${String(state[name])}`));
    const buttons = tabs.shadowRoot?.querySelectorAll("button") ?? [];
    expect(buttons.length).toBe(2);
    (buttons[1] as HTMLButtonElement).click();
    await Promise.resolve();
    expect(visual.get("view")).toBe("B");
    expect(changes).toEqual(["view=B"]);
    expect(tabs.shadowRoot?.querySelector('[aria-pressed="true"]')?.textContent).toBe("B");
  });
});
