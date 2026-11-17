import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PanZoom } from "./pan-zoom";
import { clampZoom, MIN_ZOOM, usePanZoom, ZOOM_STEP } from "./use-pan-zoom";

afterEach(cleanup);

describe("clampZoom", () => {
  it("keeps zoom between the bounds", () => {
    expect(clampZoom(10)).toBe(4);
    expect(clampZoom(0.01)).toBe(MIN_ZOOM);
    expect(clampZoom(2, 8, 0.5)).toBe(2);
  });
});

describe("usePanZoom", () => {
  const key = (k: string) =>
    ({
      key: k,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      target: document.body,
      preventDefault: () => {},
    }) as unknown as React.KeyboardEvent<HTMLElement>;

  it("zooms in and out by the step with + and -", () => {
    const { result } = renderHook(() => usePanZoom());
    act(() => result.current.onKeyDown(key("+")));
    expect(result.current.zoom).toBeCloseTo(ZOOM_STEP);
    act(() => result.current.onKeyDown(key("-")));
    expect(result.current.zoom).toBeCloseTo(1);
  });

  it("resets zoom and pan with 0", () => {
    const { result } = renderHook(() => usePanZoom());
    act(() => {
      result.current.setZoom(3);
      result.current.setPan({ x: 10, y: 5 });
    });
    act(() => result.current.onKeyDown(key("0")));
    expect(result.current.zoom).toBe(1);
    expect(result.current.pan).toEqual({ x: 0, y: 0 });
  });

  it("ignores modified keys", () => {
    const { result } = renderHook(() => usePanZoom());
    act(() =>
      result.current.onKeyDown({
        ...key("+"),
        metaKey: true,
      } as React.KeyboardEvent<HTMLElement>),
    );
    expect(result.current.zoom).toBe(1);
  });

  it("toggles between fit and 2x", () => {
    const { result } = renderHook(() => usePanZoom());
    act(() => result.current.toggleZoom(0, 0));
    expect(result.current.zoom).toBe(2);
    act(() => result.current.toggleZoom(0, 0));
    expect(result.current.zoom).toBe(1);
    expect(result.current.pan).toEqual({ x: 0, y: 0 });
  });

  it("tracks drag distance for click detection", () => {
    const { result } = renderHook(() => usePanZoom());
    expect(result.current.dragged()).toBe(false);
    act(() => result.current.setDragged(true));
    expect(result.current.dragged()).toBe(true);
  });
});

describe("PanZoom", () => {
  it("renders the zoom bar and zooms with its buttons", () => {
    const { container, getByLabelText } = render(
      <PanZoom>
        <span>diagram</span>
      </PanZoom>,
    );
    const content = container.querySelector<HTMLElement>(
      '[data-slot="pan-zoom-content"]',
    );
    expect(getByLabelText("Zoom out")).toBeTruthy();
    expect(container.textContent).toContain("100%");
    fireEvent.click(getByLabelText("Zoom in"));
    expect(content?.style.transform).toContain(`scale(${ZOOM_STEP})`);
    fireEvent.click(getByLabelText("Reset view (0)"));
    expect(content?.style.transform).toContain("scale(1)");
  });

  it("hides the zoom bar when controls is false", () => {
    const { queryByLabelText } = render(<PanZoom controls={false} />);
    expect(queryByLabelText("Zoom in")).toBeNull();
  });
});
