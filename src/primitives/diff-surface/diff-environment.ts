import { useSyncExternalStore } from "react";
import { DIFF_METRICS } from "./diff-surface-model";

const noop = () => {};
const subscribeNever = () => noop;

export const useIsClient = () =>
  useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );

const isDark = () => document.documentElement.classList.contains("dark");

const subscribeTheme = (onChange: () => void) => {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
};

export const useDiffThemeType = (): "light" | "dark" =>
  useSyncExternalStore(
    subscribeTheme,
    () => (isDark() ? "dark" : "light"),
    () => "light",
  );

let measuredLineHeight = DIFF_METRICS.lineHeight;
let probe: HTMLSpanElement | null = null;
let probeObserver: ResizeObserver | null = null;
const lineHeightListeners = new Set<() => void>();

const measureLineHeight = () => {
  if (probe === null) return;
  const height = probe.getBoundingClientRect().height;
  if (height <= 0 || Math.abs(height - measuredLineHeight) < 0.05) return;
  measuredLineHeight = height;
  for (const listener of lineHeightListeners) listener();
};

const subscribeLineHeight = (onChange: () => void) => {
  lineHeightListeners.add(onChange);
  if (probe === null) {
    probe = document.createElement("span");
    probe.className = "diff-surface diff-line-probe";
    probe.setAttribute("aria-hidden", "true");
    probe.textContent = "0";
    document.body.append(probe);
    if (typeof ResizeObserver !== "undefined") {
      probeObserver = new ResizeObserver(measureLineHeight);
      probeObserver.observe(probe);
    }
    measureLineHeight();
  }
  return () => {
    lineHeightListeners.delete(onChange);
    if (lineHeightListeners.size > 0 || probe === null) return;
    probeObserver?.disconnect();
    probeObserver = null;
    probe.remove();
    probe = null;
  };
};

export const useDiffLineHeight = () =>
  useSyncExternalStore(
    subscribeLineHeight,
    () => measuredLineHeight,
    () => DIFF_METRICS.lineHeight,
  );

let scrollbarSize: number | null = null;

const subscribeScrollbar = (onChange: () => void) => {
  if (scrollbarSize === null) {
    const host = document.createElement("div");
    host.setAttribute("aria-hidden", "true");
    host.style.cssText =
      "position:fixed;top:-12rem;left:-12rem;visibility:hidden;pointer-events:none";
    const box = document.createElement("div");
    box.style.cssText = "width:6rem;height:6rem;overflow:scroll";
    host.attachShadow({ mode: "open" }).append(box);
    document.body.append(host);
    scrollbarSize = Math.max(0, box.offsetHeight - box.clientHeight);
    host.remove();
    if (scrollbarSize !== 0) onChange();
  }
  return noop;
};

export const useScrollbarGutter = () =>
  useSyncExternalStore(
    subscribeScrollbar,
    () => scrollbarSize ?? 0,
    () => 0,
  );
