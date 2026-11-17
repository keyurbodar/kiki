import { DITHER_COVER } from "@/tokens/effects";
import { DitherFill } from "./dither-fill";
import { DitherShader } from "./dither-shader";
import { SHADER_TRANSPARENT } from "./shader-colors";
import { useShaderEnvironment } from "./use-shader-environment";

const SERIES = [0.1, 0.35, 0.3, 0.6, 0.45, 0.8, 0.7, null, 0.4, 0.55];

export function DitherSpecimen() {
  const { ready, shaderInk } = useShaderEnvironment();
  return (
    <div
      data-specimen="dither"
      className="flex flex-col gap-8 p-8 text-foreground"
    >
      <DitherFill fractions={SERIES} className="h-16" />
      <div className="relative h-60 overflow-hidden rounded-(--radius-sm) bg-secondary">
        {ready ? (
          <DitherShader
            animate={false}
            frame={DITHER_COVER.fabricFrame}
            animationSpeed={DITHER_COVER.fabricSpeed}
            colorBack={SHADER_TRANSPARENT}
            colorFront={shaderInk}
            shape={DITHER_COVER.shape}
            type={DITHER_COVER.type}
            size={DITHER_COVER.pixelSize}
            scale={DITHER_COVER.scale}
          />
        ) : null}
      </div>
    </div>
  );
}
