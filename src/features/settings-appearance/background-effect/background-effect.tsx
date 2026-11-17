import type { ComponentProps } from "react";
import type { BackgroundEffect as Effect } from "@/tokens/effects";
import type { BackgroundAdjustments } from "../model/appearance-store";

export type BackgroundEffectProps = ComponentProps<"div"> & {
  effect?: Effect;
};

/** The effect layer over a dashboard background; grain and vignette come from tokens/effects.css. */
export function BackgroundEffect({ effect, ...props }: BackgroundEffectProps) {
  return <div data-slot="background-effect" data-effect={effect} {...props} />;
}

/** Dashboard background with Capy's adjustments: brightness, blur, opacity, fade, overlay. */
export function DashboardBackdrop({
  image,
  effect,
  appearance,
}: {
  image: string;
  effect: Effect;
  appearance: BackgroundAdjustments;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0 [container-type:size]"
        style={{
          opacity: appearance.opacity / 100,
          filter: `brightness(${appearance.brightness}%) blur(${appearance.blur / 16}rem)`,
        }}
      >
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url("${image}")` }}
        />
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
