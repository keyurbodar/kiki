import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { InheritedNumber, parseInheritedNumber } from "./inherited-number";

afterEach(cleanup);

const edit = () => {
  fireEvent.click(screen.getByRole("button", { name: "Seats" }));
  return screen.getByRole("spinbutton", { name: "Seats" });
};

describe("parseInheritedNumber", () => {
  it("accepts whole numbers in range only", () => {
    expect(parseInheritedNumber("4", 1, 10)).toBe(4);
    expect(parseInheritedNumber("0", 1, 10)).toBeUndefined();
    expect(parseInheritedNumber("11", 1, 10)).toBeUndefined();
    expect(parseInheritedNumber("2.5", 1, 10)).toBeUndefined();
    expect(parseInheritedNumber("x", 1, 10)).toBeUndefined();
  });
});

describe("InheritedNumber", () => {
  it("shows the inherited value with its tag until edited", () => {
    render(
      <InheritedNumber
        aria-label="Seats"
        value={undefined}
        inherited={3}
        max={10}
        onChange={() => {}}
      />,
    );
    const button = screen.getByRole("button", { name: "Seats" });
    expect(button.textContent).toBe("3Org");
    expect(button.querySelector('[data-icon="edit-small-1"]')).not.toBeNull();
  });

  it("commits a new value on Enter", () => {
    const onChange = vi.fn();
    render(
      <InheritedNumber
        aria-label="Seats"
        value={undefined}
        inherited={3}
        max={10}
        onChange={onChange}
      />,
    );
    const input = edit();
    fireEvent.change(input, { target: { value: "7" } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith(7);
  });

  it("maps the inherited value back to undefined and skips no-op commits", () => {
    const onChange = vi.fn();
    render(
      <InheritedNumber
        aria-label="Seats"
        value={5}
        inherited={3}
        max={10}
        onChange={onChange}
      />,
    );
    const input = screen.getByRole("spinbutton", { name: "Seats" });
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "5" } });
    fireEvent.blur(input);
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "3" } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it("discards the draft on Escape", () => {
    const onChange = vi.fn();
    render(
      <InheritedNumber
        aria-label="Seats"
        value={4}
        inherited={3}
        max={10}
        onChange={onChange}
      />,
    );
    const input = screen.getByRole("spinbutton", {
      name: "Seats",
    }) as HTMLInputElement;
    input.focus();
    fireEvent.change(input, { target: { value: "9" } });
    fireEvent.keyDown(input, { key: "Escape" });
    expect(onChange).not.toHaveBeenCalled();
    expect(input.value).toBe("4");
  });

  it("reverts an out-of-range draft without reporting it", () => {
    const onChange = vi.fn();
    render(
      <InheritedNumber
        aria-label="Seats"
        value={4}
        inherited={3}
        max={10}
        onChange={onChange}
      />,
    );
    const input = screen.getByRole("spinbutton", {
      name: "Seats",
    }) as HTMLInputElement;
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "42" } });
    fireEvent.blur(input);
    expect(onChange).not.toHaveBeenCalled();
    expect(input.value).toBe("4");
  });

  it("resets to the inherited value from the reset button", () => {
    const onChange = vi.fn();
    render(
      <InheritedNumber
        aria-label="Seats"
        value={6}
        inherited={3}
        max={10}
        onChange={onChange}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Use org default (3)" }),
    );
    expect(onChange).toHaveBeenCalledWith(undefined);
    expect(screen.getByRole("button", { name: "Seats" }).textContent).toBe(
      "3Org",
    );
  });

  it("keeps the optimistic value while saving and drops it after", () => {
    const { rerender } = render(
      <InheritedNumber
        aria-label="Seats"
        value={undefined}
        inherited={3}
        max={10}
        saving
        onChange={() => {}}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Seats" }).hasAttribute("disabled"),
    ).toBe(true);
    rerender(
      <InheritedNumber
        aria-label="Seats"
        value={8}
        inherited={3}
        max={10}
        onChange={() => {}}
      />,
    );
    expect(
      (screen.getByRole("spinbutton", { name: "Seats" }) as HTMLInputElement)
        .value,
    ).toBe("8");
  });
});
