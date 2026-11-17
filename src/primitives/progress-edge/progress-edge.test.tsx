import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProgressEdge } from "./progress-edge";

afterEach(cleanup);

const edge = (c: HTMLElement) =>
  c.querySelector<HTMLElement>('[data-slot="progress-edge"]');

const transitionEnd = (propertyName: string) => {
  const event = new Event("transitionend", { bubbles: true });
  Object.assign(event, { propertyName });
  return event;
};

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
    expect(el?.style.transitionDelay).toBe("");
  });

  it("fades out, then stops the sweep after the opacity transition", () => {
    const { container, rerender } = render(<ProgressEdge />);
    rerender(<ProgressEdge active={false} />);
    const el = edge(container) as HTMLElement;
    expect(el.getAttribute("aria-hidden")).toBe("true");
    expect(el.className).toContain("opacity-0");
    expect(el.style.transitionDelay).toBe("var(--duration-fast)");
    expect(el.dataset.sweeping).toBe("true");
    fireEvent(el, transitionEnd("opacity"));
    expect(el.dataset.sweeping).toBeUndefined();
  });

  it("keeps the sweep running past a transition that is not its own", () => {
    const { container, rerender } = render(<ProgressEdge />);
    rerender(<ProgressEdge active={false} />);
    const el = edge(container) as HTMLElement;
    fireEvent(el, transitionEnd("background-color"));
    expect(el.dataset.sweeping).toBe("true");
  });

  it("runs a caller's onTransitionEnd beside its own cleanup", () => {
    const onTransitionEnd = vi.fn();
    const { container } = render(
      <ProgressEdge active={false} onTransitionEnd={onTransitionEnd} />,
    );
    const el = edge(container) as HTMLElement;
    fireEvent(el, transitionEnd("opacity"));
    expect(onTransitionEnd).toHaveBeenCalledTimes(1);
    expect(el.dataset.sweeping).toBeUndefined();
  });

  it("takes a caller's className and older browsers' no-op role", () => {
    const { container } = render(<ProgressEdge active={false} className="x" />);
    const el = edge(container) as HTMLElement;
    expect(el.classList.contains("x")).toBe(true);
    expect(el.getAttribute("role")).toBeNull();
    expect(el.getAttribute("aria-label")).toBeNull();
  });
});
