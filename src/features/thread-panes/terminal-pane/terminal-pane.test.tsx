import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { TerminalPane } from "./terminal-pane";

afterEach(cleanup);

describe("TerminalPane", () => {
  it("renders the prompt in the terminal font", () => {
    const { container } = render(<TerminalPane threadId="jam_sample" />);
    const pane = container.querySelector("[data-slot=terminal-pane]");
    expect(pane).not.toBeNull();
    expect(pane?.className).toContain("--font-terminal");
    expect(
      container.querySelector("[data-slot=terminal-prompt]"),
    ).not.toBeNull();
  });

  it("says it has no session instead of pretending to be a shell", () => {
    render(<TerminalPane threadId="jam_sample" />);
    expect(
      screen.getByText(/No terminal session is attached to this thread/),
    ).toBeTruthy();
    expect(document.querySelector("input")).toBeNull();
    expect(document.querySelector("textarea")).toBeNull();
  });
});
