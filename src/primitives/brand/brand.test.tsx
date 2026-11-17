import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CAPY_ILLUSTRATION_NAMES } from "@/assets/brand";
import {
  AppIcon,
  CaptainMark,
  CapyIllustration,
  Wordmark,
} from "@/primitives/brand";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const faceOf = (el: HTMLElement) =>
  el
    .querySelector("svg[data-scheme=dark] use[href*='#face-']")
    ?.getAttribute("href");

describe("Wordmark", () => {
  it("renders light and dark art with Capy's label and slot", () => {
    render(<Wordmark />);
    const mark = screen.getByRole("img", { name: "Capy" });
    expect(mark.dataset.slot).toBe("wordmark");
    expect(mark.className).toContain("inline-flex h-6 items-center");
    const schemes = [...mark.querySelectorAll("svg")].map(
      (s) => s.dataset.scheme,
    );
    expect(schemes).toEqual(["light", "dark"]);
    expect(mark.querySelector("use[href$='#light-under']")).not.toBeNull();
    expect(mark.querySelector("use[href$='#dark-over']")).not.toBeNull();
    expect(faceOf(mark)).toBeUndefined();
  });

  it("pins a face and nests the light face in Capy's transform", () => {
    render(<Wordmark face={3} />);
    const mark = screen.getByRole("img", { name: "Capy" });
    expect(faceOf(mark)).toMatch(/#face-3$/);
    expect(
      mark.querySelector("svg[data-scheme=light] g[transform] use"),
    ).not.toBeNull();
  });

  it("cycles faces every 250ms on hover and resets on leave", () => {
    vi.useFakeTimers();
    render(<Wordmark faces />);
    const mark = screen.getByRole("img", { name: "Capy" });
    fireEvent.pointerEnter(mark);
    expect(mark.dataset.face).toBe("1");
    act(() => vi.advanceTimersByTime(250));
    expect(mark.dataset.face).toBe("2");
    for (let i = 0; i < 3; i++) act(() => vi.advanceTimersByTime(250));
    expect(mark.dataset.face).toBe("5");
    act(() => vi.advanceTimersByTime(250));
    expect(mark.dataset.face).toBeUndefined();
    fireEvent.pointerEnter(mark);
    fireEvent.pointerLeave(mark);
    expect(mark.dataset.face).toBeUndefined();
  });

  it("ignores hover unless faces is on", () => {
    render(<Wordmark />);
    const mark = screen.getByRole("img", { name: "Capy" });
    fireEvent.pointerEnter(mark);
    expect(mark.dataset.face).toBeUndefined();
  });
});

describe("illustrations", () => {
  it("lists Capy's twelve poses", () => {
    expect(CAPY_ILLUSTRATION_NAMES).toHaveLength(12);
    expect(CAPY_ILLUSTRATION_NAMES).toContain("capySpring");
  });

  it("renders a pose as a non-draggable decorative image", () => {
    const { container } = render(
      <CapyIllustration name="sail" className="size-10" />,
    );
    const img = container.querySelector("img");
    expect(img?.dataset.slot).toBe("capy-illustration");
    expect(img?.dataset.illustration).toBe("sail");
    expect(img?.getAttribute("alt")).toBe("");
    expect(img?.getAttribute("draggable")).toBe("false");
    expect(img?.className).toBe("shrink-0 select-none size-10");
    expect(img?.getAttribute("src")).toContain("sail");
  });

  it("maps the Captain mark and app icon", () => {
    const { container } = render(
      <>
        <CaptainMark />
        <AppIcon />
      </>,
    );
    expect(
      container.querySelector("[data-illustration=captain]"),
    ).not.toBeNull();
    expect(
      screen.getByAltText("Capy").closest("[data-slot=app-icon]"),
    ).not.toBeNull();
  });
});
