import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ProgressEdge } from "./progress-edge";

afterEach(cleanup);

const edge = (c: HTMLElement) =>
  c.querySelector<HTMLElement>('[data-slot="progress-edge"]');

describe("ProgressEdge", () => {
  it("sweeps and announces while active", () => {
    const { container } = render(<ProgressEdge label="Syncing" />);
    const el = edge(container);
    expect(el?.getAttribute("role")).toBe("status");
    expect(el?.getAttribute("aria-label")).toBe("Syncing");
    expect(el?.dataset.sweeping).toBe("true");
    expect(el?.dataset.active).toBe("true");
    expect(el?.className).toContain("progress-edge");
    expect(el?.className).toContain("opacity-100");
  });

  it("fades out, then stops the sweep after the opacity transition", () => {
    const { container, rerender } = render(<ProgressEdge />);
    rerender(<ProgressEdge active={false} />);
    const el = edge(container) as HTMLElement;
    expect(el.getAttribute("aria-hidden")).toBe("true");
    expect(el.className).toContain("opacity-0");
    expect(el.dataset.sweeping).toBe("true");
    const end = new Event("transitionend", { bubbles: true });
    Object.assign(end, { propertyName: "opacity" });
    fireEvent(el, end);
    expect(el.dataset.sweeping).toBeUndefined();
  });
});
