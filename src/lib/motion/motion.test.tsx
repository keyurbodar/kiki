import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  motion,
  observeActive,
  prefersReducedMotion,
  usePrefersReducedMotion,
} from ".";

afterEach(cleanup);

describe("motion recipes", () => {
  it("use tokens instead of raw timings", () => {
    for (const value of Object.values(motion)) {
      expect(value).not.toMatch(/\d+m?s\b/);
      expect(value).not.toMatch(/\d+px/);
    }
  });

  it("drive Base UI enter and exit through data attributes", () => {
    for (const key of [
      "popup",
      "dialog",
      "backdrop",
      "fade",
      "sheetUp",
      "collapsible",
    ] as const) {
      expect(motion[key]).toContain("data-[starting-style]:");
      expect(motion[key]).toContain("data-[ending-style]:");
    }
    expect(motion.popup).toContain("data-[ending-style]:duration-exit");
  });
});

describe("reduced motion", () => {
  it("reads the media query", () => {
    const spy = vi.spyOn(window, "matchMedia");
    spy.mockReturnValue({
      matches: true,
      addEventListener() {},
      removeEventListener() {},
    } as unknown as MediaQueryList);
    expect(prefersReducedMotion()).toBe(true);
    expect(renderHook(() => usePrefersReducedMotion()).result.current).toBe(
      true,
    );
    spy.mockRestore();
  });
});

describe("observeActive", () => {
  it("subscribes and cleans up without throwing", () => {
    const el = document.createElement("div");
    document.body.append(el);
    const stop = observeActive(el, () => {});
    expect(typeof stop).toBe("function");
    stop();
    el.remove();
  });
});
