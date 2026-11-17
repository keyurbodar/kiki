import type { PaperShaderElement } from "@paper-design/shaders";
import { Dithering, type DitheringProps } from "@paper-design/shaders-react";
import { cx } from "class-variance-authority";
import {
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { SHADER_CONTEXT_ATTRIBUTES } from "./use-shader-environment";

type VisibilityListener = (visible: boolean) => void;

const tracked = new Map<
  Element,
  { inView: boolean; listeners: Set<VisibilityListener> }
>();
let observer: IntersectionObserver | null = null;
const pageVisible = () => document.visibilityState === "visible";
const notifyAll = () => {
  for (const entry of tracked.values())
    for (const listener of entry.listeners)
      listener(entry.inView && pageVisible());
};

/** Shared IntersectionObserver plus page visibility: one per document, as in Capy. */
function watchVisibility(element: Element, listener: VisibilityListener) {
  if (observer === null) {
    observer = new IntersectionObserver((entries) => {
      for (const change of entries) {
        const entry = tracked.get(change.target);
        if (entry === undefined) continue;
        entry.inView = change.isIntersecting;
        for (const l of entry.listeners) l(entry.inView && pageVisible());
      }
    });
    document.addEventListener("visibilitychange", notifyAll);
  }
  const entry = tracked.get(element) ?? { inView: false, listeners: new Set() };
  if (entry.listeners.size === 0) {
    tracked.set(element, entry);
    observer.observe(element);
  }
  entry.listeners.add(listener);
  return () => {
    entry.listeners.delete(listener);
    if (entry.listeners.size > 0) return;
    tracked.delete(element);
    observer?.unobserve(element);
    if (tracked.size > 0) return;
    observer?.disconnect();
    observer = null;
    document.removeEventListener("visibilitychange", notifyAll);
  };
}

/** Drive the shader's frame ourselves at a capped fps, only while it is on screen. */
function useShaderClock(
  ref: RefObject<PaperShaderElement | null>,
  {
    animate,
    frame,
    speed,
    fps = 30,
  }: { animate: boolean; frame: number; speed: number; fps?: number },
) {
  const elapsed = useRef(0);
  useEffect(() => {
    const element = ref.current;
    if (!animate || element === null) return;
    const step = 1000 / fps;
    let raf = 0;
    let last: number | null = null;
    let painted: number | null = null;
    const tick = (now: number) => {
      if (last !== null)
        elapsed.current += Math.min(now - last, step * 2) * speed;
      last = now;
      if (painted === null || now - painted >= step) {
        element.paperShaderMount?.setFrame(frame + elapsed.current);
        painted =
          painted === null
            ? now
            : painted + step * Math.max(1, Math.floor((now - painted) / step));
      }
      raf = requestAnimationFrame(tick);
    };
    const stop = watchVisibility(element, (visible) => {
      cancelAnimationFrame(raf);
      if (!visible) return;
      last = null;
      painted = null;
      raf = requestAnimationFrame(tick);
    });
    return () => {
      stop();
      cancelAnimationFrame(raf);
    };
  }, [ref, animate, frame, speed, fps]);
}

/** Cap the backing store so each dither cell covers `size` CSS pixels. */
function usePixelBudget(size: number) {
  const [maxPixelCount, setMaxPixelCount] = useState<number | null>(null);
  const observeContainer = useCallback(
    (element: HTMLDivElement | null) => {
      if (!element) return;
      const measure = () => {
        const { width, height } = element.getBoundingClientRect();
        const next = Math.max(1, Math.ceil((width * height) / (size * size)));
        setMaxPixelCount((current) => (current === next ? current : next));
      };
      measure();
      const resize = new ResizeObserver(measure);
      resize.observe(element);
      return () => resize.disconnect();
    },
    [size],
  );
  return { maxPixelCount, observeContainer };
}

export type DitherShaderProps = Omit<
  DitheringProps,
  "speed" | "frame" | "size" | "ref"
> & {
  /** Dither cell size in CSS pixels. */
  size: number;
  /** Starting frame (time offset) of the pattern. */
  frame: number;
  animate: boolean;
  animationSpeed: number;
};

/** Capy's WebGL dither: Paper Shaders' Dithering, pixelated, clocked by Capy's frame loop. */
export function DitherShader({
  animate,
  frame,
  animationSpeed,
  size,
  className,
  ...props
}: DitherShaderProps) {
  const ref = useRef<PaperShaderElement>(null);
  const { maxPixelCount, observeContainer } = usePixelBudget(size);
  useShaderClock(ref, {
    animate: animate && maxPixelCount !== null,
    frame,
    speed: animationSpeed,
  });
  return (
    <div
      ref={observeContainer}
      data-slot="dither-shader"
      className="ph-no-capture h-full w-full"
    >
      {maxPixelCount === null ? null : (
        <Dithering
          ref={ref}
          className={cx("[&_canvas]:[image-rendering:pixelated]", className)}
          width="100%"
          height="100%"
          minPixelRatio={1}
          maxPixelCount={maxPixelCount}
          webGlContextAttributes={SHADER_CONTEXT_ATTRIBUTES}
          speed={0}
          frame={frame}
          size={size}
          {...props}
        />
      )}
    </div>
  );
}
