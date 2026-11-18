import type { PaperShaderElement } from "@paper-design/shaders";
import { ImageDithering } from "@paper-design/shaders-react";
import { type ComponentProps, useEffect, useRef, useState } from "react";
import { useShaderClock } from "@/primitives/dither";
import { useShaderEnvironment } from "@/primitives/dither/use-shader-environment";
import {
  DITHER_CONTEXT_ATTRIBUTES,
  type BackgroundEffect as Effect,
  WALLPAPER_DITHER,
} from "@/tokens/effects";
import {
  type BackgroundAdjustments,
  type BackgroundRotation,
  useResolvedMode,
} from "../model/appearance-store";

export type BackgroundEffectProps = ComponentProps<"div"> & {
  effect?: Effect;
};

/** The effect layer over a dashboard background; grain and vignette come from tokens/effects.css. */
export function BackgroundEffect({ effect, ...props }: BackgroundEffectProps) {
  return <div data-slot="background-effect" data-effect={effect} {...props} />;
}

/**
 * Capy caps the dither at one shader pixel per CSS pixel of the surface and
 * pixelates the canvas when it scales up, so a retina display gets the same
 * dither cell as a 1x one.
 */
function useMaxPixelCount() {
  const ref = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    const element = ref.current;
    if (element === null) return;
    const measure = () => {
      const { width, height } = element.getBoundingClientRect();
      setCount(Math.max(1, Math.ceil(width * height)));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, count] as const;
}

/** A GIF animates itself, so Capy leaves it undithered rather than freeze one frame. */
const isGif = (image: string) => image.startsWith("data:image/gif");

/**
 * Dashboard background with Capy's adjustments: brightness, blur, opacity, fade
 * and overlay. The wallpaper is dimmed to 60% in light and 70% in dark before
 * the sliders scale it, which is what keeps the composer readable over it.
 *
 * The dither is Paper's image shader over the same image, at 8x8 Bayer, two
 * pixels per cell, four colour steps and the image's own colours — Capy's
 * wallpaper dither, drawn on a canvas the surface's own size.
 */
export function DashboardBackdrop({
  image,
  effect,
  appearance,
  rotation = 0,
}: {
  image: string;
  effect: Effect;
  appearance: BackgroundAdjustments;
  rotation?: BackgroundRotation;
}) {
  const dark = useResolvedMode() === "dark";
  const [ref, maxPixelCount] = useMaxPixelCount();
  // Capy turns the image layer and never the shader; a background it turns is a
  // GIF, and a GIF is the one file it leaves undithered.
  const turned = rotation === 90 || rotation === 270;
  const dither =
    effect === "dither" &&
    rotation === 0 &&
    !isGif(image) &&
    maxPixelCount !== null;
  const { ready, reducedMotion } = useShaderEnvironment();
  const shader = useRef<PaperShaderElement>(null);
  // The pattern advances on the same clock the rest of the app's shaders use,
  // and holds still under reduced motion.
  useShaderClock(shader, {
    animate: ready && !reducedMotion && dither,
    frame: 0,
    speed: WALLPAPER_DITHER.speed,
    fps: WALLPAPER_DITHER.fps,
  });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        ref={ref}
        className="absolute inset-0 [container-type:size]"
        style={{
          opacity: (appearance.opacity / 100) * (dark ? 0.7 : 0.6),
          filter: `brightness(${appearance.brightness}%) blur(${appearance.blur / 16}rem)`,
        }}
      >
        <div
          className="kiki-backdrop-image"
          data-rotated={turned}
          style={{
            backgroundImage: `url("${image}")`,
            transform: turned
              ? `translate(-50%, -50%) rotate(${rotation}deg)`
              : rotation === 180
                ? "rotate(180deg)"
                : undefined,
          }}
        />
        {dither ? (
          <ImageDithering
            ref={shader}
            className="[&_canvas]:[image-rendering:pixelated] [&_canvas]:transition-opacity [&_canvas]:duration-slower [&_canvas]:starting:opacity-0"
            width="100%"
            height="100%"
            minPixelRatio={WALLPAPER_DITHER.minPixelRatio}
            maxPixelCount={maxPixelCount}
            webGlContextAttributes={DITHER_CONTEXT_ATTRIBUTES}
            image={image}
            fit={WALLPAPER_DITHER.fit}
            type={WALLPAPER_DITHER.type}
            size={WALLPAPER_DITHER.size}
            colorSteps={WALLPAPER_DITHER.colorSteps}
            originalColors={WALLPAPER_DITHER.originalColors}
            speed={WALLPAPER_DITHER.speed}
            frame={0}
          />
        ) : null}
        <BackgroundEffect
          effect={effect}
          className="pointer-events-none absolute inset-0"
        />
      </div>
      <div
        className="absolute inset-0 bg-bg"
        style={{ opacity: appearance.overlay / 100 }}
      />
      <div
        className="absolute inset-0"
        style={{ opacity: appearance.fade / 100 }}
      >
        <div
          className="absolute inset-0 hidden dark:block"
          style={{
            backgroundImage:
              "linear-gradient(to bottom, transparent 12%, color-mix(in srgb, var(--panel) 30%, transparent) 34%, color-mix(in srgb, var(--panel) 68%, transparent) 52%, color-mix(in srgb, var(--panel) 92%, transparent) 70%, var(--panel) 88%)",
          }}
        />
        <div
          className="absolute inset-0 dark:hidden"
          style={{
            backgroundImage:
              "linear-gradient(to bottom, transparent 30%, color-mix(in srgb, var(--panel) 48%, transparent) 48%, color-mix(in srgb, var(--panel) 86%, transparent) 66%, var(--panel) 82%)",
          }}
        />
      </div>
    </div>
  );
}
