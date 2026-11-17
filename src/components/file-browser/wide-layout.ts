import { type RefObject, useEffect, useState } from "react";

export const wideLayoutToken = "--container-4xl";

export function cssLengthToPx(value: string, rootFontSize: number) {
  const trimmed = value.trim();
  const amount = Number.parseFloat(trimmed);
  if (!Number.isFinite(amount)) return undefined;
  return trimmed.endsWith("rem") ? amount * rootFontSize : amount;
}

export function useWideLayout(ref: RefObject<HTMLElement | null>) {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (element === null) return;
    const threshold = cssLengthToPx(
      getComputedStyle(element).getPropertyValue(wideLayoutToken),
      Number.parseFloat(getComputedStyle(document.documentElement).fontSize),
    );
    const observer = new ResizeObserver(([entry]) => {
      if (entry !== undefined && threshold !== undefined)
        setWide(entry.contentRect.width >= threshold);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return wide;
}
