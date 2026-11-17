import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CodeField, sanitizeCode } from "./code-field";

afterEach(cleanup);

describe("CodeField", () => {
  it("renders OtpInput with the current value", () => {
    render(<CodeField value="123" onChange={() => {}} onComplete={() => {}} />);
    const input = screen.getByLabelText<HTMLInputElement>("One-time code");
    expect(input.value).toBe("123");
  });

  it("reports sanitized input and a completed code", () => {
    const onChange = vi.fn();
    const onComplete = vi.fn();
    render(<CodeField value="" onChange={onChange} onComplete={onComplete} />);
    const input = screen.getByLabelText("One-time code");
    fireEvent.change(input, { target: { value: "12ab34" } });
    expect(onChange).toHaveBeenLastCalledWith("1234");
    fireEvent.change(input, { target: { value: "123456" } });
    expect(onChange).toHaveBeenLastCalledWith("123456");
    expect(onComplete).toHaveBeenCalledWith("123456");
  });

  it("strips non-digits past the code length", () => {
    expect(sanitizeCode("12-34 56789")).toBe("123456");
  });
});
