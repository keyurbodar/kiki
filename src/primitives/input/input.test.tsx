import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Input, InputGroup, inputVariants } from "./input";

afterEach(cleanup);

describe("Input", () => {
  it("renders the input slot with Capy's defaults", () => {
    render(<Input aria-label="Name" />);
    const input = screen.getByLabelText("Name");
    expect(input.dataset.slot).toBe("input");
    expect(input.className).toContain("h-(--h-control-base)");
    expect(input.className).toContain("bg-input");
  });

  it("applies variant, size and font", () => {
    const classes = inputVariants({
      variant: "ghost",
      size: "xs",
      font: "mono",
    });
    expect(classes).toContain("field-sizing-content");
    expect(classes).toContain("h-(--h-control-xs)");
    expect(classes).toContain("font-mono");
  });

  it("wraps an icon in an input-group and pads the input", () => {
    render(
      <Input aria-label="Search" size="sm" icon={<svg data-testid="i" />} />,
    );
    const input = screen.getByLabelText("Search");
    expect(input.className).toContain("pl-7");
    const group = input.parentElement;
    expect(group?.dataset.slot).toBe("input-group");
    expect(screen.getByTestId("i").parentElement?.className).toContain(
      "left-2",
    );
  });

  it("reports typed values", () => {
    const onChange = vi.fn();
    render(<Input aria-label="Value" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Value"), {
      target: { value: "x" },
    });
    expect(onChange).toHaveBeenCalled();
  });

  it("renders InputGroup on its own", () => {
    render(<InputGroup data-testid="g" />);
    expect(screen.getByTestId("g").dataset.slot).toBe("input-group");
  });
});
