export function parseCssDuration(value: string): number | undefined {
  const match = /^\s*(-?\d*\.?\d+)(ms|s)\s*$/.exec(value);
  if (!match) return undefined;
  const amount = Number(match[1]);
  return match[2] === "s" ? amount * 1000 : amount;
}

export function leaveDelay(root: Element = document.documentElement): number {
  return (
    parseCssDuration(
      getComputedStyle(root).getPropertyValue("--duration-base"),
    ) ?? 0
  );
}

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

type ClickLike = {
  target: EventTarget | null;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
};

export function leavingHref(event: ClickLike): string | undefined {
  if (event.metaKey || event.ctrlKey || event.shiftKey) return undefined;
  if (!(event.target instanceof Element)) return undefined;
  return event.target.closest("a[href]")?.getAttribute("href") ?? undefined;
}
