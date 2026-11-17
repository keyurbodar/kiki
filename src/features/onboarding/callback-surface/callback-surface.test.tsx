import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CallbackSurface, callbackTitle } from "./callback-surface";

afterEach(cleanup);

const base = {
  icon: null,
  provider: "Linear",
  completingDescription: "Completing your workspace connection",
  returnHref: "/settings/integrations/linear",
};

describe("CallbackSurface", () => {
  it("titles every status", () => {
    expect(callbackTitle("completing", "Linear")).toBe("Connecting Linear");
    expect(callbackTitle("unknown_account", "Linear")).toBe(
      "Signed in to a different account",
    );
    expect(callbackTitle("returning", "Linear", "denied")).toBe(
      "Linear connection canceled",
    );
    expect(callbackTitle("returning", "Linear", "failed")).toBe(
      "Linear connection failed",
    );
    expect(callbackTitle("returning", "Linear", "connected")).toBe(
      "Linear connected",
    );
    expect(callbackTitle("failed", "Linear")).toBe("Linear connection failed");
  });

  it("shows a status indicator while completing", () => {
    render(<CallbackSurface {...base} status="completing" />);
    expect(screen.getByRole("status").getAttribute("aria-label")).toBe(
      "Connecting Linear",
    );
    expect(
      screen.getByText("Completing your workspace connection"),
    ).toBeTruthy();
  });

  it("links back to settings when it fails", () => {
    render(<CallbackSurface {...base} status="failed" />);
    const link = screen.getByRole("link", {
      name: "Return to Linear settings",
    });
    expect(link.getAttribute("href")).toBe("/settings/integrations/linear");
    expect(
      screen.getByText("Return to settings and try connecting again"),
    ).toBeTruthy();
  });

  it("offers to switch account for a different account", () => {
    render(<CallbackSurface {...base} status="unknown_account" />);
    expect(screen.getByRole("button", { name: "Switch account" })).toBeTruthy();
    expect(
      screen.getByText("A different account started this Linear connection"),
    ).toBeTruthy();
  });

  it("opens Capy when returning to the desktop app", () => {
    render(
      <CallbackSurface
        {...base}
        status="returning"
        outcome="connected"
        desktopHref="capy://app/settings/integrations/linear?linear=connected"
      />,
    );
    expect(
      screen.getByRole("link", { name: "Open Capy" }).getAttribute("href"),
    ).toBe("capy://app/settings/integrations/linear?linear=connected");
    expect(
      screen.getByText("Opening Capy, you can close this tab"),
    ).toBeTruthy();
  });
});
