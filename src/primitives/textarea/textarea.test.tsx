import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Textarea } from "./textarea";

afterEach(cleanup);

describe("Textarea", () => {
  it("renders the textarea slot with the default variant", () => {
    render(<Textarea aria-label="Body" />);
    const el = screen.getByLabelText("Body");
    expect(el.dataset.slot).toBe("textarea");
    expect(el.className).toContain("bg-input");
  });

  it("applies the editor variant and base size", () => {
    render(<Textarea aria-label="Code" variant="editor" size="base" />);
    const el = screen.getByLabelText("Code");
    expect(el.className).toContain("text-code-block");
    expect(el.className).toContain("min-h-(--h-control-base)");
  });
});
