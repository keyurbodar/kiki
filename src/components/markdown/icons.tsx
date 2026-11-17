import type { SVGProps } from "react";
import { Icon } from "@/primitives/icon";

type GlyphProps = Omit<SVGProps<SVGSVGElement>, "children" | "name">;

export const ExpandIcon = (props: GlyphProps) => (
  <Icon name="expand-45" size="base" {...props} />
);

export const WindowAppIcon = (props: GlyphProps) => (
  <Icon name="window-app" size="base" {...props} />
);

export const MinusSmallIcon = (props: GlyphProps) => (
  <Icon name="minus-small" size="base" {...props} />
);

export const PlusLargeIcon = (props: GlyphProps) => (
  <Icon name="plus-large" size="base" {...props} />
);

export const RotateLeftIcon = (props: GlyphProps) => (
  <Icon name="arrow-rotate-counter-clockwise" size="base" {...props} />
);

export const ClipboardIcon = (props: GlyphProps) => (
  <Icon name="clipboard" size="base" {...props} />
);

export const CheckmarkIcon = (props: GlyphProps) => (
  <Icon name="checkmark-1" size="base" {...props} />
);

export const ArrowUpRightIcon = (props: GlyphProps) => (
  <Icon name="arrow-up-right" size="base" {...props} />
);

export const PinIcon = (props: GlyphProps) => (
  <Icon name="pin-outline" size="base" {...props} />
);

export const PinFilledIcon = (props: GlyphProps) => (
  <Icon name="pin" size="base" {...props} />
);
