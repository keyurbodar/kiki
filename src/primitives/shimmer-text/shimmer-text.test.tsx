import {
  act,
  cleanup,
  render,
  renderHook,
  screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ShimmerText, useShimmerState } from "./shimmer-text";

class FakeCssAnimation {
  effect = { getComputedTiming: () => ({ progress: 0.25 }) };
  play = vi.fn();
  pause = vi.fn();
  playState = "running";
  startTime: number | null = 0;
}

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

const seekTimeline = (currentTime: number) =>
  Object.defineProperty(document, "timeline", {
    configurable: true,
    value: { currentTime },
  });

/** Puts a CSS sweep animation and an `animate` spy on the rendered span. */
function mockSweep(): {
  sweep: FakeCssAnimation;
  animate: ReturnType<typeof vi.fn>;
} {
  const sweep = new FakeCssAnimation();
  const el = screen.getByText("Working") as HTMLSpanElement;
  el.getAnimations = () => [sweep as unknown as Animation];
  const animate = vi.fn(() => ({}) as Animation);
  el.animate = animate;
  return { sweep, animate };
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  Reflect.deleteProperty(document, "timeline");
});

describe("ShimmerText", () => {
  it("renders the text-shimmer span in the live state", () => {
    render(<ShimmerText className="text-sm">Working</ShimmerText>);
    const el = screen.getByText("Working");
    expect(el.dataset.slot).toBe("shimmer-text");
    expect(el.dataset.state).toBe("live");
    expect(el.className).toBe("text-shimmer text-sm");
  });

  it("reflects the state prop", () => {
    render(<ShimmerText state="rest">Done</ShimmerText>);
    expect(screen.getByText("Done").dataset.state).toBe("rest");
  });

  it("phases the sweep from the document timeline, like Capy", () => {
    seekTimeline(1500);
    render(<ShimmerText>Working</ShimmerText>);
    expect(
      (screen.getByText("Working") as HTMLSpanElement).style.animationDelay,
    ).toBe("-1500ms");
  });

  it("glides the sweep to rest when it settles", () => {
    vi.stubGlobal("CSSAnimation", FakeCssAnimation);
    const { rerender } = render(
      <ShimmerText state="live">Working</ShimmerText>,
    );
    const { sweep, animate } = mockSweep();
    rerender(<ShimmerText state="settling">Working</ShimmerText>);
    expect(sweep.pause).toHaveBeenCalled();
    expect(animate).toHaveBeenCalledWith(
      [{ backgroundPosition: "50% 0" }, { backgroundPosition: "35% 0" }],
      {
        duration: 300,
        easing: "cubic-bezier(0.33, 0.67, 0.67, 1)",
        fill: "forwards",
      },
    );
  });

  it("snaps to rest under reduced motion without a glide", () => {
    vi.stubGlobal("CSSAnimation", FakeCssAnimation);
    reducedMotion(true);
    const { rerender } = render(
      <ShimmerText state="live">Working</ShimmerText>,
    );
    const { sweep, animate } = mockSweep();
    rerender(<ShimmerText state="settling">Working</ShimmerText>);
    expect(animate).not.toHaveBeenCalled();
    expect(sweep.pause).not.toHaveBeenCalled();
  });
});

describe("useShimmerState", () => {
  it("goes live, then settling, then rest", () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(
      ({ active }) => useShimmerState(active),
      {
        initialProps: { active: true },
      },
    );
    expect(result.current).toBe("live");
    rerender({ active: false });
    expect(result.current).toBe("settling");
    act(() => vi.advanceTimersByTime(400));
    expect(result.current).toBe("rest");
    vi.useRealTimers();
  });

  it("stays undefined when never active", () => {
    const { result } = renderHook(() => useShimmerState(false));
    expect(result.current).toBeUndefined();
  });
});
