import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OtpInput } from "./otp-input";

afterEach(cleanup);

function Harness({ onComplete }: { onComplete: (code: string) => void }) {
  const [value, setValue] = useState("");
  return <OtpInput value={value} onChange={setValue} onComplete={onComplete} />;
}

describe("OtpInput", () => {
  it("keeps digits only, fills the cells and completes at full length", () => {
    const onComplete = vi.fn();
    const { container } = render(<Harness onComplete={onComplete} />);
    const input = screen.getByLabelText("One-time code") as HTMLInputElement;
    expect(input.closest('[data-slot="otp-input"]')).not.toBeNull();
    fireEvent.change(input, { target: { value: "12a3" } });
    expect(input.value).toBe("123");
    expect(onComplete).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: "1234567" } });
    expect(input.value).toBe("123456");
    expect(onComplete).toHaveBeenCalledWith("123456");
    const cells = container.querySelectorAll('[aria-hidden="true"] > div');
    expect(cells).toHaveLength(6);
    expect(cells[5]?.textContent).toBe("6");
  });

  it("marks the active cell while focused and flags invalid codes", () => {
    const { container } = render(
      <OtpInput value="12" onChange={() => {}} length={4} invalid />,
    );
    const input = screen.getByLabelText("One-time code");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    fireEvent.focus(input);
    const cells = container.querySelectorAll('[aria-hidden="true"] > div');
    expect(cells[2]?.hasAttribute("data-active")).toBe(true);
    expect(cells[0]?.className).toContain("border-destructive");
  });
});
