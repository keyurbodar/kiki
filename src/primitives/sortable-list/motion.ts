export type SettleMotion = { duration: number; easing: string };

let cached: SettleMotion | undefined;

export function parseDuration(value: string): number {
  const trimmed = value.trim();
  const amount = Number.parseFloat(trimmed);
  if (!Number.isFinite(amount)) return 0;
  return trimmed.endsWith("ms") ? amount : amount * 1000;
}

export function settleMotion(): SettleMotion {
  if (cached !== undefined) return cached;
  if (typeof document === "undefined") return { duration: 0, easing: "ease" };
  const style = getComputedStyle(document.documentElement);
  const easing = style.getPropertyValue("--ease-out-quint").trim();
  cached = {
    duration: parseDuration(style.getPropertyValue("--duration-fast")),
    easing: easing === "" ? "ease" : easing,
  };
  return cached;
}
