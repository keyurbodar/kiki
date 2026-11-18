import { TextMorph as TorphTextMorph } from "torph/react";

/**
 * Text that carries itself to its next value instead of being replaced, ported
 * from torph (MIT, dependency-free). Digits are matched first, so a currency
 * amount or a count morphs in place rather than blinking from one string to
 * another.
 *
 * The timing is not set here: it comes from the motion tokens, so the whole app
 * moves on one scale. torph's own default timing sits close to
 * `--duration-slow` and `--ease-out-quint`, which is what we pass.
 *
 * Like the toaster, this is the one import site: a raw `torph` import anywhere
 * else is a red test in text-morph.test.tsx.
 */

const readMs = (name: string, fallback: number) => {
  if (typeof document === "undefined") return fallback;
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  const value = Number.parseFloat(raw);
  if (!Number.isFinite(value)) return fallback;
  return raw.endsWith("ms") ? value : value * 1000;
};

const readEase = (name: string, fallback: string) => {
  if (typeof document === "undefined") return fallback;
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return raw === "" ? fallback : raw;
};

let cached: { duration: number; ease: string } | null = null;

/** The token timing, read once: tokens change with the theme, not per render. */
export function morphMotion() {
  if (cached === null) {
    cached = {
      duration: readMs("--duration-slow", 300),
      ease: readEase("--ease-out-quint", "cubic-bezier(0.23, 1, 0.32, 1)"),
    };
  }
  return cached;
}

export type TextMorphProps = {
  /** The text to show. A React element throws: torph morphs text, not markup. */
  children: string | number;
  className?: string;
  /** The element to render, `span` unless the text is a heading. */
  as?: "span" | "div" | "p" | "h1" | "h2" | "h3";
};

export function TextMorph({ children, className, as }: TextMorphProps) {
  const { duration, ease } = morphMotion();
  return (
    <TorphTextMorph
      duration={duration}
      ease={ease}
      className={className}
      as={as}
    >
      {children}
    </TorphTextMorph>
  );
}
