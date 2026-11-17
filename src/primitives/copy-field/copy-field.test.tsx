import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CopyField } from "./copy-field";

const writeText = vi.fn(() => Promise.resolve());

beforeEach(() => {
  writeText.mockClear();
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
});
afterEach(cleanup);

describe("CopyField", () => {
  it("shows the value read-only and copies it", async () => {
    render(<CopyField value="org_123" label="organization id" />);
    const input = screen.getByRole("textbox", { name: "organization id" });
    expect((input as HTMLInputElement).value).toBe("org_123");
    expect(input.hasAttribute("readonly")).toBe(true);
    expect(input.closest('[data-slot="copy-field"]')).not.toBeNull();
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Copy organization id" }),
      );
    });
    expect(writeText).toHaveBeenCalledWith("org_123");
    expect(screen.getByRole("button", { name: "Copied" })).toBeTruthy();
  });

  it("masks a secret until revealed", () => {
    render(<CopyField value="sk_live" label="API key" secret />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).not.toContain("sk_live");
    const reveal = screen.getByRole("button", { name: "Reveal API key" });
    expect(reveal.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(reveal);
    expect(input.value).toBe("sk_live");
    expect(
      screen
        .getByRole("button", { name: "Hide API key" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
  });
});
