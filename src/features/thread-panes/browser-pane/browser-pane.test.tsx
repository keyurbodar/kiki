import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { BrowserPane } from "./browser-pane";

afterEach(cleanup);

describe("BrowserPane", () => {
  it("mounts the bar and omnibox Capy's browser pane carries", () => {
    const { container } = render(<BrowserPane threadId="jam_sample" />);
    const bar = container.querySelector("[data-slot=browser-bar]");
    expect(bar).not.toBeNull();
    expect(
      container.querySelector("[data-slot=browser-omnibox]"),
    ).not.toBeNull();
    expect(
      container.querySelector("[data-slot=browser-omnibox-input]"),
    ).not.toBeNull();
  });

  it("names every bar control in an aria-label", () => {
    render(<BrowserPane threadId="jam_sample" />);
    for (const label of [
      "Back",
      "Forward",
      "Reload",
      "Open externally",
      "Browser options",
    ])
      expect(screen.getByLabelText(label)).toBeTruthy();
    expect(screen.getByLabelText("Address")).toBeTruthy();
  });

  it("shows Capy's new-tab state, not a fabricated page", () => {
    const { container } = render(<BrowserPane threadId="jam_sample" />);
    expect(
      container.querySelector("[data-slot=browser-new-tab]"),
    ).not.toBeNull();
    expect(screen.getByText("New tab")).toBeTruthy();
    expect(screen.getByText("Type a URL, pick a port, or search")).toBeTruthy();
  });
});
