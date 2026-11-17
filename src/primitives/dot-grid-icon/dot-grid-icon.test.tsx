import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DotGridIcon, dotGridIconVariants } from "./dot-grid-icon";

type Frames = Array<{ offset?: number; opacity: number; easing?: string }>;
type Options = { duration: number; delay: number; iterations: number };

const cancel = vi.fn();
const animate = vi.fn(() => {
  let reject: (reason: unknown) => void = () => {};
  const finished = new Promise<Animation>((_, r) => {
    reject = r;
  });
  return {
    finished,
    play() {},
    pause() {},
    cancel() {
      cancel();
      reject(new DOMException("The user aborted a request.", "AbortError"));
    },
  } as unknown as Animation;
});

const calls = () => animate.mock.calls as unknown as Array<[Frames, Options]>;

const reducedMotion = (matches: boolean) =>
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) =>
      ({
        matches,
        media: query,
        onchange: null,
        addEventListener() {},
        removeEventListener() {},
        addListener() {},
        removeListener() {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList,
  );

beforeEach(() => {
  animate.mockClear();
  cancel.mockClear();
  Element.prototype.animate = animate;
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("DotGridIcon", () => {
  it("renders Capy's 3x3 dot grid with the status role and label", () => {
    render(<DotGridIcon label="Cloning" />);
    const svg = screen.getByRole("status", { name: "Cloning" });
    expect(svg.dataset.slot).toBe("dot-grid-icon");
    expect(svg.dataset.state).toBe("working");
    expect(svg.getAttribute("viewBox")).toBe("0 0 14 14");
    expect(svg.querySelectorAll("[data-dot]")).toHaveLength(9);
    expect(svg.querySelectorAll("[data-ring]")).toHaveLength(8);
    expect(svg.querySelectorAll('[data-row="middle"]')).toHaveLength(3);
    for (const dot of svg.querySelectorAll("[data-dot]"))
      expect(dot.getAttribute("r")).toBe("1");
    expect(animate).toHaveBeenCalledTimes(8);
  });

  it("animates only the middle row while waiting", () => {
    render(<DotGridIcon state="waiting" />);
    expect(animate).toHaveBeenCalledTimes(3);
  });

  it("paces the working ring with Capy's keyframes and ring stagger", () => {
    render(<DotGridIcon />);
    const frames = calls()[0]?.[0];
    expect(frames?.map(({ offset }) => offset)).toEqual([
      0, 0.125, 0.25, 0.375, 0.875, 1,
    ]);
    expect(frames?.map(({ opacity }) => opacity)).toEqual([
      1, 0.7, 0.45, 0.25, 0.25, 1,
    ]);
    expect(calls().map(([, o]) => o.duration)).toEqual(Array(8).fill(800));
    expect(calls().map(([, o]) => o.delay)).toEqual([
      -800, -700, -600, -500, -400, -300, -200, -100,
    ]);
  });

  it("walks the waiting dots left to right", () => {
    render(<DotGridIcon state="waiting" />);
    expect(calls().map(([f]) => f.map(({ opacity }) => opacity))).toEqual([
      [0.35, 1, 0.35],
      [0.35, 1, 0.35],
      [0.35, 1, 0.35],
    ]);
    expect(calls().map(([, o]) => o.duration)).toEqual(Array(3).fill(1600));
    expect(
      calls()
        .map(([, o]) => o.delay)
        .sort((a, b) => a - b),
    ).toEqual([-1600, -1400, -1200]);
  });

  it("lights the attention tiers for needs-you and failed", () => {
    for (const state of ["needs-you", "failed"] as const) {
      animate.mockClear();
      const { unmount } = render(<DotGridIcon state={state} />);
      expect(calls()).toHaveLength(9);
      expect(new Set(calls().map(([, o]) => o.duration))).toEqual(
        new Set([1400]),
      );
      expect(new Set(calls().map(([, o]) => o.delay))).toEqual(new Set([0]));
      expect(
        calls()
          .map(([f]) => f.length)
          .sort(),
      ).toEqual([4, 6, 6, 6, 6, 6, 6, 6, 6]);
      const centre = calls().find(([f]) => f.length === 4)?.[0];
      expect(centre?.map(({ opacity }) => opacity)).toEqual([0.25, 1, 1, 0.25]);
      unmount();
    }
  });

  it("pulses the whole icon once under reduced motion", () => {
    reducedMotion(true);
    render(<DotGridIcon />);
    expect(animate).toHaveBeenCalledTimes(1);
    const [frames, options] = calls()[0] ?? [];
    expect(frames?.map(({ opacity }) => opacity)).toEqual([0.55, 1, 0.55]);
    expect(typeof frames?.[0]?.offset).toBe("undefined");
    expect(options).toEqual({
      duration: 2000,
      iterations: Number.POSITIVE_INFINITY,
    });
  });

  it("leaves the attention states to the stylesheet under reduced motion", () => {
    reducedMotion(true);
    render(<DotGridIcon state="failed" />);
    expect(animate).not.toHaveBeenCalled();
  });

  it("cancels the running animations when the state changes", () => {
    const { rerender } = render(<DotGridIcon />);
    rerender(<DotGridIcon state="waiting" />);
    expect(cancel).toHaveBeenCalledTimes(8);
    animate.mockClear();
    rerender(<DotGridIcon state="needs-you" />);
    expect(animate).toHaveBeenCalledTimes(9);
  });

  it("applies size variants", () => {
    expect(dotGridIconVariants()).toBe("dot-grid shrink-0 size-(--icon-base)");
    expect(dotGridIconVariants({ size: "xs" })).toContain("size-(--icon-xs)");
    expect(dotGridIconVariants({ size: "inherit" })).toBe("dot-grid shrink-0");
  });

  it("passes state, role and className through", () => {
    render(
      <DotGridIcon state="waiting" role="img" label="Waiting" className="x" />,
    );
    const svg = screen.getByRole("img", { name: "Waiting" });
    expect(svg.dataset.state).toBe("waiting");
    expect(svg.classList.contains("x")).toBe(true);
  });

  it("defaults to the working state and the Loading label", () => {
    render(<DotGridIcon />);
    const svg = screen.getByRole("status", { name: "Loading" });
    expect(svg.dataset.state).toBe("working");
  });

  it("swallows the AbortError from cancelled animations on unmount", async () => {
    const unhandled = vi.fn();
    process.on("unhandledRejection", unhandled);
    try {
      const { unmount } = render(<DotGridIcon state="waiting" />);
      unmount();
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(unhandled).not.toHaveBeenCalled();
    } finally {
      process.off("unhandledRejection", unhandled);
    }
  });
});
