import {
  act,
  cleanup,
  render,
  renderHook,
  screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ShimmerText, useShimmerState } from "./shimmer-text";

afterEach(cleanup);

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
