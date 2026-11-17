import SHADER_COLORS from "./shader-colors.json";

/** Fully transparent back colour; Paper Shaders only parses hex, rgb and hsl strings. */
export const SHADER_TRANSPARENT: string = SHADER_COLORS.transparent;

/** Mix a #rrggbb colour toward white by amount (0-1), as Capy's cover does for its fabric. */
export function lightenHex(hex: string, amount: number): string {
  const channels = [1, 3, 5].map((i) =>
    Number.parseInt(hex.slice(i, i + 2), 16),
  );
  return (
    "#" +
    channels
      .map((v) =>
        Math.round(v + (255 - v) * amount)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}
