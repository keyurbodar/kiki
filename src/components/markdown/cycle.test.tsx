import { render } from "@testing-library/react";
import { useContext } from "react";
import { describe, expect, it } from "vitest";
import { defaultMarkdownComponents } from "./components";
import { MarkdownRenderContext } from "./render";

/**
 * Import order is the regression: this file imports ./components before
 * ./render, the same order the app's graph evaluates them in. While
 * components.tsx imported from markdown.tsx, that order left the context
 * default built from a half-initialised module and /thread/:id crashed with
 * "Cannot access 'defaultMarkdownComponents' before initialization".
 */
function ContextDefault() {
  const { plugins } = useContext(MarkdownRenderContext);
  return <output data-plugins={Object.keys(plugins).join(",")} />;
}

describe("markdown module initialisation order", () => {
  it("initialises the default components before render builds its context", () => {
    expect(defaultMarkdownComponents).toBeDefined();
    expect(defaultMarkdownComponents.gallery).toBeTypeOf("function");
    expect(defaultMarkdownComponents.video).toBeTypeOf("function");
    expect(defaultMarkdownComponents.mermaid).toBeTypeOf("function");

    const output = render(<ContextDefault />).container.querySelector("output");
    expect(output?.getAttribute("data-plugins")).toBe(
      Object.keys(defaultMarkdownComponents).join(","),
    );
  });
});
