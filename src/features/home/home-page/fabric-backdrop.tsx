import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { FabricViewportHost } from "@/features/thread-panes/fabric-viewport";
import {
  DitherShader,
  SHADER_TRANSPARENT,
  useShaderEnvironment,
} from "@/primitives/dither";
import { DITHER_COVER } from "@/tokens/effects";

const FABRIC_BLEED = 400;
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
};

const readPanelBox = (panel: HTMLElement): PanelBox => {
  const rect = panel.getBoundingClientRect();
  const parent = panel.parentElement;
  if (parent === null)
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  const styles = getComputedStyle(parent);
  const radius = Math.min(
    Number.parseFloat(styles.borderTopLeftRadius) || 0,
    Number.parseFloat(styles.borderTopRightRadius) || 0,
    Number.parseFloat(styles.borderBottomLeftRadius) || 0,
    Number.parseFloat(styles.borderBottomRightRadius) || 0,
  );
  const inset = Math.min(radius, 11);
  return {
    x: rect.x + inset,
    y: rect.y + inset,
    width: Math.max(0, rect.width - inset * 2),
    height: Math.max(0, rect.height - inset * 2),
  };
};

/** Capy's fixed, panel-clipped fabric layer behind the /new and thread backdrops. */
export function FabricBackdrop({
  panelRef,
}: {
  panelRef: React.RefObject<HTMLElement | null>;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const { ready, dark, reducedMotion, shaderInk, shaderMono } =
    useShaderEnvironment();
  const [mix, setMix] = useState(0);
  const visible = ready && !reducedMotion;

  useLayoutEffect(() => {
    const host = hostRef.current;
    const panel = panelRef.current;
    if (host === null || panel === null) return;
    const sync = () => {
      const box = readPanelBox(panel);
      const frame = host.getBoundingClientRect();
      const width = Math.max(frame.width, box.width);
      const height = Math.max(frame.height, box.height + FABRIC_BLEED);
      host.style.clipPath = `inset(${box.y}px ${frame.width - box.x - box.width}px ${frame.height - box.y - box.height}px ${box.x}px round var(--radius-card))`;
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
        `${box.y + (box.height + FABRIC_BLEED) / 2 - height / 2 - frame.y}px`,
      );
      host.style.setProperty("--fabric-area-width", `${width}px`);
      host.style.setProperty("--fabric-area-height", `${height}px`);
    };
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(panel);
    return () => observer.disconnect();
  }, [panelRef]);

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
        {visible ? (
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
