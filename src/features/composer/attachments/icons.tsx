import type { SVGProps } from "react";
import { Icon } from "@/primitives/icon";

type GlyphProps = Omit<SVGProps<SVGSVGElement>, "children" | "name">;

export function ImagesIcon({ className, ...props }: GlyphProps) {
  return (
    <Icon
      name="images-1"
      size={className ? undefined : "base"}
      className={className}
      {...props}
    />
  );
}

export function CrossMediumIcon({ className, ...props }: GlyphProps) {
  return (
    <Icon
      name="cross-medium"
      size={className ? undefined : "base"}
      className={className}
      {...props}
    />
  );
}
