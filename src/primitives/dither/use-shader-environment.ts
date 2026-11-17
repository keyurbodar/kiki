import { useEffect, useState } from "react";
import { SHADER_INK_FALLBACK, SHADER_MONO_FALLBACK } from "@/tokens/effects";

/** Context attributes Capy creates every shader canvas with. */
export const SHADER_CONTEXT_ATTRIBUTES: WebGLContextAttributes = {
  alpha: true,
  antialias: false,
  depth: false,
  stencil: false,
  premultipliedAlpha: true,
  preserveDrawingBuffer: false,
};

/** Resolve any CSS colour (vars included) to the #rrggbb Paper Shaders expects. */
export function resolveShaderColor(color: string): string | undefined {
  const probe = document.createElement("div");
  probe.style.backgroundColor = color;
  document.body.append(probe);
  const computed = getComputedStyle(probe).backgroundColor;
  probe.remove();
  const ctx = document
    .createElement("canvas")
    .getContext("2d", { willReadFrequently: true });
  if (ctx === null) return undefined;
  ctx.fillStyle = computed;
  ctx.fillRect(0, 0, 1, 1);
  const [r = 0, g = 0, b = 0] = ctx.getImageData(0, 0, 1, 1).data;
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

const toLinear = (c: number) =>
  c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
const toGamma = (c: number) =>
  c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;

/**
 * The ink with its OKLCH chroma set to zero (Capy's relative-colour mono ink):
 * keep OKLab lightness, then a grey of that lightness is L³ in linear sRGB.
 */
export function monochrome(hex: string): string {
  const [r = 0, g = 0, b = 0] = [1, 3, 5].map((i) =>
    toLinear(Number.parseInt(hex.slice(i, i + 2), 16) / 255),
  );
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const lightness = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const grey = Math.round(
    Math.min(1, Math.max(0, toGamma(lightness ** 3))) * 255,
  );
  return `#${grey.toString(16).padStart(2, "0").repeat(3)}`;
}

export type ShaderEnvironment = {
  /** Mounted and WebGL2 is available. */
  ready: boolean;
  dark: boolean;
  reducedMotion: boolean;
  shaderInk: string;
  shaderMono: string;
  panel: string | undefined;
};

/** Theme and capability state every Capy dither reads; tracks theme and motion changes. */
export function useShaderEnvironment(): ShaderEnvironment {
  const [mounted, setMounted] = useState(false);
  const [webgl, setWebgl] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [dark, setDark] = useState(false);
  const [shaderInk, setShaderInk] = useState(SHADER_INK_FALLBACK);
  const [shaderMono, setShaderMono] = useState(SHADER_MONO_FALLBACK);
  const [panel, setPanel] = useState<string>();

  useEffect(() => {
    const gl = document
      .createElement("canvas")
      .getContext("webgl2", SHADER_CONTEXT_ATTRIBUTES);
    setWebgl(gl !== null);
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    const root = document.documentElement;
    const read = () => {
      setDark(root.classList.contains("dark"));
      setPanel(resolveShaderColor("var(--panel)"));
      const ink = resolveShaderColor("var(--shader-ink)");
      setShaderInk(ink ?? SHADER_INK_FALLBACK);
      setShaderMono(ink === undefined ? SHADER_MONO_FALLBACK : monochrome(ink));
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["class", "data-color-theme"],
    });
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(motion.matches);
    const onMotion = (event: MediaQueryListEvent) =>
      setReducedMotion(event.matches);
    motion.addEventListener("change", onMotion);
    setMounted(true);
    return () => {
      observer.disconnect();
      motion.removeEventListener("change", onMotion);
    };
  }, []);

  return {
    ready: mounted && webgl,
    dark,
    reducedMotion,
    shaderInk,
    shaderMono,
    panel,
  };
}
