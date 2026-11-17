import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
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

describe("Input parity with Capy's bundle", () => {
  it("carries every base class Capy's cva declares", () => {
    const classes = inputVariants({});
    for (const cls of [
      "w-full",
      "min-w-0",
      "rounded",
      "text-sm",
      "font-normal",
      "text-foreground",
      "placeholder:text-muted-foreground-3",
      "selection:bg-primary-20",
      "outline-none",
      "disabled:cursor-not-allowed",
      "disabled:opacity-55",
      "aria-invalid:border-destructive",
    ])
      expect(classes).toContain(cls);
  });

  it("matches each variant's border and surface", () => {
    expect(inputVariants({ variant: "default" })).toContain(
      "border-border-2 focus-visible:outline-ring-inset",
    );
    expect(inputVariants({ variant: "blank" })).toContain(
      "bg-transparent border-0",
    );
    expect(inputVariants({ variant: "ghost" })).toContain(
      "w-auto field-sizing-content text-ellipsis",
    );
    expect(inputVariants({ variant: "ghost" })).toContain(
      "hover:border-border-2 hover:bg-input",
    );
    expect(inputVariants({ variant: "ghost" })).toContain(
      "placeholder:text-foreground",
    );
  });

  it("maps every size to its control height and padding", () => {
    expect(inputVariants({ size: "xs" })).toContain(
      "h-(--h-control-xs) px-1.5 text-xs",
    );
    expect(inputVariants({ size: "sm" })).toContain(
      "h-(--h-control-sm) px-2",
    );
    expect(inputVariants({ size: "base" })).toContain(
      "h-(--h-control-base) px-2.5",
    );
  });

  it("adds only the font class a font asks for", () => {
    expect(inputVariants({ font: "sans" })).not.toContain("font-mono");
    expect(inputVariants({ font: "mono" })).toContain("font-mono text-xs");
    expect(inputVariants({ font: "numeric" })).toContain("tabular-nums");
  });

  it("leaves the input unwrapped when it has no icon", () => {
    render(<Input aria-label="Plain" />);
    const input = screen.getByLabelText("Plain");
    expect(input.parentElement?.dataset.slot).not.toBe("input-group");
    expect(input.className).not.toContain("pl-8");
  });

  it("offsets the icon for the base size", () => {
    render(<Input aria-label="Base" icon={<svg data-testid="i" />} />);
    expect(screen.getByLabelText("Base").className).toContain("pl-8");
    const marker = screen.getByTestId("i").parentElement;
    expect(marker?.className).toContain("left-2.5");
    expect(marker?.getAttribute("aria-hidden")).toBe("true");
  });

  it("merges the icon wrapper class name onto the group", () => {
    render(
      <Input
        aria-label="Wrapped"
        icon={<svg />}
        wrapperClassName="max-w-64"
      />,
    );
    const group = screen.getByLabelText("Wrapped").parentElement;
    expect(group?.className).toContain("relative inline-flex w-full");
    expect(group?.className).toContain("max-w-64");
  });

  it("forwards refs and native input attributes", () => {
    const ref = createRef<HTMLInputElement>();
    render(
      <Input
        ref={ref}
        aria-label="Native"
        type="search"
        disabled
        aria-invalid
        placeholder="Find"
      />,
    );
    const input = screen.getByLabelText("Native");
    expect(ref.current).toBe(input);
    expect(input.getAttribute("type")).toBe("search");
    expect((input as HTMLInputElement).disabled).toBe(true);
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("placeholder")).toBe("Find");
  });

  it("keeps a class name passed to InputGroup", () => {
    render(<InputGroup className="gap-1" data-testid="g" />);
    const group = screen.getByTestId("g");
    expect(group.className).toContain("relative inline-flex w-full");
    expect(group.className).toContain("gap-1");
  });
});
