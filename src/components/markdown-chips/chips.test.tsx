import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, render } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { Markdown } from "@/components/markdown";
import {
  type MarkdownChipsContextValue,
  MarkdownChipsProvider,
} from "./context";
import { sampleChipsContext } from "./fixtures";

afterEach(cleanup);

async function renderWithRouter(ui: ReactNode) {
  const rootRoute = createRootRoute({ component: () => ui });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  await router.load();
  return render(<RouterProvider router={router} />).container;
}

const renderMarkdown = (
  text: string,
  context: MarkdownChipsContextValue = sampleChipsContext,
) =>
  renderWithRouter(
    <MarkdownChipsProvider value={context}>
      <Markdown text={text} />
    </MarkdownChipsProvider>,
  );

const owner = (root: Element, selector: string) =>
  root.querySelector(selector) as HTMLElement | null;

describe("markdown chips", () => {
  it("links a known pull ref with its state icon and a preview trigger", async () => {
    const root = await renderMarkdown("Shipped in #42.");
    const link = owner(root, 'a[href="/pull/acme/web/42"]');
    expect(link?.textContent).toBe("#42");
    expect(link?.getAttribute("data-slot")).toBe("preview-card-trigger");
    expect(
      link?.querySelector('[data-glyph="pull-request"]')?.getAttribute("class"),
    ).toContain("text-success");
  });

  it("falls back to a GitHub issue link for unknown refs", async () => {
    const root = await renderMarkdown("See acme/web#999.");
    expect(owner(root, "a")?.getAttribute("href")).toBe(
      "https://github.com/acme/web/issues/999",
    );
  });

  it("links thread codes in the same project and leaves unknown codes as text", async () => {
    const root = await renderMarkdown("Picked up from ACME-12 and ZED-1.");
    const link = owner(root, 'a[href="/thread/jam_sample_01"]');
    expect(link?.textContent).toBe("ACME-12");
    expect(root.textContent).toContain("ZED-1");
    expect(root.querySelectorAll("a")).toHaveLength(1);
  });

  it("links issues before threads", async () => {
    const root = await renderMarkdown("Tracked in ISS-4.");
    expect(owner(root, 'a[href="/issues/ISS-4"]')?.textContent).toBe("ISS-4");
  });

  it("renders subagent chips with their status", async () => {
    const root = await renderMarkdown("Subagent 3 is on it.");
    const chip = owner(root, '[data-slot="preview-card-trigger"]');
    expect(chip?.textContent).toBe("Subagent 3");
    expect(chip?.querySelector("svg")?.getAttribute("aria-label")).toBe(
      "Working",
    );
  });

  it("opens files from path chips", async () => {
    const opened: string[] = [];
    const root = await renderMarkdown("Edit src/app/main.tsx:12 now.", {
      ...sampleChipsContext,
      openFile: (path) => opened.push(path),
    });
    const chip = owner(root, '[role="button"]');
    expect(chip?.textContent).toBe("src/app/main.tsx:12");
    chip?.click();
    expect(opened).toEqual(["src/app/main.tsx"]);
  });

  it("renders everything as text when not interactive", async () => {
    const root = await renderMarkdown("ACME-12 shipped #42", {
      ...sampleChipsContext,
      interactive: false,
    });
    expect(root.querySelectorAll("a")).toHaveLength(0);
    expect(root.textContent).toContain("ACME-12 shipped #42");
  });

  it("marks GitHub pull links as pull chips", async () => {
    const root = await renderMarkdown(
      "[the fix](https://github.com/acme/api/pull/7)",
    );
    const link = owner(root, 'a[href="/pull/acme/api/7"]');
    expect(link?.textContent).toBe("the fix");
    expect(link?.querySelector('[data-glyph="shield-crossed"]')).not.toBeNull();
  });
});
