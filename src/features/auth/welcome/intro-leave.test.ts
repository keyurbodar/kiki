import { describe, expect, it } from "vitest";
import { leavingHref, parseCssDuration } from "./intro-leave";

const click = (target: EventTarget | null, keys: Partial<Record<"metaKey" | "ctrlKey" | "shiftKey", boolean>> = {}) => ({
  target,
  metaKey: false,
  ctrlKey: false,
  shiftKey: false,
  ...keys,
});

describe("parseCssDuration", () => {
  it("reads seconds and milliseconds", () => {
    expect(parseCssDuration("0.2s")).toBe(200);
    expect(parseCssDuration(" 150ms ")).toBe(150);
  });

  it("rejects anything else", () => {
    expect(parseCssDuration("")).toBeUndefined();
    expect(parseCssDuration("var(--x)")).toBeUndefined();
  });
});

describe("leavingHref", () => {
  it("finds the link a click lands in", () => {
    const link = document.createElement("a");
    link.setAttribute("href", "/sign-in");
    const label = document.createElement("span");
    link.append(label);
    expect(leavingHref(click(label))).toBe("/sign-in");
  });

  it("lets modified clicks and non-links through", () => {
    const link = document.createElement("a");
    link.setAttribute("href", "/sign-up");
    expect(leavingHref(click(link, { metaKey: true }))).toBeUndefined();
    expect(leavingHref(click(link, { ctrlKey: true }))).toBeUndefined();
    expect(leavingHref(click(document.createElement("div")))).toBeUndefined();
    expect(leavingHref(click(null))).toBeUndefined();
  });
});
