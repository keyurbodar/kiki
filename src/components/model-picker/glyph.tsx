import type { SVGProps } from "react";
import { type GlyphId, glyphs } from "./glyph-paths";

export type GlyphProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  name: GlyphId;
};

export function Glyph({ name, ...props }: GlyphProps) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" {...props}>
      {glyphs[name]}
    </svg>
  );
}
