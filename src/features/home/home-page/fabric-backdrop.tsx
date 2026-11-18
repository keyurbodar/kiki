import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { FabricViewportHost } from "@/features/thread-panes/fabric-viewport";
import {
  DitherShader,
  SHADER_TRANSPARENT,
  useShaderEnvironment,
} from "@/primitives/dither";
import { type BackgroundEffect, DITHER_COVER } from "@/tokens/effects";

const FABRIC_FADE_MS = 900;

const mixHexColors = (from: string, to: string, amount: number): string => {
  const channels = [1, 3, 5].map((i) =>
    Number.parseInt(from.slice(i, i + 2), 16),
  );
  const target = [1, 3, 5].map((i) => Number.parseInt(to.slice(i, i + 2), 16));
  return `#${channels
    .map((value, i) =>
      Math.round(value + ((target[i] ?? value) - value) * amount)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
};

type PanelBox = {
  x: number;
  y: number;
  width: number;
  height: number;
  radii: ReadonlyArray<number>;
};

type Side = "top" | "right" | "bottom" | "left";

/** The radii the clipping container rounds the panel by, per corner, as Capy reads them. */
const readPanelRadii = (
  panel: HTMLElement,
  box: { top: number; right: number; bottom: number; left: number },
): ReadonlyArray<number> => {
  let container = panel.parentElement;
  while (container !== null) {
    const style = getComputedStyle(container);
    if (
      style.overflowX !== "visible" &&
      Number.parseFloat(style.borderTopLeftRadius) > 0
    )
      break;
    container = container.parentElement;
  }
  if (container === null) return [0, 0, 0, 0];
  const style = getComputedStyle(container);
  const frame = container.getBoundingClientRect();
  const border: Record<Side, number> = {
    top: Number.parseFloat(style.borderTopWidth) || 0,
    right: Number.parseFloat(style.borderRightWidth) || 0,
    bottom: Number.parseFloat(style.borderBottomWidth) || 0,
    left: Number.parseFloat(style.borderLeftWidth) || 0,
  };
  const flush: Record<Side, boolean> = {
    top: Math.abs(box.top - frame.top - border.top) <= 1,
    right: Math.abs(frame.right - border.right - box.right) <= 1,
    bottom: Math.abs(frame.bottom - border.bottom - box.bottom) <= 1,
    left: Math.abs(box.left - frame.left - border.left) <= 1,
  };
  const corner = (radius: string, first: Side, second: Side) =>
    flush[first] && flush[second]
      ? Math.max(
          0,
          Number.parseFloat(radius) - Math.max(border[first], border[second]),
        )
      : 0;
  return [
    corner(style.borderTopLeftRadius, "top", "left"),
    corner(style.borderTopRightRadius, "top", "right"),
    corner(style.borderBottomRightRadius, "bottom", "right"),
    corner(style.borderBottomLeftRadius, "bottom", "left"),
  ];
};

/** Capy's panel box: its own rect, extended upward under the safe area when it is flush to the top. */
const readPanelBox = (panel: HTMLElement): PanelBox => {
  const rect = panel.getBoundingClientRect();
  const box = {
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    left: rect.left,
  };
  const radii = readPanelRadii(panel, box);
  const safeTop =
    Number.parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--safe-top"),
    ) || 0;
  const bleed =
    rect.top > 0 &&
    rect.top <= safeTop + 0.5 &&
    radii[0] === 0 &&
    radii[1] === 0
      ? rect.top
      : 0;
  return {
    x: rect.x,
    y: rect.y - bleed,
    width: rect.width,
    height: rect.height + bleed,
    radii,
  };
};

/** Capy's fixed, panel-clipped fabric layer behind the /new and thread backdrops. */
export function FabricBackdrop({ effect }: { effect: BackgroundEffect }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const { ready, dark, reducedMotion, shaderInk, shaderMono } =
    useShaderEnvironment();
  const [mix, setMix] = useState(0);
  const visible = ready && !reducedMotion;

  /**
   * The panel is this layer's own parent: reading it from the DOM is the only
   * way to get it here, because a child's layout effect runs before React
   * attaches the ref of a host element further up the same commit.
   */
  useLayoutEffect(() => {
    const host = hostRef.current;
    const panel = host?.parentElement ?? null;
    if (host === null || panel === null) return;
    const sync = () => {
      const box = readPanelBox(panel);
      const frame = host.getBoundingClientRect();
      const width = Math.max(frame.width, box.width);
      const height = Math.max(frame.height, box.height);
      host.style.clipPath = `inset(${box.y - frame.y}px ${frame.right - box.x - box.width}px ${frame.bottom - box.y - box.height}px ${box.x - frame.x}px round ${box.radii.map((radius) => `${radius}px`).join(" ")})`;
      host.style.setProperty(
        "--fabric-mask-image",
        "var(--effect-fabric-mask-image)",
      );
      host.style.setProperty(
        "--fabric-mask-size",
        `${box.width}px ${box.height}px`,
      );
      host.style.setProperty("--fabric-mask-position", `${box.x}px ${box.y}px`);
      host.style.setProperty(
        "--fabric-area-left",
        `${box.x + box.width / 2 - width / 2 - frame.x}px`,
      );
      host.style.setProperty(
        "--fabric-area-top",
        `${box.y + box.height / 2 - height / 2 - frame.y}px`,
      );
      host.style.setProperty("--fabric-area-width", `${width}px`);
      host.style.setProperty("--fabric-area-height", `${height}px`);
    };
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(panel);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      setMix(Math.min(1, (now - start) / FABRIC_FADE_MS));
      if (now - start < FABRIC_FADE_MS) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [visible]);

  const colorFront = mixHexColors(shaderMono, shaderInk, mix);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0"
      ref={hostRef}
    >
      <div className="absolute inset-0 bg-panel" />
      <div className="absolute inset-0 [background-image:var(--gradient-panel-air)] dark:hidden" />
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {visible && effect === "dither" ? (
          <div
            data-fabric-mask
            className="pointer-events-none absolute inset-0"
            style={{
              maskImage: "var(--fabric-mask-image, none)",
              maskSize: "var(--fabric-mask-size)",
              maskPosition: "var(--fabric-mask-position)",
              maskRepeat: "no-repeat",
              opacity: dark ? 0.25 : 0.2,
              mixBlendMode: dark ? "screen" : "multiply",
            }}
          >
            <FabricViewportHost className="absolute inset-y-0 left-0 w-dvw">
              <DitherShader
                animate={!reducedMotion}
                frame={DITHER_COVER.fabricFrame}
                animationSpeed={DITHER_COVER.fabricSpeed}
                colorBack={SHADER_TRANSPARENT}
                colorFront={colorFront}
                shape={DITHER_COVER.shape}
                type={DITHER_COVER.type}
                size={DITHER_COVER.pixelSize}
                scale={DITHER_COVER.scale}
              />
            </FabricViewportHost>
          </div>
        ) : null}
      </div>
    </div>
  );
}
