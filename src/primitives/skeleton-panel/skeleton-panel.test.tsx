import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SkeletonPanel, SkeletonPulse } from "./skeleton-panel";

afterEach(cleanup);

describe("SkeletonPanel", () => {
  it("announces a polite status and hides the placeholder shapes", () => {
    const { container } = render(
      <SkeletonPanel className="flex">
        <i>bar</i>
      </SkeletonPanel>,
    );
    const panel = container.querySelector('[data-slot="skeleton-panel"]');
    expect(panel?.className).toBe("flex");
    const status = screen.getByRole("status");
    expect(status.textContent).toBe("Loading");
    expect(status.getAttribute("aria-busy")).toBe("true");
    expect(status.getAttribute("aria-live")).toBe("polite");
    expect(
      screen.getByText("bar").parentElement?.getAttribute("aria-hidden"),
    ).toBe("true");
  });

  it("announces the label it is given", () => {
    render(<SkeletonPanel label="Loading messages" />);
    expect(screen.getByRole("status").textContent).toBe("Loading messages");
  });

  it("SkeletonPulse delays its reveal and pulses its children", () => {
    const { container } = render(
      <SkeletonPulse label="Loading diff">
        <i>row</i>
      </SkeletonPulse>,
    );
    const panel = container.querySelector('[data-slot="skeleton-panel"]');
    expect(panel?.className).toContain("delay-preview");
    expect(panel?.className).toContain("starting:opacity-0");
    expect(screen.getByRole("status").textContent).toBe("Loading diff");
    expect(screen.getByText("row").parentElement?.className).toContain(
      "animate-skeleton-pulse",
    );
  });
});
